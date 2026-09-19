/* ============================================================================
 * upsPod M1 设备总览 · 前端 SPA（app.js）
 * 结构：upsCore 纯逻辑（Node 可测，verify.cjs 入口） + 浏览器侧 Ractive 应用
 * 数据适配器：MockAdapter（确定性种子 + 10s 抖动）/ FinAdapter（桩，待 U-API-01）
 * 红线落实：R1 权限=站点过滤参数留位（无环境，标注未验）；R3 时效标注 ok/stale/gap
 * REQ-M1-10 v0.3：卡片双 sparkline（SOC 主 + 负载次）+ 断讯等高占位
 * REQ-M2-xx v0.4：设备详情 8 面板（告警只读 R2 / 参考值标记 D-M2-04）
 * REQ-M3-xx v0.5：历史趋势全量视图（跨度四档/事件锚点/缺口留白 R3，D-M3-01~08）
 * REQ-M4-xx v0.6：告警确认三段式（守门四路 gateAck/审计事件/行内确认，D-M4-01~05，首个写操作模块）
 * REQ-M5-xx v0.7：配置管理闭环（validateConfig 守门 V1~V4/append-only 版本/红冲回滚，D-M5-01~07，第二个写操作模块）
 * REQ-M6-xx v0.8：审计只读查询（queryAudit 四维/类型元数据/append-only 视图，D-M6-01~05，消费方模块零发射源）
 * 版本 0.8.1
 * ==========================================================================*/
