/* UPS POD frontend: Folio overview with explicit gaps for unsupported data. */
(function (global) {
  "use strict";

  var SEV_RANK = { critical: 0, warning: 1, normal: 2, commLost: 3 };
  var VALID_SPANS = ["1h", "24h", "7d", "30d"];

  function topSeverity(unit) {
    if (unit.commLost) return "commLost";
    if (unit.mode === "battery" && unit.soc !== null && unit.soc < 30) return "critical";
    if (unit.mode === "battery") return "warning";
    return "normal";
  }

  function classifyFreshness(ts, now, periodMs) {
    if (ts === null || ts === undefined) return "gap";
    if (now - ts > 2 * periodMs) return "stale";
    return "ok";
  }

  function filterUnits(units, filter) {
    filter = filter || {};
    return units.filter(function (unit) {
      if (filter.site && unit.siteId !== filter.site) return false;
      if (filter.comm === "lost" && !unit.commLost) return false;
      if (filter.comm === "ok" && unit.commLost) return false;
      if (filter.mode && unit.mode !== filter.mode) return false;
      if (filter.sev && topSeverity(unit) !== filter.sev) return false;
      return true;
    });
  }

  function sortUnits(units) {
    return units.slice().sort(function (a, b) {
      var rank = SEV_RANK[topSeverity(a)] - SEV_RANK[topSeverity(b)];
      if (rank !== 0) return rank;
      if (a.commLost !== b.commLost) return a.commLost ? 1 : -1;
      return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
    });
  }

  function statCounts(units) {
    var counts = { critical: 0, warning: 0, normal: 0, commLost: 0 };
    units.forEach(function (unit) { counts[topSeverity(unit)]++; });
    return counts;
  }

  function paginate(list, page, pageSize) {
    var pages = Math.max(1, Math.ceil(list.length / pageSize));
    page = Math.min(Math.max(1, page), pages);
    return { page: page, pages: pages, total: list.length,
      items: list.slice((page - 1) * pageSize, page * pageSize) };
  }

  function detectNewRisks(previous, units, now, periodMs) {
    var risks = [];
    units.forEach(function (unit) {
      var severity = topSeverity(unit);
      if (previous[unit.id] === undefined) return;
      if (SEV_RANK[severity] < SEV_RANK[previous[unit.id]] && classifyFreshness(unit.ts, now, periodMs) === "ok") {
        risks.push({ id: unit.id, name: unit.name, from: previous[unit.id], to: severity });
      }
    });
    return risks;
  }

  function sparklinePoints(history, width, height, low, high) {
    if (!history || history.length < 2) return "";
    var range = (high - low) || 1;
    return history.map(function (value, index) {
      var x = Math.round(index * width / (history.length - 1) * 10) / 10;
      var y = Math.round((height - (value - low) / range * height) * 10) / 10;
      return x + "," + y;
    }).join(" ");
  }

  function hasTrend(unit) {
    return !unit.commLost && Array.isArray(unit.socHistory) && unit.socHistory.length >= 2;
  }

  function normalizeHistoryQuery(query) {
    query = query || {};
    var validMetrics = ["soc", "load", "temp"];
    var metrics = query.metrics === undefined || query.metrics === null
      ? ["soc", "load"]
      : String(query.metrics).split(",").filter(function (metric) { return validMetrics.indexOf(metric) >= 0; })
        .filter(function (metric, index, all) { return all.indexOf(metric) === index; });
    return { metrics: metrics, span: VALID_SPANS.indexOf(query.span) >= 0 ? query.span : "24h" };
  }

  function normalizeFinSnapshot(raw) {
    raw = raw || {};
    var sites = (raw.sites || []).map(function (site) {
      return { id: String(site.id), name: String(site.name || site.dis || site.id) };
    });
    var units = (raw.units || []).map(function (source) {
      var ts = typeof source.ts === "number" ? source.ts : null;
      var commLost = !!source.commLost || ts === null;
      return {
        id: String(source.id),
        name: String(source.name || source.dis || source.id),
        siteId: String(source.siteId || ""),
        siteName: String(source.siteName || source.siteId || ""),
        floorId: String(source.floorId || ""),
        floorName: String(source.floorName || ""),
        location: String(source.location || source.floorName || ""),
        make: source.make || "",
        model: source.model || "",
        serial: source.serial || "",
        ratedKva: source.ratedKva === undefined ? null : source.ratedKva,
        loadPct: typeof source.loadPct === "number" ? source.loadPct : null,
        soc: typeof source.soc === "number" ? source.soc : null,
        batteryTemp: typeof source.batteryTemp === "number" ? source.batteryTemp : null,
        commLost: commLost,
        mode: source.mode || (commLost ? "offline" : "online"),
        ts: ts,
        socHistory: [],
        loadHistory: [],
        detail: null,
      };
    });
    return {
      source: raw.source || "fin-folio",
      sourceText: raw.sourceText || "Folio 设备树数据",
      pollPeriodMs: raw.pollPeriodMs || 10000,
      generatedAt: raw.generatedAt || Date.now(),
      sites: sites,
      units: units,
    };
  }

  function findUnit(units, id) {
    return (units || []).find(function (unit) { return unit.id === id; }) || null;
  }

  function unavailableDetail(units, id) {
    var unit = findUnit(units, id);
    if (!unit) return null;
    return { unit: unit, detail: null, available: false, dataGap: true, status: "unavailable",
      series: {}, events: [],
      reason: "Folio 详情数据源尚未接入，当前仅提供实时总览。" };
  }

  function unavailableHistory(units, id, query) {
    var unit = findUnit(units, id);
    if (!unit) return null;
    var normalized = normalizeHistoryQuery(query);
    var series = {};
    normalized.metrics.forEach(function (metric) { series[metric] = []; });
    return {
      unit: unit,
      available: false,
      dataGap: true,
      status: "unavailable",
      reason: "Folio 历史与事件数据源尚未接入；未从当前值反推曲线或事件。",
      series: series,
      events: [],
      meta: { span: normalized.span, grainMs: null, anchorTs: null, metrics: normalized.metrics },
    };
  }

  function parseHashValue(hash) {
    try {
      var parts = String(hash || "").replace(/^#\/?/, "").split("?");
      var segments = parts[0].split("/").filter(Boolean).map(function (segment) {
        return decodeURIComponent(segment);
      });
      var query = {};
      (parts[1] || "").split("&").forEach(function (entry) {
        if (!entry) return;
        var equals = entry.indexOf("=");
        var key = equals < 0 ? entry : entry.slice(0, equals);
        var value = equals < 0 ? "" : entry.slice(equals + 1);
        query[decodeURIComponent(key)] = decodeURIComponent(value);
      });
      return { page: segments[1] || "overview", unitId: segments[2] || null,
        q: query, invalid: false, error: null };
    } catch (error) {
      return { page: "invalid", unitId: null, q: {}, invalid: true,
        error: "路由编码无效，已拒绝解析。" };
    }
  }

  function splitZincLine(line) {
    var output = [], current = "", quote = false, escaped = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line.charAt(i);
      if (escaped) { current += ch; escaped = false; continue; }
      if (ch === "\\") { current += ch; escaped = true; continue; }
      if (ch === "\"") { current += ch; quote = !quote; continue; }
      if (ch === "," && !quote) { output.push(current); current = ""; continue; }
      current += ch;
    }
    output.push(current);
    return output;
  }

  function parseZincGrid(text, parseScalar) {
    var lines = String(text || "").replace(/\r/g, "").split("\n").filter(function (line) { return line.trim() !== ""; });
    if (!lines.length || lines[0].indexOf("ver:") !== 0) throw new Error("Folio 数据接口返回格式不是 Zinc Grid");
    if (lines.length < 2) return { meta: {}, cols: [], rows: [] };
    var cols = splitZincLine(lines[1]).map(function (col) { return col.split(" ")[0].trim(); }).filter(Boolean);
    var rows = lines.slice(2).map(function (line) {
      var values = splitZincLine(line), row = {};
      cols.forEach(function (col, index) { row[col] = parseScalar(values[index]); });
      return row;
    });
    return { meta: {}, cols: cols, rows: rows };
  }

  function gridToSnapshot(grid) {
    var sites = {};
    var units = grid.rows.map(function (row) {
      var siteId = row.siteId ? String(row.siteId) : "";
      if (siteId) sites[siteId] = { id: siteId, name: String(row.siteName || siteId) };
      return {
        id: String(row.id || ""), name: String(row.dis || row.name || row.id || ""),
        siteId: siteId, siteName: String(row.siteName || siteId),
        floorId: row.floorId ? String(row.floorId) : "", floorName: String(row.floorName || ""),
        location: String(row.location || ""), make: row.make || "", model: row.model || "",
        serial: row.serial || "", ratedKva: row.ratedKva === undefined ? null : row.ratedKva,
        soc: typeof row.soc === "number" ? row.soc : null,
        loadPct: typeof row.loadPct === "number" ? row.loadPct : null,
        batteryTemp: typeof row.batteryTemp === "number" ? row.batteryTemp : null,
        commLost: !!row.commLost, mode: row.mode || "", ts: typeof row.ts === "number" ? row.ts : null,
      };
    });
    return { source: "fin-folio", sourceText: "Folio 设备树数据", pollPeriodMs: 10000,
      generatedAt: Date.now(), sites: Object.keys(sites).sort().map(function (id) { return sites[id]; }), units: units };
  }

  function pollTransition(state, outcome) {
    if (outcome && outcome.ok) return { snapshot: outcome.snapshot, loadError: null };
    var error = outcome && outcome.error;
    return { snapshot: state.snapshot,
      loadError: "实时刷新失败，继续显示最后一次成功数据：" + String(error && error.message || error || "未知错误") };
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
    hasTrend: hasTrend,
    normalizeHistoryQuery: normalizeHistoryQuery,
    normalizeFinSnapshot: normalizeFinSnapshot,
    unavailableDetail: unavailableDetail,
    unavailableHistory: unavailableHistory,
    parseHashValue: parseHashValue,
    parseZincGrid: parseZincGrid,
    gridToSnapshot: gridToSnapshot,
    pollTransition: pollTransition,
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = upsCore; return; }
  global.upsCore = upsCore;

  var FinAdapter = {
    snapshot: null,
    projectName: function () {
      var candidates = [location.pathname, document.referrer || ""];
      try { if (parent && parent.location) candidates.push(parent.location.pathname); } catch (e) {}
      try { if (top && top.location) candidates.push(top.location.pathname); } catch (e) {}
      for (var i = 0; i < candidates.length; i++) {
        var match = String(candidates[i]).match(/\/finMobile\/([^\/?#]+)/) || String(candidates[i]).match(/\/api\/([^\/?#]+)/);
        if (match) return decodeURIComponent(match[1]);
      }
      throw new Error("无法确定 FIN 项目名，不能读取 Folio");
    },
    evalUrl: function () { return "/api/" + encodeURIComponent(FinAdapter.projectName()) + "/eval"; },
    load: function () {
      return FinAdapter.evalAxon("upsOverview()").then(function (raw) {
        FinAdapter.snapshot = normalizeFinSnapshot(raw);
        return FinAdapter.snapshot;
      });
    },
    poll: function () { return this.load(); },
    detail: function (id) {
      return Promise.resolve(unavailableDetail(FinAdapter.snapshot ? FinAdapter.snapshot.units : [], id));
    },
    history: function (id, query) {
      return Promise.resolve(unavailableHistory(FinAdapter.snapshot ? FinAdapter.snapshot.units : [], id, query));
    },
    evalAxon: function (expression) {
      return global.FinApi.evalZinc(fetch, FinAdapter.evalUrl(), expression).then(function (text) {
        return FinAdapter.gridToSnapshot(FinAdapter.parseZincGrid(text));
      });
    },
    parseZincGrid: function (text) {
      return parseZincGrid(text, global.FinApi.parseZincScalar);
    },
    splitZincLine: splitZincLine,
    gridToSnapshot: function (grid) {
      return gridToSnapshot(grid);
    },
  };
  var adapter = FinAdapter;

  var ractive = null, snapshot = null, previousSeverity = {}, loadError = null;

  function parseHash() {
    return parseHashValue(location.hash);
  }

  function currentSeverity(units) {
    var result = {};
    units.forEach(function (unit) { result[unit.id] = topSeverity(unit); });
    return result;
  }

  function resetView(data) {
    data.loadError = loadError;
    ractive.reset(data);
  }

  function renderOverview(query) {
    var filter = { site: query.site || "", comm: query.comm || "", mode: query.mode || "", sev: query.sev || "" };
    var page = parseInt(query.page || "1", 10), pageSize = parseInt(query.ps || "50", 10);
    var sorted = sortUnits(filterUnits(snapshot.units, filter));
    var pagination = paginate(sorted, page, pageSize), now = Date.now();
    resetView({ view: "overview", sites: snapshot.sites, filter: filter, pageSize: String(pageSize),
      stats: statCounts(snapshot.units), pagination: pagination,
      newRisks: detectNewRisks(previousSeverity, snapshot.units, now, snapshot.pollPeriodMs),
      badges: pagination.items.map(function (unit) {
        var severity = topSeverity(unit), freshness = classifyFreshness(unit.ts, now, snapshot.pollPeriodMs);
        return { unit: unit, sev: severity, fresh: freshness,
          tsText: unit.ts === null ? "无数据" : new Date(unit.ts).toLocaleTimeString() };
      }) });
    previousSeverity = currentSeverity(snapshot.units);
  }

  function render() {
    var route = parseHash();
    if (route.invalid) {
      resetView({ view: "unavailable", title: "路由不可用", reason: route.error });
      return;
    }
    if (route.page === "unit" && route.unitId) {
      var detail = unavailableDetail(snapshot.units, route.unitId);
      resetView({ view: "unit", unitId: route.unitId, unit: detail && detail.unit, gap: detail });
      return;
    }
    if (route.page === "history" && route.unitId) {
      var historyGap = unavailableHistory(snapshot.units, route.unitId, route.q);
      resetView({ view: "history", unitId: route.unitId, unit: historyGap && historyGap.unit, gap: historyGap });
      return;
    }
    if (["alarms", "config", "audit"].indexOf(route.page) >= 0) {
      resetView({ view: "unavailable", title: route.page === "alarms" ? "告警中心" : route.page === "config" ? "运行配置" : "审计追踪",
        reason: "该功能尚无 Folio 后端数据源，当前为只读数据缺口，未生成或修改任何演示状态。" });
      return;
    }
    renderOverview(route.q);
  }

  function nav(query) {
    var text = Object.keys(query).filter(function (key) { return query[key]; })
      .map(function (key) { return encodeURIComponent(key) + "=" + encodeURIComponent(query[key]); }).join("&");
    location.hash = "/ups/overview" + (text ? "?" + text : "");
  }

  function showFatal(error) {
    document.getElementById("app").innerHTML = '<div class="fatal">加载失败（fail-closed，不兜底）：' +
      String(error && error.message || error) + "</div>";
  }

  function boot() {
    try {
      document.getElementById("data-mode").textContent = "Folio 设备树数据 · 当前项目：" + adapter.projectName() +
        " · 实时读取 site/floor/equip/point；无静态兜底。";
    } catch (error) { showFatal(error); return; }
    adapter.load().then(function (loaded) {
      snapshot = loaded;
      ractive = new Ractive({
        el: "#app", template: "#overview-template", data: { view: "loading", loadError: null },
        oninit: function () {
          this.on("filter", function (event) { nav({ site: event.site || "", comm: event.comm || "", mode: event.mode || "", sev: event.sev || "" }); });
          this.on("setPage", function (event, page) { var query = parseHash().q; query.page = page; nav(query); });
          this.on("setPageSize", function (event) { var query = parseHash().q; query.ps = event.node.value; query.page = 1; nav(query); });
          this.on("goUnit", function (event, id) { location.hash = "/ups/unit/" + encodeURIComponent(id); });
          this.on("goHistory", function (event, id) { location.hash = "/ups/history/" + encodeURIComponent(id); });
          this.on("goBack", function () { history.back(); });
        },
      });
      global.__upsPod = ractive;
      global.__upsPod.adapter = adapter;
      global.addEventListener("hashchange", render);
      render();
      setInterval(function () {
        adapter.poll().then(function (loadedAgain) {
          var state = pollTransition({ snapshot: snapshot, loadError: loadError }, { ok: true, snapshot: loadedAgain });
          snapshot = state.snapshot;
          loadError = state.loadError;
          render();
        }).catch(function (error) {
          var state = pollTransition({ snapshot: snapshot, loadError: loadError }, { ok: false, error: error });
          snapshot = state.snapshot;
          loadError = state.loadError;
          render();
        });
      }, loaded.pollPeriodMs);
    }).catch(showFatal);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
