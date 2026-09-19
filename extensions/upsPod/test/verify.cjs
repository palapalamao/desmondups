// verify.cjs — M1 逻辑验证（Node VM 风格，参照 docs/demo 的验证边界声明）
// 覆盖：TC-M1-逻辑-*（筛选/排序/分页/统计/时效分级/新风险检测）
// 声明：本脚本验证 upsCore 纯逻辑，不是浏览器 DOM/视觉/FIN 集成测试（真机目检另行记录）。
"use strict";
const assert = require("assert");
const core = require("../frontend/app.js"); // Node 分支导出 upsCore

let pass = 0;
function tc(id, name, fn) {
  try { fn(); pass++; console.log("PASS", id, name); }
  catch (e) { console.error("FAIL", id, name, "-", e.message); process.exitCode = 1; }
}

const now = Date.now(), P = 10000;
const mk = (o) => Object.assign(
  { id: "U", name: "U", siteId: "s1", commLost: false, mode: "online", loadPct: 50, soc: 90, ts: now }, o);

// TC-M1-逻辑-01 严重度分级
tc("TC-M1-逻辑-01", "严重度：电池+SOC<30=critical", () => {
  assert.strictEqual(core.topSeverity(mk({ mode: "battery", soc: 20 })), "critical");
  assert.strictEqual(core.topSeverity(mk({ mode: "battery", soc: 60 })), "warning");
  assert.strictEqual(core.topSeverity(mk({ mode: "online" })), "normal");
  assert.strictEqual(core.topSeverity(mk({ commLost: true })), "commLost"); // Q5/F4
});
// TC-M1-逻辑-02 时效分级（R3）
tc("TC-M1-逻辑-02", "时效：ok/stale/gap 三态", () => {
  assert.strictEqual(core.classifyFreshness(now - 5000, now, P), "ok");
  assert.strictEqual(core.classifyFreshness(now - 30000, now, P), "stale"); // >2×周期=参考值
  assert.strictEqual(core.classifyFreshness(null, now, P), "gap");          // 缺口
});
// TC-M1-逻辑-03 筛选
tc("TC-M1-逻辑-03", "四维筛选组合", () => {
  const units = [mk({ id: "a", siteId: "s1" }), mk({ id: "b", siteId: "s2" }),
                 mk({ id: "c", siteId: "s1", commLost: true }), mk({ id: "d", siteId: "s1", mode: "battery" })];
  assert.deepStrictEqual(core.filterUnits(units, { site: "s1" }).map(u => u.id), ["a", "c", "d"]);
  assert.deepStrictEqual(core.filterUnits(units, { comm: "lost" }).map(u => u.id), ["c"]);
  assert.deepStrictEqual(core.filterUnits(units, { site: "s1", mode: "battery" }).map(u => u.id), ["d"]);
  assert.deepStrictEqual(core.filterUnits(units, { sev: "commLost" }).map(u => u.id), ["c"]);
});
// TC-M1-逻辑-04 排序（Q4：严重度>通讯>名称）
tc("TC-M1-逻辑-04", "排序：严重度优先", () => {
  const units = [mk({ id: "n1", name: "B" }), mk({ id: "c1", name: "Z", mode: "battery", soc: 20 }),
                 mk({ id: "n2", name: "A" }), mk({ id: "w1", name: "M", mode: "battery", soc: 80 })];
  assert.deepStrictEqual(core.sortUnits(units).map(u => u.id), ["c1", "w1", "n2", "n1"]);
});
// TC-M1-逻辑-05 统计徽标
tc("TC-M1-逻辑-05", "统计：四类计数", () => {
  const units = [mk({ mode: "battery", soc: 20 }), mk({ mode: "battery", soc: 80 }),
                 mk({}), mk({ commLost: true, mode: "unknown", loadPct: null, soc: null })];
  assert.deepStrictEqual(core.statCounts(units), { critical: 1, warning: 1, normal: 1, commLost: 1 });
});
// TC-M1-逻辑-06 分页
tc("TC-M1-逻辑-06", "分页：50/100 与越界收敛", () => {
  const units = Array.from({ length: 120 }, (_, i) => mk({ id: "u" + i }));
  let pg = core.paginate(units, 1, 50);
  assert.strictEqual(pg.items.length, 50); assert.strictEqual(pg.pages, 3);
  pg = core.paginate(units, 3, 50);
  assert.strictEqual(pg.items.length, 20);
  pg = core.paginate(units, 99, 50); // 页码越界 → 收敛到末页
  assert.strictEqual(pg.page, 3);
  pg = core.paginate(units, 1, 100);
  assert.strictEqual(pg.pages, 2);
});
// TC-M1-逻辑-07 新风险检测（Q6：只提示不重排）
tc("TC-M1-逻辑-07", "新风险：恶化检测+排除首次/超时效", () => {
  const prev = { a: "normal", b: "warning", c: "normal" };
  const units = [mk({ id: "a", mode: "battery", soc: 20, ts: now }),          // normal→critical ✔
                 mk({ id: "b", mode: "battery", soc: 20, ts: now }),          // warning→critical ✔
                 mk({ id: "c", mode: "battery", soc: 20, ts: now - 999999 }), // 超时效 → 不计
                 mk({ id: "d", mode: "battery", soc: 20, ts: now })];         // 无 prev → 不计
  const risks = core.detectNewRisks(prev, units, now, P);
  assert.deepStrictEqual(risks.map(r => r.id).sort(), ["a", "b"]);
});
// TC-M1-逻辑-08 种子确定性（幂等：两次生成逐字节一致）
tc("TC-M1-逻辑-08", "种子：确定性可重建", () => {
  const fs = require("fs"), path = require("path"), os = require("os");
  const seedPath = path.join(__dirname, "..", "frontend", "seed.json");
  const a = fs.readFileSync(seedPath, "utf8");
  const tmp = path.join(os.tmpdir(), "seed-check.json");
  const orig = process.argv; // demoSeed 写死路径，改为临时比对生成逻辑：直接重跑脚本
  require("child_process").execSync(`node "${path.join(__dirname, "..", "..", "..", "scripts", "seed", "demoSeed.js")}"`);
  const b = fs.readFileSync(seedPath, "utf8");
  assert.strictEqual(a, b); // 种子不含墙钟 → 两次生成须逐字节一致
});

