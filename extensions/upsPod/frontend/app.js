/* ============================================================================
 * upsPod M1 设备总览 · 前端 SPA（app.js）
 * 结构：upsCore 纯逻辑（Node 可测，verify.cjs 入口） + 浏览器侧 Ractive 应用
 * 数据适配器：MockAdapter（确定性种子 + 10s 抖动）/ FinAdapter（桩，待 U-API-01）
 * 红线落实：R1 权限=站点过滤参数留位（无环境，标注未验）；R3 时效标注 ok/stale/gap
 * 版本 0.1.0
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

  var upsCore = {
    SEV_RANK: SEV_RANK,
    topSeverity: topSeverity,
    classifyFreshness: classifyFreshness,
    filterUnits: filterUnits,
    sortUnits: sortUnits,
    statCounts: statCounts,
    paginate: paginate,
    detectNewRisks: detectNewRisks,
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = upsCore; return; }
  global.upsCore = upsCore;

  /* ---------------- 数据适配器 ---------------- */
  var MockAdapter = { // 确定性种子 + 10s 抖动；FinAdapter 待 U-API-01 后按同一接口实现
    seed: null,
    load: function () {
      return fetch("seed.json").then(function (r) { return r.json(); }).then(function (s) {
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
      });
      return Promise.resolve(s);
    },
  };
  var FinAdapter = { // 桩：对接 upsOverview()（fan/UpsPodLib.fan），U-API-01 解锁
    load: function () { return Promise.reject(new Error("FinAdapter 未实现：待 FIN 5.3.0 实例（U-API-01）")); },
    poll: function () { return this.load(); },
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
  var ractive = null, prevSevMap = {}, snapshot = null;

  function snapshotSev(units) {
    var m = {};
    units.forEach(function (u) { m[u.id] = upsCore.topSeverity(u); });
    return m;
  }

  function render() {
    var r = parseHash();
    if (r.page === "unit" && r.unitId) { renderUnit(r.unitId); return; } // M2 占位
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
        return { unit: u, sev: sev, fresh: upsCore.classifyFreshness(u.ts, now, period),
                 tsText: u.ts === null ? "无数据" : new Date(u.ts).toLocaleTimeString() };
      }),
      pagination: pg, newRisks: risks, badgeSel: badgeSel,
    });
    prevSevMap = snapshotSev(snapshot.units);
  }

  function renderUnit(unitId) { // M2 未开工：占位 + 返回
    var u = snapshot.units.find(function (x) { return x.id === unitId; });
    ractive.reset({ view: "unit", unit: u || null, unitId: unitId });
  }

  function nav(q) { // 状态写入 hash → 返回时天然保留（REQ-M1-07）
    var qs = Object.keys(q).filter(function (k) { return q[k]; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(q[k]); }).join("&");
    location.hash = "/ups/overview" + (qs ? "?" + qs : "");
  }

  function boot() {
    adapter.load().then(function (s) {
      snapshot = s;
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
          setInterval(function () { // Q2：10s 轮询
            adapter.poll().then(function () { if (parseHash().page !== "unit") renderOverview(currentQ()); });
          }, s.pollPeriodMs);
        },
      });
      window.__upsPod = ractive; // 调试/走查钩子（参照 docs/demo 先例）
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