(function (global) {
  "use strict";

  /* ---------------- upsCore：纯逻辑 ---------------- */
  var SEV_RANK = { critical: 0, warning: 1, normal: 2, commLost: 3 };

  function topSeverity(u) {
    if (u.commLost) return "commLost";
    if (u.mode === "battery" && u.soc !== null && u.soc < 30) return "critical";
    if (u.mode === "battery") return "warning";
    return "normal";
  }

  function classifyFreshness(ts, now, periodMs) {
    if (ts === null || ts === undefined) return "gap";       // 无值 → 缺口（R3）
    if (now - ts > 2 * periodMs) return "stale";             // 超时 → 参考值（R3）
    return "ok";
  }

  function filterUnits(units, f) {
    f = f || {};
    return units.filter(function (u) {
      if (f.site && u.siteId !== f.site) return false;
      if (f.comm === "lost" && !u.commLost) return false;
      if (f.comm === "ok" && u.commLost) return false;
      if (f.mode && u.mode !== f.mode) return false;
      if (f.sev && topSeverity(u) !== f.sev) return false;
      return true;
    });
  }

  function sortUnits(units) { // Q4：严重度 > 通讯状态 > 名称
    return units.slice().sort(function (a, b) {
      var d = SEV_RANK[topSeverity(a)] - SEV_RANK[topSeverity(b)];
      if (d !== 0) return d;
      if (a.commLost !== b.commLost) return a.commLost ? 1 : -1;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  }

  function statCounts(units) { // REQ-M1-03 徽标
    var c = { critical: 0, warning: 0, normal: 0, commLost: 0 };
    units.forEach(function (u) { c[topSeverity(u)]++; });
    return c;
  }

  function paginate(list, page, pageSize) {
    var pages = Math.max(1, Math.ceil(list.length / pageSize));
    page = Math.min(Math.max(1, page), pages);
    return { page: page, pages: pages, total: list.length,
             items: list.slice((page - 1) * pageSize, page * pageSize) };
  }

  function detectNewRisks(prevMap, units, now, periodMs) { // Q6：不自动重排，只提示
    var out = [];
    units.forEach(function (u) {
      var sev = topSeverity(u);
      var prev = prevMap[u.id];
      if (prev === undefined) return;               // 新上电不算"恶化"
      if (SEV_RANK[sev] < SEV_RANK[prev] && classifyFreshness(u.ts, now, periodMs) === "ok") {
        out.push({ id: u.id, name: u.name, from: prev, to: sev });
      }
    });
    return out;
  }

  function round1(v) { return Math.round(v * 10) / 10; }

  function sparklinePoints(history, w, h, lo, hi) { // REQ-M1-10：移植原型 demo index.html L1024
    if (!history || !history.length) return "";
    var min = typeof lo === "number" ? lo : Math.min.apply(null, history);
    var max = typeof hi === "number" ? hi : Math.max.apply(null, history);
    var range = (max - min) || 1;
    var step = history.length > 1 ? w / (history.length - 1) : 0;
    var pts = [];
    for (var i = 0; i < history.length; i++) {
      var x = round1(i * step);
      var y = round1(h - ((history[i] - min) / range) * h);
      pts.push(x + "," + y);
    }
    return pts.join(" ");
  }

  function rollHistory(arr, value, maxLen) { // 滚动窗口：追加+超窗移位（原型 L1271-73 先例）
    arr.push(value);
    if (arr.length > maxLen) arr.shift();
    return arr;
  }

  function hasTrend(unit) { // Q11：断讯/点数不足 → 不渲染趋势（R3）
    return !unit.commLost && Array.isArray(unit.socHistory) && unit.socHistory.length >= 2;
  }

  function buildDetail(units, id) { // REQ-M2-01：取详情；未找到 → null（fail-closed 不兜底）
    var u = units.find(function (x) { return x.id === id; });
    if (!u) return null;
    return { unit: u, detail: u.detail || null }; // 断讯/缺口 detail=null（D-M2-02，档案保留）
  }

  function pageFreshness(detail, now, periodMs) { // D-M2-05：各组取最差 gap > stale > ok
    if (!detail || !detail.ts) return "gap";
    var order = { ok: 0, stale: 1, gap: 2 }, worst = 0;
    Object.keys(detail.ts).forEach(function (k) {
      var f = classifyFreshness(detail.ts[k], now, periodMs);
      if (order[f] > worst) worst = order[f];
    });
    return worst === 2 ? "gap" : worst === 1 ? "stale" : "ok";
  }

  /* ---------------- M3 历史趋势：确定性派生（D-M3-01~06，Node 可测） ---------------- */
  var SPAN_SPECS = { // D-M3-01 跨度-粒度规则表（点数恒 ≤360 防 DOM 膨胀）
    "1h": { grainMs: 10000, slots: 360 },      // 10s 原始周期
    "24h": { grainMs: 300000, slots: 288 },    // 5min
    "7d": { grainMs: 1800000, slots: 336 },    // 30min
    "30d": { grainMs: 7200000, slots: 360 },   // 2h
  };
  var METRIC_DOMAIN = { soc: [20, 100, 70, 15], load: [15, 90, 45, 20], temp: [18, 38, 27, 6] }; // [min,max,base,amp]

  function spanSpec(span) { return SPAN_SPECS[span] || SPAN_SPECS["24h"]; }

  function hashStr(s) { // FNV-1a：派生序列的确定性根基
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function prnd3(a, b, c) { // mulberry32(unit|键|槽) → [0,1)，同入同出（TC-M3-逻辑-01）
    var t = hashStr(a + "|" + b + "|" + c);
    t = (t + 0x6D2B79F5) >>> 0;
    var r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }

  function deriveHistory(unit, metric, span, anchorMs) { // D-M3-05/06：值+空洞，全部确定性
    if (!unit) return [];
    var spec = SPAN_SPECS[span]; if (!spec) return [];
    var dom = METRIC_DOMAIN[metric]; if (!dom) return [];
    var grain = spec.grainMs, minT = anchorMs - (spec.slots - 1) * grain;
    var phase = (hashStr(unit.id + ":" + metric) % 628) / 100;
    var out = [];
    for (var i = 0; i < spec.slots; i++) {
      var t = minT + i * grain;
      var day = Math.floor(t / 86400000);
      if (prnd3(unit.id, day, "gap") < 0.06) { // D-M3-06：采集空洞（当天 1-3h 连续无数据）
        var gs = prnd3(unit.id, day, "gstart") * 20, gl = 1 + prnd3(unit.id, day, "glen") * 2;
        var gt = day * 86400000 + gs * 3600000;
        if (t >= gt && t < gt + gl * 3600000) continue; // 无点 = 留白，禁插值（R3/A15）
      }
      var frac = (t % 86400000) / 86400000;
      var v = dom[2] + dom[3] * Math.sin(2 * Math.PI * frac + phase)
        + (prnd3(unit.id, metric, Math.round(t / grain)) - 0.5) * 6;
      out.push({ t: t, v: Math.min(dom[1], Math.max(dom[0], Math.round(v * 10) / 10)) });
    }
    return out;
  }

  function deriveEvents(unit, span, anchorMs) { // D-M3-04：事故锚点（inputFail + 紧随 transferOk）
    if (!unit) return [];
    var spec = SPAN_SPECS[span] || SPAN_SPECS["24h"];
    var minT = anchorMs - (spec.slots - 1) * spec.grainMs, out = [];
    for (var d = Math.floor(minT / 86400000); d <= Math.floor(anchorMs / 86400000); d++) {
      if (prnd3(unit.id, d, "fail") < 0.08) {
        var t = d * 86400000 + prnd3(unit.id, d, "h") * 22 * 3600000;
        if (t >= minT && t <= anchorMs) {
          out.push({ type: "inputFail", t: t, ongoing: false });
          var dt = (2 + prnd3(unit.id, d, "dt") * 6) * 60000; // 2~8min 内切换成功
          if (t + dt <= anchorMs) out.push({ type: "transferOk", t: t + dt, ongoing: false });
        }
      }
    }
    if (unit.mode === "battery") out.push({ type: "inputFail", t: anchorMs, ongoing: true }); // 进行中事件
    out.sort(function (x, y) { return x.t - y.t; });
    return out;
  }

  function splitGaps(points, maxGapMs) { // 空洞切分：相邻点距 > maxGap → 分段（禁插值渲染依据）
    var segs = [], cur = [];
    (points || []).forEach(function (p) {
      if (cur.length && p.t - cur[cur.length - 1].t > maxGapMs) { segs.push(cur); cur = []; }
      cur.push(p);
    });
    if (cur.length) segs.push(cur);
    return segs;
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function timeTicks(anchorMs, span) { // x 轴 5 档刻度（本地时区）
    var spec = spanSpec(span), minT = anchorMs - (spec.slots - 1) * spec.grainMs, out = [];
    for (var i = 0; i < 5; i++) {
      var t = Math.round(minT + (anchorMs - minT) * i / 4), d = new Date(t);
      out.push({ t: t, label: span === "1h"
        ? pad2(d.getHours()) + ":" + pad2(d.getMinutes())
        : pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) });
    }
    return out;
  }

  function normalizeHistoryQuery(q) { // D-M3-07：非法参数 fail-closed 收敛默认（生效值明示）
    q = q || {};
    var valid = ["soc", "load", "temp"];
    var metrics = (q.metrics === undefined || q.metrics === null) ? ["soc", "load"] : String(q.metrics).split(",") // 缺省→默认；显式空→保持空（fail-closed 明示，不静默回弹）
      .filter(function (m) { return valid.indexOf(m) >= 0; })
      .filter(function (m, i, arr) { return arr.indexOf(m) === i; });
    return { metrics: metrics, span: SPAN_SPECS[q.span] ? q.span : "24h" };
  }

  function grainTextOf(grainMs) {
    return grainMs < 60000 ? (grainMs / 1000) + "s" : grainMs < 3600000 ? (grainMs / 60000) + "min" : (grainMs / 3600000) + "h";
  }

  /* -- M4 守门引擎（D-M4 详设 §1/§2；本项目首个写操作模块） -- */
  function collectAlarms(units) { // 聚合：拍平 detail.alarms，key=unitId#index，含档案字段（只读快照行）
    var rows = [];
    (units || []).forEach(function (u) {
      var arr = u.detail && u.detail.alarms ? u.detail.alarms : [];
      arr.forEach(function (a, i) {
        rows.push({ key: u.id + "#" + i, unitId: u.id, unitName: u.name, siteId: u.siteId,
          siteName: u.siteName, severity: a.severity, message: a.message, time: a.time, ack: !!a.ack });
      });
    });
    return rows;
  }

  function gateAck(alarm, note, ctx) { // 四路拒绝按序短路（存在→状态→备注→站点授权），reason 一律用户可读中文
    ctx = ctx || {};
    if (!alarm) return { ok: false, reason: "告警不存在（可能已归档）" };
    if (alarm.ack) return { ok: false, reason: "该告警已确认，不可重复操作（幂等保护）" };
    if (!note || String(note).trim().length < 2) return { ok: false, reason: "备注必填（至少 2 字）——留痕质量要求" };
    if (ctx.allowedSites && ctx.allowedSites.indexOf(ctx.siteId) < 0)
      return { ok: false, reason: "站点越权：不在授权范围" };
    return { ok: true };
  }

  function applyAck(units, auditLog, key, note, by, at, ctx) { // 状态机单向：通过则置位+发射审计事件，失败零副作用
    var p = String(key).split("#"), unitId = p[0], idx = parseInt(p[1], 10);
    var unit = (units || []).find(function (u) { return u.id === unitId; });
    var alarm = unit && unit.detail && unit.detail.alarms && !isNaN(idx) ? unit.detail.alarms[idx] : null;
    var g = gateAck(alarm, note, { allowedSites: ctx && ctx.allowedSites, siteId: unit ? unit.siteId : null });
    if (!g.ok) return g;
    alarm.ack = true; // 对象仍恰四字段（TC-M2-逻辑-04 不破）；by/at 只在审计事件
    auditLog.push({ seq: auditLog.length + 1, type: "alarm.ack", alarmKey: key, unitId: unitId,
      siteId: unit.siteId, severity: alarm.severity, message: alarm.message,
      note: String(note).trim(), by: by, at: at });
    return { ok: true };
  }

  function filterAlarms(rows, f) { // D-M4 §3 四维筛选 + 未确认优先（Q5 延续 M2 规）
    f = f || {};
    var out = (rows || []).filter(function (r) {
      if (f.site && r.siteId !== f.site) return false;
      if (f.sev && r.severity !== f.sev) return false;
      if (f.state === "unack" && r.ack) return false;
      if (f.state === "ack" && !r.ack) return false;
      if (f.unit && r.unitName.toLowerCase().indexOf(String(f.unit).toLowerCase()) < 0
                && r.unitId.toLowerCase().indexOf(String(f.unit).toLowerCase()) < 0) return false;
      return true;
    });
    return out.sort(function (a, b) {
      if (a.ack !== b.ack) return a.ack ? 1 : -1;
      return a.time < b.time ? 1 : a.time > b.time ? -1 : 0; // 同状态按时间倒序
    });
  }

  /* -- M5 配置管理（D-M5 详设 §2/§3；第二个写操作模块） -- */
  function cloneValues(v) { return JSON.parse(JSON.stringify(v)); }

  function validateConfig(values, defs, ctx) { // V1~V4 全量收集（非短路），fail-closed（A22 逐条明示）
    var reasons = [];
    values = values || {}; defs = defs || {}; ctx = ctx || {};
    Object.keys(defs).forEach(function (k) {
      var d = defs[k], v = values[k];
      if (v === undefined || v === null) { reasons.push("配置项 " + k + " 缺失"); return; }
      if (typeof v !== "number" || !isFinite(v)) { reasons.push(k + " 不是有效数值"); return; }
      if (v < d.min || v > d.max) reasons.push(k + " 超出允许范围（" + d.min + "~" + d.max + "）");
    });
    if (ctx.allowedSites && ctx.allowedSiteId && ctx.allowedSites.indexOf(ctx.allowedSiteId) < 0)
      reasons.push("站点越权：不在授权范围");
    return { ok: reasons.length === 0, reasons: reasons };
  }

  function diffSummary(defs, oldV, newV) { // 变更摘要（版本列表/审计用）
    var parts = [];
    Object.keys(defs).forEach(function (k) {
      if (oldV[k] !== newV[k]) parts.push(defs[k].label + " " + oldV[k] + "→" + newV[k]);
    });
    return parts.length ? "变更 " + parts.length + " 项：" + parts.join("；") : "无数值变更";
  }

  function effectiveConfig(store) { // 当前生效值（快照深拷贝；无当前版本 → null，fail-closed）
    var v = (store.versions || []).find(function (x) { return x.seq === store.currentSeq; });
    return v ? cloneValues(v.values) : null;
  }

  function publishConfig(store, auditLog, draft, by, at, ctx) { // 守门通过 → append-only 新版本（铁律 4）
    var g = validateConfig(draft, store.defs, ctx);
    if (!g.ok) return g; // 零副作用：versions/currentSeq/audit 不动
    var cur = effectiveConfig(store) || {};
    var seq = store.versions.length ? store.versions[store.versions.length - 1].seq + 1 : 1;
    var version = { seq: seq, at: at, by: by, kind: "publish", fromSeq: null,
      summary: diffSummary(store.defs, cur, draft), values: cloneValues(draft) };
    store.versions.push(version);
    store.currentSeq = seq;
    auditLog.push({ seq: auditLog.length + 1, type: "config.publish", versionSeq: seq, kind: "publish",
      summary: version.summary, by: by, at: at });
    return { ok: true, version: version };
  }

  function rollbackConfig(store, auditLog, targetSeq, by, at, ctx) { // 红冲：历史零修改，旧版内容 100% 重放（A23）
    var target = (store.versions || []).find(function (x) { return x.seq === targetSeq; });
    if (!target) return { ok: false, reasons: ["版本 " + targetSeq + " 不存在（可能已归档）"] };
    if (ctx && ctx.allowedSites && ctx.allowedSiteId && ctx.allowedSites.indexOf(ctx.allowedSiteId) < 0)
      return { ok: false, reasons: ["站点越权：不在授权范围"] };
    var seq = store.versions[store.versions.length - 1].seq + 1;
    var version = { seq: seq, at: at, by: by, kind: "rollback", fromSeq: targetSeq,
      summary: "回滚到 v" + targetSeq + "（红冲，历史零修改）", values: cloneValues(target.values) };
    store.versions.push(version);
    store.currentSeq = seq;
    auditLog.push({ seq: auditLog.length + 1, type: "config.rollback", versionSeq: seq, kind: "rollback",
      summary: version.summary, by: by, at: at });
    return { ok: true, version: version };
  }

  /* -- M6 审计（D-M6 详设 §1/§2；消费方模块：零发射源，只读查询 M4/M5 审计流） -- */
  var AUDIT_SINCE = { "1h": 3600000, "24h": 86400000, "7d": 604800000 }; // 相对档（Q2）
  var AUDIT_TYPES = { // 类型元数据三类钉死（Q5）
    "alarm.ack":       { label: "告警确认", cls: "tag-critical" },
    "config.publish":  { label: "配置发布", cls: "tag-normal" },
    "config.rollback": { label: "配置回滚", cls: "tag-warning" },
  };

  function collectOperators(events) { // Q3：操作者动态收集（去重升序）
    var set = {};
    (events || []).forEach(function (e) { if (e.by) set[e.by] = true; });
    return Object.keys(set).sort();
  }

  function queryAudit(events, f, now) { // 四维筛选 + seq 倒序；空结果=空数组（R3 不造假不兜底）
    f = f || {};
    var span = AUDIT_SINCE[f.since], kw = f.q ? String(f.q).toLowerCase() : "";
    return (events || []).filter(function (e) {
      if (f.type && e.type !== f.type) return false;
      if (f.by && e.by !== f.by) return false;
      if (span && !(typeof e.at === "number" && now - e.at <= span)) return false;
      if (kw) {
        var hay = [e.note, e.summary, e.message].filter(Boolean).join(" ").toLowerCase();
        if (hay.indexOf(kw) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return b.seq - a.seq; });
  }

  function auditDetailFields(e) { // 明细字段按类型（详设 §2；字段缺失 → 不渲染该行，不造假）
    if (e.type === "alarm.ack")
      return [{ k: "告警消息", v: e.message }, { k: "备注", v: e.note }, { k: "单元", v: e.unitId },
              { k: "站点", v: e.siteId }, { k: "严重度", v: e.severity }].filter(function (x) { return x.v !== undefined && x.v !== null; });
    if (e.type === "config.publish" || e.type === "config.rollback")
      return [{ k: "变更摘要", v: e.summary }, { k: "版本", v: e.versionSeq === undefined ? null : "v" + e.versionSeq }]
        .filter(function (x) { return x.v !== undefined && x.v !== null; });
    return [];
  }

  var upsCore = {
    SEV_RANK: SEV_RANK,
    topSeverity: topSeverity,
    classifyFreshness: classifyFreshness,
    filterUnits: filterUnits,
    sortUnits: sortUnits,
    statCounts: statCounts,
    paginate: paginate,
    detectNewRisks: detectNewRisks,
    sparklinePoints: sparklinePoints,
    rollHistory: rollHistory,
    hasTrend: hasTrend,
    buildDetail: buildDetail,
    pageFreshness: pageFreshness,
    spanSpec: spanSpec,
    deriveHistory: deriveHistory,
    deriveEvents: deriveEvents,
    splitGaps: splitGaps,
    timeTicks: timeTicks,
    normalizeHistoryQuery: normalizeHistoryQuery,
    grainTextOf: grainTextOf,
    collectAlarms: collectAlarms,
    gateAck: gateAck,
    applyAck: applyAck,
    filterAlarms: filterAlarms,
    validateConfig: validateConfig,
    diffSummary: diffSummary,
    effectiveConfig: effectiveConfig,
    publishConfig: publishConfig,
    rollbackConfig: rollbackConfig,
    AUDIT_TYPES: AUDIT_TYPES,
    AUDIT_SINCE: AUDIT_SINCE,
    collectOperators: collectOperators,
    queryAudit: queryAudit,
    auditDetailFields: auditDetailFields,
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = upsCore; return; }
  global.upsCore = upsCore;

  /* ---------------- 数据适配器 ---------------- */
  function genHistory(anchor, n, phase, amp) { // D-M1-12：确定性反推，锚定当前值，无墙钟无随机源
    var arr = [];
    for (var i = 0; i < n; i++)
      arr.push(round1(Math.min(100, Math.max(0, anchor + Math.sin(i * 1.7 + phase * 2.3) * amp))));
    return arr;
  }

  var MockAdapter = { // 确定性种子 + 10s 抖动；FinAdapter 待 U-API-01 后按同一接口实现
    seed: null,
    load: function () {
      return fetch("seed.json").then(function (r) { return r.json(); }).then(function (s) {
        var base = Date.now(); // Mock 演示墙钟：仅算偏移，种子文件本身仍确定性（TC-08 不受影响）
        s.units.forEach(function (u, idx) {
          u.ts = u.tsOffsetSec === null || u.tsOffsetSec === undefined ? null : base - u.tsOffsetSec * 1000; // 种子契约：偏移→绝对时间
          var dead = u.commLost || u.ts === null; // Q11/R3：断讯与缺口不生成趋势
          u.socHistory = dead || u.soc === null ? [] : genHistory(u.soc, 24, idx, 5);
          u.loadHistory = dead || u.loadPct === null ? [] : genHistory(u.loadPct, 24, idx + 7, 6);
        });
        MockAdapter.seed = s; return s;
      });
    },
    poll: function () { // 返回当前快照（引用同一数组，模拟实时）
      var s = MockAdapter.seed, now = Date.now();
      s.units.forEach(function (u, i) {
        if (u.commLost || u.ts === null) return;
        var j = Math.sin(now / 5000 + i) * 2; // 确定性抖动（无随机源，可复现）
        u.loadPct = Math.round(Math.min(95, Math.max(5, u.loadPct + j)));
        u.soc = u.mode === "battery" ? Math.max(10, u.soc - 0.1) : Math.min(100, u.soc + 0.05);
        u.ts = now;
        if (u.soc !== null) upsCore.rollHistory(u.socHistory, round1(u.soc), 24);       // REQ-M1-10 滚动
        if (u.loadPct !== null) upsCore.rollHistory(u.loadHistory, round1(u.loadPct), 24);
      });
      return Promise.resolve(s);
    },
    detail: function (id) { // REQ-M2-09：详情；组级 ts 由快照 ts 派生（Mock 同采集周期，D-M2-01）
      var found = upsCore.buildDetail(MockAdapter.seed.units, id);
      if (found && found.detail) { // 每次读派生（poll 已刷新 unit.ts，组级 ts 须跟随，否则组时效永远不更新）
        var ts = found.unit.ts;
        found.detail.ts = { battery: ts, load: ts, electronics: ts, environment: ts, transfer: ts };
      }
      return Promise.resolve(found);
    },
    history: function (id, query) { // REQ-M3-09/契约：运行时确定性派生（seed 不膨胀，D-M3-05）
      var found = upsCore.buildDetail(MockAdapter.seed.units, id);
      if (!found) return Promise.resolve(null); // 未知 id fail-closed
      var q = upsCore.normalizeHistoryQuery(query), anchor = Date.now(),
        spec = upsCore.spanSpec(q.span), series = {}, events = [];
      q.metrics.forEach(function (m) { series[m] = upsCore.deriveHistory(found.unit, m, q.span, anchor); });
      events = upsCore.deriveEvents(found.unit, q.span, anchor);
      return Promise.resolve({ series: series, events: events,
        meta: { span: q.span, grainMs: spec.grainMs, anchorTs: anchor, metrics: q.metrics } });
    },
  };
  var FinAdapter = { // 桩：对接 upsOverview()（fan/UpsPodLib.fan），U-API-01 解锁
    load: function () { return Promise.reject(new Error("FinAdapter 未实现：待 FIN 5.3.0 实例（U-API-01）")); },
    poll: function () { return this.load(); },
    detail: function () { return Promise.reject(new Error("FinAdapter.detail 未实现：待 FIN 5.3.0 实例（U-API-01）")); },
    history: function () { return Promise.reject(new Error("FinAdapter.history 未实现：hisRead 通道，待 FIN 5.3.0 实例（U-API-01）")); },
  };
  var adapter = /[?&]mock=0/.test(location.search) ? FinAdapter : MockAdapter; // R1 注：站点授权过滤在 FinAdapter 由 FIN 会话驱动；Mock 不过滤

  /* ---------------- 路由（SPA，D-06：# 号路由） ---------------- */
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    var parts = h.split("?");
    var segs = parts[0].split("/").filter(Boolean); // e.g. ["ups","overview"] / ["ups","unit","UPS-A01"]
    var q = {};
    (parts[1] || "").split("&").forEach(function (kv) {
      if (!kv) return; var p = kv.split("="); q[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
    });
    return { page: segs[1] || "overview", unitId: segs[2] || null, q: q };
  }

  /* ---------------- Ractive 应用 ---------------- */
  var ractive = null, prevSevMap = {}, snapshot = null, auditLog = []; // M4：审计事件流（boot 由 seed.auditLog 初始化，M6 消费同一数组）
  var configStore = null; // M5：配置版本库（boot 由 seed.configStore 初始化，运行期 append-only）

  function snapshotSev(units) {
    var m = {};
    units.forEach(function (u) { m[u.id] = upsCore.topSeverity(u); });
    return m;
  }

  function render() {
    var r = parseHash();
    if (r.page === "unit" && r.unitId) { renderUnit(r.unitId); return; } // M2 占位
    if (r.page === "history" && r.unitId) { renderHistory(r.unitId, r.q); return; } // M3：全量历史
    if (r.page === "alarms") { renderAlarms(r.q); return; } // M4：告警与确认（首个写操作模块）
    if (r.page === "config") { renderConfig(); return; } // M5：配置管理（第二个写操作模块）
    if (r.page === "audit") { renderAudit(r.q); return; } // M6：审计只读查询（消费方模块）
    renderOverview(r.q);
  }

  function renderOverview(q) {
    var filter = { site: q.site || "", comm: q.comm || "", mode: q.mode || "", sev: q.sev || "" };
    var page = parseInt(q.page || "1", 10), pageSize = parseInt(q.ps || "50", 10);
    var s = snapshot, now = Date.now(), period = s.pollPeriodMs;
    var filtered = upsCore.filterUnits(s.units, filter);
    var sorted = upsCore.sortUnits(filtered);
    var pg = upsCore.paginate(sorted, page, pageSize);
    var risks = upsCore.detectNewRisks(prevSevMap, s.units, now, period);
    var badgeSel = {}; if (filter.sev) badgeSel[filter.sev] = true;

    ractive.reset({
      view: "overview", sites: s.sites, filter: filter, pageSize: pageSize + "",
      stats: upsCore.statCounts(s.units), badges: pg.items.map(function (u) {
        var sev = upsCore.topSeverity(u);
        var show = upsCore.hasTrend(u); // Q11：断讯/缺口卡不渲染趋势
        return { unit: u, sev: sev, fresh: upsCore.classifyFreshness(u.ts, now, period),
                 tsText: u.ts === null ? "无数据" : new Date(u.ts).toLocaleTimeString(),
                 showTrend: show,
                 trendSoc: show ? upsCore.sparklinePoints(u.socHistory, 240, 60, 0, 100) : "",
                 trendLoad: show ? upsCore.sparklinePoints(u.loadHistory, 240, 50, 0, 100) : "" };
      }),
      pagination: pg, newRisks: risks, badgeSel: badgeSel,
    });
    prevSevMap = snapshotSev(snapshot.units);
  }

  function renderUnit(unitId) { // M2：8 面板全量渲染（详设 M2-详设 §1）
    var found = upsCore.buildDetail(snapshot.units, unitId);
    if (!found) { ractive.reset({ view: "unit", notFound: true, unitId: unitId, unit: null, detail: null }); return; }
    var u = found.unit, d = found.detail, now = Date.now(), period = snapshot.pollPeriodMs;
    if (d && !d.ts) { var ts0 = u.ts; d.ts = { battery: ts0, load: ts0, electronics: ts0, environment: ts0, transfer: ts0 }; } // D-M2-01
    var groupFresh = {};
    if (d) Object.keys(d.ts).forEach(function (k) { groupFresh[k] = upsCore.classifyFreshness(d.ts[k], now, period); });
    var fresh = upsCore.pageFreshness(d, now, period);
    var alarms = d ? d.alarms.slice().sort(function (a, b) { return (a.ack ? 1 : 0) - (b.ack ? 1 : 0); }) : []; // Q5 未确认优先
    var show = upsCore.hasTrend(u);
    var sev = upsCore.topSeverity(u);
    ractive.reset({ view: "unit", notFound: false, unitId: unitId, unit: u, detail: d,
      groupFresh: groupFresh, fresh: fresh,
      freshLabel: fresh === "ok" ? "实测" : fresh === "stale" ? "参考值" : "缺口",
      sevClass: sev,
      sevText: sev === "critical" ? "严重" : sev === "warning" ? "警告" : sev === "commLost" ? "通讯中断" : "正常",
      alarmFilter: "all", alarms: alarms,
      unackCount: alarms.filter(function (a) { return !a.ack; }).length,
      showTrend: show,
      trendSoc: show ? upsCore.sparklinePoints(u.socHistory, 240, 60, 0, 100) : "",
      trendLoad: show ? upsCore.sparklinePoints(u.loadHistory, 240, 50, 0, 100) : "" });
  }

  function renderHistory(unitId, q) { // M3：全量历史渲染（详设 §5）
    var found = upsCore.buildDetail(snapshot.units, unitId);
    if (!found) { ractive.reset({ view: "history", notFound: true, unitId: unitId, unit: null }); return; }
    var query = upsCore.normalizeHistoryQuery(q), spec = upsCore.spanSpec(query.span);
    var W = 960, R1H = 220, R2Y = 240, R2H = 120;
    var anchor = Date.now(), grain = spec.grainMs, minT = anchor - (spec.slots - 1) * grain, maxGap = 2 * grain;
    var chart1Series = [], chart2Series = [];
    query.metrics.forEach(function (m) {
      var pts = upsCore.deriveHistory(found.unit, m, query.span, anchor);
      var dom = m === "temp" ? [15, 45, R2Y, R2H] : [0, 100, 0, R1H];
      var arr = m === "temp" ? chart2Series : chart1Series;
      upsCore.splitGaps(pts, maxGap).forEach(function (seg) {
        arr.push({ key: m, seg: seg.map(function (p) {
          var x = Math.round((p.t - minT) / (anchor - minT) * W);
          var y = dom[2] + Math.round((1 - (p.v - dom[0]) / (dom[1] - dom[0])) * dom[3]);
          return x + "," + y;
        }).join(" ") });
      });
    });
    var fmtFull = function (t) { var d = new Date(t); return upsCoreTimePad(d.getMonth() + 1) + "-" + upsCoreTimePad(d.getDate()) + " " + upsCoreTimePad(d.getHours()) + ":" + upsCoreTimePad(d.getMinutes()); };
    var events = upsCore.deriveEvents(found.unit, query.span, anchor)
      .filter(function (e) { return e.t >= minT && e.t <= anchor; })
      .map(function (e) { return { x: Math.round((e.t - minT) / (anchor - minT) * W), type: e.type, ongoing: e.ongoing, label: fmtFull(e.t) }; });
    var ticks = upsCore.timeTicks(anchor, query.span).map(function (t) {
      return { pct: Math.round((t.t - minT) / (anchor - minT) * 1000) / 10, label: t.label };
    });
    ractive.reset({ view: "history", notFound: false, unitId: unitId, unit: found.unit,
      selSpan: query.span, selMetrics: query.metrics, grainText: upsCore.grainTextOf(grain),
      spans: [{ key: "1h", label: "1小时" }, { key: "24h", label: "24小时" }, { key: "7d", label: "7天" }, { key: "30d", label: "30天" }],
      metricOpts: [{ key: "soc", label: "SOC" }, { key: "load", label: "负载" }, { key: "temp", label: "电池温度" }],
      hasPct: query.metrics.indexOf("soc") >= 0 || query.metrics.indexOf("load") >= 0, hasTemp: query.metrics.indexOf("temp") >= 0,
      chart1Series: chart1Series, chart2Series: chart2Series,
      eventMarks: events, events: events, ticks: ticks });
  }

  function renderAlarms(q) { // M4：告警列表 + 行内确认（详设 §3）
    q = q || {};
    var keepOpen = ractive && ractive.get ? ractive.get("ackOpen") : null; // 轮询重渲染须保留编辑中状态（输入不丢）
    var keepNote = keepOpen ? ractive.get("ackNote") : "";
    var all = upsCore.collectAlarms(snapshot.units);
    var alFilter = { site: q.site || "", sev: q.sev || "", state: q.state || "", unit: q.unit || "" };
    var rows = upsCore.filterAlarms(all, alFilter).map(function (r) {
      var ev = r.ack ? auditLog.filter(function (e) { return e.alarmKey === r.key; }).pop() : null; // by/at 取自审计事件
      return { key: r.key, unitId: r.unitId, unitName: r.unitName, siteName: r.siteName,
        severity: r.severity, message: r.message, time: r.time, ack: r.ack,
        ackInfo: ev ? "已确认 · " + ev.by + " · " + new Date(ev.at).toLocaleString() : "已确认（审计缺失，fail-closed 明示）" };
    });
    var sevSel = {}; if (alFilter.sev) sevSel[alFilter.sev] = true;
    var stateSel = {}; if (alFilter.state) stateSel[alFilter.state] = true;
    var editorAlive = keepOpen && rows.some(function (r) { return r.key === keepOpen && !r.ack; }); // 行仍存在且未确认才保留
    ractive.reset({ view: "alarms", sites: snapshot.sites, alFilter: alFilter, rows: rows,
      ackOpen: editorAlive ? keepOpen : null, ackNote: editorAlive ? keepNote : "", ackError: null, // 同时只展开一行
      alarmStats: { active: all.filter(function (r) { return !r.ack; }).length,
                    acked: all.filter(function (r) { return r.ack; }).length,
                    critical: all.filter(function (r) { return r.severity === "critical" && !r.ack; }).length },
      sevSel: sevSel, stateSel: stateSel });
  }

  function renderConfig() { // M5：配置管理渲染（详设 §5；轮询重渲染保留草稿/理由/历史展开态）
    var prevRows = ractive && ractive.get && ractive.get("view") === "config" ? ractive.get("defRows") : null;
    var keepErr = prevRows ? ractive.get("publishError") : null;
    var keepHist = prevRows ? ractive.get("showVersions") : false;
    var defs = configStore.defs, eff = upsCore.effectiveConfig(configStore); // boot fail-closed 已守存在性
    var defRows = Object.keys(defs).map(function (k) {
      var pv = prevRows ? prevRows.filter(function (r) { return r.key === k; })[0] : null;
      return { key: k, label: defs[k].label, unit: defs[k].unit, min: defs[k].min, max: defs[k].max,
        effValue: eff[k], draftValue: pv ? pv.draftValue : eff[k] };
    });
    var versions = configStore.versions.slice().reverse().map(function (v) {
      return { seq: v.seq, kind: v.kind, kindText: v.kind === "publish" ? "发布" : "回滚",
        by: v.by, atText: v.at === null ? "（种子 base）" : new Date(v.at).toLocaleString(),
        summary: v.summary, fromSeq: v.fromSeq, isCurrent: v.seq === configStore.currentSeq };
    });
    ractive.reset({ view: "config", defRows: defRows,
      publishError: keepErr || null, showVersions: keepHist, versions: versions,
      currentSeq: configStore.currentSeq, totalVersions: configStore.versions.length });
  }
  function renderAudit(q) { // M6：审计查询渲染（详设 §3；重渲染保留展开行）
    q = q || {};
    var f = { type: q.type || "", by: q.by || "", since: q.since || "all", q: q.q || "" };
    var keepDetail = ractive && ractive.get && ractive.get("view") === "audit" ? ractive.get("showDetail") : null;
    var rows = upsCore.queryAudit(auditLog, f, Date.now()).map(function (e) {
      var meta = upsCore.AUDIT_TYPES[e.type] || { label: e.type, cls: "tag-normal" }; // 未知类型明示原文（fail-closed）
      return { seq: e.seq, type: e.type, label: meta.label, cls: meta.cls, by: e.by,
        atText: typeof e.at === "number" ? new Date(e.at).toLocaleString() : "（无时戳）",
        summary: e.summary || e.message || "",
        detailFields: upsCore.auditDetailFields(e) };
    });
    var typeBadges = Object.keys(upsCore.AUDIT_TYPES).map(function (t) {
      var m = upsCore.AUDIT_TYPES[t];
      return { type: t, label: m.label, cls: m.cls === "tag-critical" ? "crit" : m.cls === "tag-warning" ? "warn" : "ok",
        count: auditLog.filter(function (e) { return e.type === t; }).length, sel: f.type === t };
    });
    ractive.reset({ view: "audit", auditFilter: f, rows: rows, showDetail: keepDetail,
      operators: upsCore.collectOperators(auditLog), typeBadges: typeBadges, totalAll: auditLog.length });
  }

  function navAudit(f) { // M6：深链 #/ups/audit?type=&by=&since=&q=
    var qs = Object.keys(f).filter(function (k) { return f[k] && f[k] !== "all"; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(f[k]); }).join("&");
    location.hash = "/ups/audit" + (qs ? "?" + qs : "");
  }
  function goConfigNav() { location.hash = "/ups/config"; }
  function navAlarms(f) { // M4：深链 #/ups/alarms?site=&sev=&state=&unit=（REQ-M1-07 同构）
    var qs = Object.keys(f).filter(function (k) { return f[k]; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(f[k]); }).join("&");
    location.hash = "/ups/alarms" + (qs ? "?" + qs : "");
  }
  function upsCoreTimePad(n) { return (n < 10 ? "0" : "") + n; }
  function nav(q) { // 状态写入 hash → 返回时天然保留（REQ-M1-07）
    var qs = Object.keys(q).filter(function (k) { return q[k]; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(q[k]); }).join("&");
    location.hash = "/ups/overview" + (qs ? "?" + qs : "");
  }

  function boot() {
    adapter.load().then(function (s) {
      snapshot = s;
      auditLog = s.auditLog || []; // M4：审计事件流存 snapshot（seed 不含，运行时累积；M6 消费）
      configStore = s.configStore || null; // M5：版本库（seed 含 base v1；运行期 append-only 内存累积）
      if (!configStore) throw new Error("seed 缺 configStore（fail-closed，不兜底）");
      ractive = new Ractive({
        el: "#app",
        template: "#overview-template",
        data: { view: "loading" },
        oninit: function () {
          var self = this;
          this.on("filter", function (e) { nav({ site: e.site || "", comm: e.comm || "", mode: e.mode || "", sev: e.sev || "" }); }); // 注：Ractive fire 单个对象参数会 mixin 进事件上下文，须逐字段取
          this.on("setPage", function (e, p) { var q = currentQ(); q.page = p; nav(q); });
          this.on("setPageSize", function (e) { var q = currentQ(); q.ps = e.node.value; q.page = 1; nav(q); });
          this.on("applySort", function () { renderOverview(currentQ()); }); // Q6 手动刷新排序
          this.on("goUnit", function (e, id) { location.hash = "/ups/unit/" + encodeURIComponent(id); });
          this.on("goBack", function () { history.back(); });
          this.on("setAlarmFilter", function (e, f) { this.set("alarmFilter", f); }); // M2：告警筛选仅切视图（R2 只读，确认=M4）
          this.on("goHistory", function (e, id, metrics) { location.hash = "/ups/history/" + encodeURIComponent(id) + "?metrics=" + encodeURIComponent(metrics || "soc,load") + "&span=24h"; }); // D-M3-08：纯导航
          this.on("toggleMetric", function (e, m) { // M3：指标多选（hash 驱动，深链可复现）
            var r = parseHash(), q = r.q || {};
            var arr = (q.metrics ? q.metrics.split(",") : ["soc", "load"]).filter(Boolean);
            var i = arr.indexOf(m); if (i >= 0) arr.splice(i, 1); else arr.push(m);
            location.hash = "/ups/history/" + encodeURIComponent(r.unitId) + "?metrics=" + arr.join(",") + "&span=" + encodeURIComponent(q.span || "24h");
          });
          this.on("setSpan", function (e, span) {
            var r = parseHash(), q = r.q || {};
            location.hash = "/ups/history/" + encodeURIComponent(r.unitId) + "?metrics=" + encodeURIComponent(q.metrics || "soc,load") + "&span=" + encodeURIComponent(span);
          });
          this.on("goAlarms", function (e, unitId) { navAlarms(unitId ? { unit: unitId } : {}); }); // M2 衔接：带 unit 参数深链
          this.on("goConfig", function () { goConfigNav(); }); // M5：配置管理入口（纯导航）
          this.on("goAudit", function () { navAudit({}); }); // M6：审计入口（纯导航）
          this.on("auditNav", function (e) { navAudit({ type: e.type || "", by: e.by || "", since: e.since || "all", q: e.q || "" }); });
          this.on("setAuditType", function (e, t) { var f = this.get("auditFilter") || {}; navAudit({ type: f.type === t ? "" : t, by: f.by, since: f.since, q: f.q }); }); // 徽标再点取消
          this.on("toggleAuditDetail", function (e, seq) { this.set("showDetail", this.get("showDetail") === seq ? null : seq); }); // 行内展开（同时一行）；只读，无写入口（A27）
          this.on("submitPublish", function () { // M5 写入口①：守门 fail-closed（语义全在 upsCore.publishConfig）
            var draft = {}; this.get("defRows").forEach(function (r) { draft[r.key] = (r.draftValue === "" || r.draftValue === null || r.draftValue === undefined) ? null : Number(r.draftValue); }); // 空值=null → 守门序 V1
            var r = upsCore.publishConfig(configStore, auditLog, draft, "mock-operator", Date.now(), { allowedSites: null, allowedSiteId: null }); // R1 留位
            if (!r.ok) { this.set("publishError", r.reasons); return; } // 逐条明示（A22），生效区不动（A25）
            this.set("publishError", null);
            renderConfig(); // 新版本生效，草稿行回读新生效值
          });
          this.on("resetDraft", function () { // 放弃草稿：各行草稿值回生效值（不碰生效区，A25）
            var rows = this.get("defRows").map(function (r) { r.draftValue = r.effValue; return r; });
            this.set({ defRows: rows, publishError: null });
          });
          this.on("toggleVersions", function () { this.set("showVersions", !this.get("showVersions")); });
          this.on("rollbackTo", function (e, seq) { // M5 写入口②：红冲回滚（历史零修改，A23）
            var r = upsCore.rollbackConfig(configStore, auditLog, seq, "mock-operator", Date.now(), { allowedSites: null, allowedSiteId: null });
            if (!r.ok) { this.set("publishError", r.reasons); return; }
            this.set("publishError", null);
            renderConfig();
          });
          this.on("alarmNav", function (e) { navAlarms({ site: e.site || "", sev: e.sev || "", state: e.state || "", unit: e.unit || "" }); }); // 筛选（单对象 mixin 进上下文，逐字段取）
          this.on("setAlarmSev", function (e, sev) { var f = this.get("alFilter") || {}; navAlarms({ site: f.site, sev: sev === f.sev ? "" : sev, state: f.state, unit: f.unit }); }); // 徽标再点取消
          this.on("setAlarmState", function (e, st) { var f = this.get("alFilter") || {}; navAlarms({ site: f.site, sev: f.sev, state: st === f.state ? "" : st, unit: f.unit }); });
          this.on("openAck", function (e, key) { this.set({ ackOpen: key, ackNote: "", ackError: null }); }); // 行内展开（同时只一行）
          this.on("cancelAck", function () { this.set({ ackOpen: null, ackNote: "", ackError: null }); });
          this.on("submitAck", function (e, key) { // M4 唯一写入口：守门四路（UI 只是门面，语义全在 upsCore.applyAck）
            var r = upsCore.applyAck(snapshot.units, auditLog, key, this.get("ackNote"), "mock-operator", Date.now(), { allowedSites: null }); // R1 留位：Mock 全员
            if (!r.ok) { this.set("ackError", r.reason); return; } // 否决留痕（铁律 3）：reason 明示
            this.set({ ackOpen: null, ackNote: "", ackError: null });
            renderAlarms(currentQ()); // 重渲染：行变"已确认 · by · at"，按钮消失（A21）
          });
          setInterval(function () { // Q2：10s 轮询；详情视图刷新 detail（D-M2-01）
            var r = parseHash();
            if (r.page === "history") { adapter.poll(); return; } // M3：历史视图不整页重渲染（poll 保快照新鲜）
            if (r.page !== "unit") { adapter.poll().then(function () { // M4：alarms 视图 poll 后重渲染列表（overview 分支语义）
              var pg = parseHash().page; // M5：config 视图同规——重渲染保留草稿态
              if (pg === "alarms") renderAlarms(currentQ()); else if (pg === "config") renderConfig(); else if (pg === "audit") renderAudit(currentQ()); else renderOverview(currentQ()); }); return; }
            adapter.poll().then(function () { return adapter.detail(r.unitId); }).then(function () { renderUnit(r.unitId); })
              .catch(function (err) { if (ractive) ractive.set("detailError", String(err && err.message || err)); });
          }, s.pollPeriodMs);
        },
      });
      window.__upsPod = ractive; // 调试/走查钩子（参照 docs/demo 先例）
      window.__upsPod.adapter = adapter; // 走查/运维：手动 poll/detail 验证时效跟踪（只读调试入口）
      window.addEventListener("hashchange", render);
      render();
    }).catch(function (err) {
      document.getElementById("app").innerHTML =
        '<div class="fatal">加载失败（fail-closed，不兜底）：' + String(err && err.message || err) + "</div>";
    });
  }

  function currentQ() { return parseHash().q; }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);