// TC-M1-逻辑-09 sparklinePoints（REQ-M1-10：定程映射/空态/坐标数）
tc("TC-M1-逻辑-09", "趋势坐标：空→空串，定程 0→y=h 100→y=0", () => {
  assert.strictEqual(core.sparklinePoints([], 240, 60, 0, 100), "");
  assert.strictEqual(core.sparklinePoints(null, 240, 60, 0, 100), "");
  assert.strictEqual(core.sparklinePoints([0, 50, 100], 240, 60, 0, 100), "0,60 120,30 240,0");
  const pts = core.sparklinePoints(new Array(24).fill(50), 240, 60, 0, 100).split(" ");
  assert.strictEqual(pts.length, 24);            // 24 点 → 24 坐标对
  assert.strictEqual(pts[0], "0,30");            // 首点 x=0
  assert.strictEqual(pts[23], "240,30");         // 末点 x=w，step=w/23
  assert.strictEqual(core.sparklinePoints([80], 240, 60, 0, 100), "0,12"); // 单点不成线，step=0
});
// TC-M1-逻辑-10 rollHistory（REQ-M1-10：滚动窗口追加+超窗移位）
tc("TC-M1-逻辑-10", "滚动窗口：24 点超窗 shift，返回同一引用", () => {
  const arr = [];
  for (let i = 1; i <= 24; i++) core.rollHistory(arr, i, 24);
  assert.deepStrictEqual(arr, Array.from({ length: 24 }, (_, i) => i + 1)); // 恰好 24 不 shift
  const ref = core.rollHistory(arr, 25, 24);
  assert.strictEqual(ref, arr);                  // 返回同一引用（原型先例）
  assert.strictEqual(arr.length, 24);            // 超窗仍 24
  assert.strictEqual(arr[0], 2);                 // 最旧点(1)已出窗
  assert.strictEqual(arr[23], 25);               // 最新点在尾
});
// TC-M1-逻辑-11 hasTrend（Q11：断讯不渲染趋势，R3）
tc("TC-M1-逻辑-11", "趋势判定：断讯/点数不足→false，正常→true", () => {
  const h24 = new Array(24).fill(50);
  assert.strictEqual(core.hasTrend(mk({ socHistory: h24, loadHistory: h24 })), true);
  assert.strictEqual(core.hasTrend(mk({ commLost: true, socHistory: h24, loadHistory: h24 })), false); // Q11 断讯优先
  assert.strictEqual(core.hasTrend(mk({ socHistory: [], loadHistory: [] })), false);   // 缺口/空数组
  assert.strictEqual(core.hasTrend(mk({ socHistory: [50], loadHistory: [50] })), false); // 1 点不成线
  assert.strictEqual(core.hasTrend(mk({ socHistory: [50, 51], loadHistory: [50, 51] })), true); // 2 点成线
});


// ===== M2 设备详情逻辑（详设 §4/§6：buildDetail / pageFreshness / 参考值标记 / 告警只读契约） =====
// TC-M2-逻辑-01 buildDetail（未找到 → null；断讯 → 档案在、detail=null，D-M2-02）
tc("TC-M2-逻辑-01", "详情：取到/未知id→null/断讯→detail=null 档案保留", () => {
  const det = { battery: {}, ts: { battery: now, load: now, electronics: now, environment: now, transfer: now } };
  const units = [mk({ id: "a", detail: det }),
                 mk({ id: "b", commLost: true, mode: "unknown", loadPct: null, soc: null, detail: null })];
  const ok = core.buildDetail(units, "a");
  assert.strictEqual(ok.unit.id, "a");
  assert.strictEqual(ok.detail, det);
  assert.strictEqual(core.buildDetail(units, "NOPE"), null); // fail-closed 不兜底
  const lost = core.buildDetail(units, "b");
  assert.strictEqual(lost.unit.id, "b");
  assert.strictEqual(lost.detail, null); // D-M2-02：遥测整区不渲染，档案照常
});
// TC-M2-逻辑-02 pageFreshness（D-M2-05：各组最差 gap > stale > ok）
tc("TC-M2-逻辑-02", "页面时效：最差聚合；detail=null→gap", () => {
  assert.strictEqual(core.pageFreshness(null, now, P), "gap");
  const tsOk = { battery: now, load: now, electronics: now, environment: now, transfer: now };
  assert.strictEqual(core.pageFreshness({ ts: tsOk }, now, P), "ok");
  assert.strictEqual(core.pageFreshness({ ts: Object.assign({}, tsOk, { load: now - 30000 }) }, now, P), "stale");
  assert.strictEqual(core.pageFreshness({ ts: Object.assign({}, tsOk, { transfer: null }) }, now, P), "gap");
});
// TC-M2-逻辑-03 参考值标记完整性（D-M2-04，读种子全量断言）
tc("TC-M2-逻辑-03", "参考值：预测类字段 reference=true 且 source 非空", () => {
  const seed = require("../frontend/seed.json");
  const details = seed.units.map(u => u.detail).filter(Boolean);
  assert.ok(details.length > 0, "种子应含非空 detail");
  details.forEach(d => {
    assert.strictEqual(d.battery.reference, true);
    assert.ok(d.battery.source && d.battery.source.length > 0, "battery.source 非空");
    assert.strictEqual(d.runtimeEstimate.reference, true);
    assert.ok(d.runtimeEstimate.source && d.runtimeEstimate.source.length > 0, "runtimeEstimate.source 非空");
    d.predictions.forEach(p => {
      assert.strictEqual(p.reference, true);
      assert.ok(p.source && p.source.length > 0, "prediction.source 非空");
    });
  });
});
// TC-M2-逻辑-04 告警契约只读（详设 §6：每项恰 severity/message/time/ack 四字段）
tc("TC-M2-逻辑-04", "告警：契约恰四字段，无写操作字段", () => {
  const seed = require("../frontend/seed.json");
  let n = 0;
  seed.units.forEach(u => {
    if (!u.detail) return;
    u.detail.alarms.forEach(a => {
      n++;
      assert.deepStrictEqual(Object.keys(a).sort(), ["ack", "message", "severity", "time"]);
      assert.strictEqual(typeof a.ack, "boolean");
    });
  });
  assert.ok(n > 0, "种子应含至少一条告警以约束契约");
});



// ===== M3 历史趋势逻辑（详设 §4/§6：派生确定性/跨度规格/空洞切分/事件规则/刻度） =====
// TC-M3-逻辑-01 派生确定性（D-M3-05/06：同入参两次调用逐字节一致）
tc("TC-M3-逻辑-01", "历史派生：确定性 + 域截断", () => {
  const u = { id: "UPS-T01", mode: "online" };
  const anchor = 1720000000000;
  ["soc", "load", "temp"].forEach(m => {
    const a = core.deriveHistory(u, m, "24h", anchor);
    const b = core.deriveHistory(u, m, "24h", anchor);
    assert.deepStrictEqual(a, b);
    assert.strictEqual(a.length, 288);
    const dom = { soc: [20, 100], load: [15, 90], temp: [18, 38] }[m];
    a.forEach(p => { assert.ok(p.v >= dom[0] && p.v <= dom[1], m + " 域截断 " + p.v); });
  });
  assert.deepStrictEqual(core.deriveHistory(u, "bad", "24h", anchor), []); // 非法 metric → 空（fail-closed）
  assert.deepStrictEqual(core.deriveHistory(null, "soc", "24h", anchor), []);
});
// TC-M3-逻辑-02 跨度规格（D-M3-01 规则表）
tc("TC-M3-逻辑-02", "跨度：四档点数 360/288/336/360，粒度 10s/5min/30min/2h", () => {
  const cases = [["1h", 10000, 360], ["24h", 300000, 288], ["7d", 1800000, 336], ["30d", 7200000, 360]];
  cases.forEach(([k, g, n]) => { const s = core.spanSpec(k); assert.strictEqual(s.grainMs, g); assert.strictEqual(s.slots, n); });
  assert.strictEqual(core.spanSpec("bad").grainMs, 300000); // 非法 → 默认 24h（D-M3-07）
});
// TC-M3-逻辑-03 空洞切分（禁插值渲染依据，A15）
tc("TC-M3-逻辑-03", "splitGaps：超 2×粒度断点分段，段间无连线", () => {
  const pts = [{ t: 0, v: 1 }, { t: 100, v: 2 }, { t: 1000, v: 3 }, { t: 1100, v: 4 }];
  const segs = core.splitGaps(pts, 200);
  assert.strictEqual(segs.length, 2);
  assert.strictEqual(segs[0].length, 2); assert.strictEqual(segs[1].length, 2);
  assert.deepStrictEqual(core.splitGaps([], 200), []);
  assert.strictEqual(core.splitGaps([{ t: 5, v: 1 }], 200)[0].length, 1);
});
// TC-M3-逻辑-04 事件派生规则（D-M3-04）
tc("TC-M3-逻辑-04", "事件：升序 + transferOk 晚于 inputFail 2~8min + battery 进行中", () => {
  const anchor = 1720000000000;
  const bat = { id: "UPS-T09", mode: "battery" };
  const ev1 = core.deriveEvents(bat, "30d", anchor), ev2 = core.deriveEvents(bat, "30d", anchor);
  assert.deepStrictEqual(ev1, ev2); // 确定性
  for (let i = 1; i < ev1.length; i++) assert.ok(ev1[i].t >= ev1[i - 1].t, "升序");
  const ongoing = ev1.filter(e => e.ongoing);
  assert.strictEqual(ongoing.length, 1);
  assert.strictEqual(ongoing[0].type, "inputFail");
  assert.strictEqual(ongoing[0].t, anchor);
  ev1.filter(e => e.type === "transferOk").forEach(tk => {
    const pre = ev1.filter(e => e.type === "inputFail" && e.t <= tk.t);
    assert.ok(pre.length > 0, "transferOk 前必有 inputFail");
    const dt = tk.t - pre[pre.length - 1].t;
    assert.ok(dt >= 2 * 60000 && dt <= 8 * 60000, "delta 2~8min 实际 " + dt);
  });
  const online = core.deriveEvents({ id: "UPS-T09", mode: "online" }, "30d", anchor);
  assert.strictEqual(online.filter(e => e.ongoing).length, 0);
});
// TC-M3-逻辑-05 时间刻度 + 参数收敛
tc("TC-M3-逻辑-05", "timeTicks 恰 5 档格式合法；normalize 收敛", () => {
  const anchor = 1720000000000;
  ["1h", "24h", "7d", "30d"].forEach(s => {
    const ticks = core.timeTicks(anchor, s);
    assert.strictEqual(ticks.length, 5);
    assert.strictEqual(ticks[4].t, anchor); // 末档 = 锚点
    const re = s === "1h" ? /^\d{2}:\d{2}$/ : /^\d{2}-\d{2} \d{2}:\d{2}$/;
    ticks.forEach(t => assert.ok(re.test(t.label), s + " 格式 " + t.label));
  });
  assert.deepStrictEqual(core.normalizeHistoryQuery({ metrics: "soc,bad,temp,soc", span: "7x" }),
    { metrics: ["soc", "temp"], span: "24h" });
  assert.deepStrictEqual(core.normalizeHistoryQuery(null), { metrics: ["soc", "load"], span: "24h" });
  assert.deepStrictEqual(core.normalizeHistoryQuery({ metrics: "", span: "7d" }), { metrics: [], span: "7d" }); // 显式空保持空（fail-closed 明示）
});
// ---- M4 告警确认（详设 D-M4 §1/§2/§5；本项目首个写操作模块）----
const mkAlarmUnit = (id, siteId, alarms) =>
  ({ id, name: id, siteId, siteName: "站点" + siteId, detail: { alarms } });
const m4fixture = () => ([
  mkAlarmUnit("U1", "s1", [{ severity: "warning", message: "市电中断", time: "10 分钟前", ack: false }]),
  mkAlarmUnit("U2", "s2", [{ severity: "critical", message: "电容老化", time: "1 小时前", ack: false }]),
  mkAlarmUnit("U3", "s1", [{ severity: "warning", message: "内阻超基线", time: "昨天", ack: true }]),
]);
// TC-M4-逻辑-01 守门四路拒绝按序短路 + reason 非空
tc("TC-M4-逻辑-01", "gateAck：存在→状态→备注→站点 按序拒绝", () => {
  const r1 = core.gateAck(null, "已复位", {});
  assert.ok(!r1.ok && r1.reason.length > 0, "序1 不存在");
  const r2 = core.gateAck({ ack: true }, "已复位", {});
  assert.ok(!r2.ok && /已确认/.test(r2.reason), "序2 幂等保护");
  const r3 = core.gateAck({ ack: false }, "x", {});
  assert.ok(!r3.ok && /备注/.test(r3.reason), "序3 备注<2字");
  const r4 = core.gateAck({ ack: false }, "已复位", { allowedSites: ["s2"], siteId: "s1" });
  assert.ok(!r4.ok && /越权/.test(r4.reason), "序4 站点越权");
  assert.ok(core.gateAck({ ack: false }, "已复位", { allowedSites: null, siteId: "s1" }).ok, "Mock 全员放行");
  assert.ok(core.gateAck({ ack: false }, "已复位", { allowedSites: ["s1"], siteId: "s1" }).ok, "在授权范围放行");
});
// TC-M4-逻辑-02 applyAck 成功路径：ack=true + 审计事件字段完整 + alarm 恰四字段
tc("TC-M4-逻辑-02", "applyAck：置位+审计事件字段完整", () => {
  const units = m4fixture(), log = [], at = 1720000000000;
  const r = core.applyAck(units, log, "U1#0", "  现场已复位  ", "mock-operator", at, { allowedSites: null });
  assert.ok(r.ok);
  const alarm = units[0].detail.alarms[0];
  assert.strictEqual(alarm.ack, true);
  assert.deepStrictEqual(Object.keys(alarm).sort(), ["ack", "message", "severity", "time"]); // TC-M2-逻辑-04 不破
  assert.strictEqual(log.length, 1);
  const ev = log[0];
  ["seq", "type", "alarmKey", "unitId", "siteId", "severity", "message", "note", "by", "at"].forEach(k => assert.ok(ev[k] !== undefined, k));
  assert.strictEqual(ev.seq, 1); assert.strictEqual(ev.type, "alarm.ack"); assert.strictEqual(ev.alarmKey, "U1#0");
  assert.strictEqual(ev.note, "现场已复位"); assert.strictEqual(ev.by, "mock-operator"); assert.strictEqual(ev.at, at);
});
// TC-M4-逻辑-03 幂等：重复确认拒绝 + 审计不重复 + 无二次变更
tc("TC-M4-逻辑-03", "幂等：双击/重试第二次被拒，零副作用", () => {
  const units = m4fixture(), log = [];
  assert.ok(core.applyAck(units, log, "U1#0", "首次确认", "op", 1, {}).ok);
  const r2 = core.applyAck(units, log, "U1#0", "重复确认", "op", 2, {});
  assert.ok(!r2.ok && /已确认/.test(r2.reason));
  assert.strictEqual(log.length, 1, "审计不重复");
  assert.deepStrictEqual(Object.keys(units[0].detail.alarms[0]).sort(), ["ack", "message", "severity", "time"]);
});
// TC-M4-逻辑-04 状态机单向 + 越权零副作用（数据层不可写）
tc("TC-M4-逻辑-04", "单向：越权拒绝且 alarm/审计零变更", () => {
  const units = m4fixture(), log = [];
  const r = core.applyAck(units, log, "U1#0", "越权尝试", "op", 1, { allowedSites: ["s2"] });
  assert.ok(!r.ok && /越权/.test(r.reason));
  assert.strictEqual(units[0].detail.alarms[0].ack, false, "数据层不可写");
  assert.strictEqual(log.length, 0, "审计不记录失败尝试（gateAck 只发射成功事件）");
});
// TC-M4-逻辑-05 collectAlarms 聚合 + filterAlarms 四维筛选/未确认优先
tc("TC-M4-逻辑-05", "聚合筛选：站点/严重度/状态/关键字 + 未确认优先", () => {
  const units = m4fixture(), rows = core.collectAlarms(units);
  assert.strictEqual(rows.length, 3);
  assert.deepStrictEqual(rows.map(r => r.key), ["U1#0", "U2#0", "U3#0"]);
  assert.strictEqual(rows[0].siteName, "站点s1");
  assert.strictEqual(core.filterAlarms(rows, { site: "s1" }).length, 2);
  assert.strictEqual(core.filterAlarms(rows, { sev: "critical" })[0].unitId, "U2");
  assert.deepStrictEqual(core.filterAlarms(rows, { state: "unack" }).map(r => r.unitId), ["U1", "U2"]);
  const sorted = core.filterAlarms(rows, {});
  assert.deepStrictEqual(sorted.map(r => r.unitId), ["U1", "U2", "U3"], "未确认优先，已确认垫底");
  assert.strictEqual(core.filterAlarms(rows, { unit: "u2" })[0].unitId, "U2", "关键字大小写不敏感");
  assert.strictEqual(core.collectAlarms([]).length, 0);
});// ---- M5 配置管理（详设 D-M5 §2/§3/§6）----
const m5defs = {
  socLowPct:       { label: "SOC 告警下限",       unit: "%",  min: 5,  max: 50, def: 20 },
  impedanceDevPct: { label: "内阻基线偏差告警阈", unit: "%",  min: 5,  max: 50, def: 15 },
  battTempHighC:   { label: "电池温度上限",        unit: "°C", min: 30, max: 60, def: 40 },
};
const m5store = () => ({ defs: m5defs,
  versions: [{ seq: 1, at: null, by: "seed", kind: "publish", fromSeq: null, summary: "base", values: { socLowPct: 20, impedanceDevPct: 15, battTempHighC: 40 } }],
  currentSeq: 1 });
// TC-M5-逻辑-01 守门四路全量收集（非短路）
tc("TC-M5-逻辑-01", "validateConfig：缺失/非数值/越域/越权 逐条收集", () => {
  const r = core.validateConfig({ socLowPct: null, impedanceDevPct: "abc", battTempHighC: 99 },
    m5defs, { allowedSites: ["s2"], allowedSiteId: "s1" });
  assert.ok(!r.ok);
  assert.strictEqual(r.reasons.length, 4, "四路全收集：实际 " + r.reasons.length);
  assert.ok(/缺失/.test(r.reasons[0]));
  assert.ok(/有效数值/.test(r.reasons[1]));
  assert.ok(/超出允许范围/.test(r.reasons[2]));
  assert.ok(/越权/.test(r.reasons[3]));
  assert.ok(core.validateConfig({ socLowPct: 20, impedanceDevPct: 15, battTempHighC: 40 }, m5defs, { allowedSites: null }).ok);
});
// TC-M5-逻辑-02 publish：seq 递增 + values 深拷贝隔离 + 审计字段完整
tc("TC-M5-逻辑-02", "publish：版本化+深拷贝隔离+审计", () => {
  const store = m5store(), log = [];
  const draft = { socLowPct: 15, impedanceDevPct: 15, battTempHighC: 40 };
  const r = core.publishConfig(store, log, draft, "mock-operator", 1720000000000, { allowedSites: null });
  assert.ok(r.ok);
  assert.strictEqual(r.version.seq, 2);
  assert.strictEqual(store.currentSeq, 2);
  assert.strictEqual(store.versions.length, 2);
  draft.socLowPct = 99; // 改草稿不回染已发布版本（隔离）
  assert.strictEqual(store.versions[1].values.socLowPct, 15);
  assert.strictEqual(store.versions[0].values.socLowPct, 20); // base 不动
  assert.strictEqual(log.length, 1);
  const ev = log[0];
  assert.strictEqual(ev.type, "config.publish"); assert.strictEqual(ev.versionSeq, 2);
  assert.strictEqual(ev.by, "mock-operator"); assert.strictEqual(ev.at, 1720000000000);
  assert.ok(/变更 1 项/.test(ev.summary));
});
// TC-M5-逻辑-03 草稿/生效隔离（A25）：守门失败 zero side-effect
tc("TC-M5-逻辑-03", "守门失败：versions/currentSeq/审计零变更", () => {
  const store = m5store(), log = [];
  const r = core.publishConfig(store, log, { socLowPct: 3, impedanceDevPct: 15, battTempHighC: 40 }, "op", 1, {});
  assert.ok(!r.ok && r.reasons.length > 0);
  assert.strictEqual(store.versions.length, 1, "无效配置不可发布（A3）");
  assert.strictEqual(store.currentSeq, 1, "生效值不动（A25）");
  assert.strictEqual(log.length, 0);
  assert.deepStrictEqual(core.effectiveConfig(store), { socLowPct: 20, impedanceDevPct: 15, battTempHighC: 40 });
});
// TC-M5-逻辑-04 rollback 红冲：历史零修改 + 100% 重放 + 审计
tc("TC-M5-逻辑-04", "rollback：红冲语义，历史版本逐字节不变", () => {
  const store = m5store(), log = [];
  core.publishConfig(store, log, { socLowPct: 10, impedanceDevPct: 15, battTempHighC: 40 }, "op", 2, {});
  const v1Snapshot = JSON.stringify(store.versions[0]);
  const r = core.rollbackConfig(store, log, 1, "mock-operator", 3, {});
  assert.ok(r.ok);
  assert.strictEqual(r.version.kind, "rollback"); assert.strictEqual(r.version.fromSeq, 1);
  assert.strictEqual(store.currentSeq, 3);
  assert.strictEqual(JSON.stringify(store.versions[0]), v1Snapshot, "历史版本零修改（铁律 4）");
  assert.deepStrictEqual(store.versions[2].values, { socLowPct: 20, impedanceDevPct: 15, battTempHighC: 40 }, "旧版内容 100% 重放（A23）");
  assert.strictEqual(log.length, 2);
  assert.strictEqual(log[1].type, "config.rollback");
});
// TC-M5-逻辑-05 幂等重放 + 非法目标拒绝
tc("TC-M5-逻辑-05", "重复 rollback 同版本=内容一致新版本；非法 seq 拒绝", () => {
  const store = m5store(), log = [];
  core.rollbackConfig(store, log, 1, "op", 2, {});
  const r2 = core.rollbackConfig(store, log, 1, "op", 3, {});
  assert.ok(r2.ok);
  assert.strictEqual(r2.version.seq, 3, "重复回滚=新版本 seq 递增");
  assert.deepStrictEqual(store.versions[2].values, store.versions[1].values, "重放内容一致");
  const bad = core.rollbackConfig(store, log, 99, "op", 4, {});
  assert.ok(!bad.ok && /不存在/.test(bad.reasons[0]));
  assert.strictEqual(store.versions.length, 3, "拒绝零副作用");
  assert.strictEqual(store.currentSeq, 3, "两次成功回滚后 currentSeq=3，拒绝不动");
});

console.log(`\n${pass}/30 通过${process.exitCode ? "（存在失败）" : ""}`);