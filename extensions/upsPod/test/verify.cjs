// verify.cjs — production frontend boundary
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const core = require("../frontend/app.js");
const FinApi = require("../frontend/fin-api.js");
const projectContextPath = path.join(__dirname, "..", "frontend", "project-context.js");
const ProjectContext = fs.existsSync(projectContextPath) ? require(projectContextPath) : {};

let pass = 0, total = 0;
function tc(id, name, fn) {
  total++;
  try { fn(); pass++; console.log("PASS", id, name); }
  catch (e) { console.error("FAIL", id, name, "-", e.message); process.exitCode = 1; }
}

const now = 1800000000000, period = 10000;
const mk = (o) => Object.assign({ id: "ups-01", name: "UPS-01", siteId: "site-01", siteName: "一号站点",
  floorId: "floor-01", floorName: "一层", location: "一层", commLost: false, mode: "online",
  loadPct: 41.25, soc: 92.75, batteryTemp: 26.5, ts: now }, o);

function browserEnvironment(options) {
  options = options || {};
  const origin = "https://fin.example";
  function frame(pathname) {
    return { location: { origin, pathname, href: origin + pathname } };
  }
  const environment = frame(options.selfPath || "/pod/upsPod/frontend/index.html");
  environment.parent = options.parentThrows
    ? Object.defineProperty({}, "location", { get() { throw new Error("cross origin"); } })
    : frame(options.parentPath || environment.location.pathname);
  environment.top = options.topThrows
    ? Object.defineProperty({}, "location", { get() { throw new Error("cross origin"); } })
    : frame(options.topPath || environment.location.pathname);
  environment.document = { referrer: options.referrer || "" };
  return environment;
}

tc("TC-M1-01", "severity uses current Folio values", () => {
  assert.strictEqual(core.topSeverity(mk({ mode: "battery", soc: 20 })), "critical");
  assert.strictEqual(core.topSeverity(mk({ mode: "battery", soc: 60 })), "warning");
  assert.strictEqual(core.topSeverity(mk({ mode: "online" })), "normal");
  assert.strictEqual(core.topSeverity(mk({ commLost: true })), "commLost");
});

tc("TC-M1-02", "freshness uses ok/stale/gap", () => {
  assert.strictEqual(core.classifyFreshness(now - 5000, now, period), "ok");
  assert.strictEqual(core.classifyFreshness(now - 30000, now, period), "stale");
  assert.strictEqual(core.classifyFreshness(null, now, period), "gap");
});

tc("TC-M1-03", "filter, sort, and pagination remain available", () => {
  const units = [mk({ id: "a", name: "B" }), mk({ id: "b", name: "A", mode: "battery", soc: 20 }), mk({ id: "c", commLost: true })];
  assert.deepStrictEqual(core.filterUnits(units, { comm: "lost" }).map((u) => u.id), ["c"]);
  assert.deepStrictEqual(core.sortUnits(units).map((u) => u.id), ["b", "a", "c"]);
  assert.deepStrictEqual(core.paginate(units, 1, 2).items.map((u) => u.id), ["a", "b"]);
});

tc("TC-FIN-01", "overview preserves Folio values and hierarchy", () => {
  const input = mk({ id: "@equip", make: "Vendor", model: "Model", serial: "SN-1", ratedKva: 80 });
  const snap = core.normalizeFinSnapshot({ source: "fin-folio", pollPeriodMs: 15000,
    sites: [{ id: "site-01", name: "一号站点" }], units: [input] });
  assert.strictEqual(snap.source, "fin-folio");
  assert.strictEqual(snap.pollPeriodMs, 15000);
  const unit = snap.units[0];
  ["id", "siteId", "siteName", "floorId", "floorName", "location", "make", "model", "serial", "ratedKva", "soc", "loadPct", "batteryTemp", "mode", "ts"]
    .forEach((key) => assert.strictEqual(unit[key], input[key], key));
  assert.deepStrictEqual(unit.socHistory, []);
  assert.deepStrictEqual(unit.loadHistory, []);
  assert.strictEqual(unit.detail, null);
});

tc("TC-FIN-02", "missing telemetry remains a gap", () => {
  const unit = core.normalizeFinSnapshot({ units: [mk({ soc: null, loadPct: null, batteryTemp: null, ts: null })] }).units[0];
  assert.strictEqual(unit.soc, null);
  assert.strictEqual(unit.loadPct, null);
  assert.strictEqual(unit.commLost, true);
  assert.strictEqual(core.hasTrend(unit), false);
});

tc("TC-FIN-03", "detail without a backend source is unavailable", () => {
  const result = core.unavailableDetail([mk({ id: "@equip" })], "@equip");
  assert.strictEqual(result.available, false);
  assert.strictEqual(result.dataGap, true);
  assert.strictEqual(result.status, "unavailable");
  assert.strictEqual(result.detail, null);
  assert.deepStrictEqual(result.series, {});
  assert.deepStrictEqual(result.events, []);
  assert.ok(result.reason);
  assert.strictEqual(result.unit.id, "@equip");
  assert.strictEqual(core.unavailableDetail([], "missing"), null);
});

tc("TC-FIN-04", "history and events are empty and unavailable", () => {
  const result = core.unavailableHistory([mk({ id: "@equip" })], "@equip", { metrics: "soc,load,temp", span: "7d" });
  assert.strictEqual(result.available, false);
  assert.strictEqual(result.dataGap, true);
  assert.strictEqual(result.status, "unavailable");
  assert.ok(result.reason);
  assert.deepStrictEqual(result.series, { soc: [], load: [], temp: [] });
  assert.deepStrictEqual(result.events, []);
  assert.deepStrictEqual(result.meta, { span: "7d", grainMs: null, anchorTs: null, metrics: ["soc", "load", "temp"] });
  assert.strictEqual(core.unavailableHistory([], "missing", {}), null);
});

tc("TC-FIN-05", "production frontend has only the Folio adapter and no pseudo writes", () => {
  const app = fs.readFileSync(path.join(__dirname, "..", "frontend", "app.js"), "utf8");
  const html = fs.readFileSync(path.join(__dirname, "..", "frontend", "index.html"), "utf8");
  assert.match(app, /upsOverview\(\)/);
  assert.match(app, /createFinAdapterFromEnvironment\(global,/);
  assert.match(app, /detail:\s*function[\s\S]*?unavailableDetail\(/);
  assert.match(app, /history:\s*function[\s\S]*?unavailableHistory\(/);
  [
    ["alarm pseudo-write", /applyAck|submitAck|openAck|ackNote|mock-operator/],
    ["config pseudo-write", /publishConfig|rollbackConfig|submitPublish|rollbackTo|configStore/],
  ].forEach(([label, re]) => {
    assert.doesNotMatch(app, re, "app.js contains " + label);
    assert.doesNotMatch(html, re, "index.html contains " + label);
  });
  assert.match(html, /不可用|缺口/);
});

tc("TC-FIN-06", "encoded unit ids round-trip and malformed routes fail closed", () => {
  const route = core.parseHashValue("#/ups/unit/p%3Aunit?site=site%3Aone");
  assert.deepStrictEqual(route, { page: "unit", unitId: "p:unit", q: { site: "site:one" }, invalid: false, error: null });
  const badSegment = core.parseHashValue("#/ups/unit/%E0%A4%A");
  assert.strictEqual(badSegment.invalid, true);
  assert.strictEqual(badSegment.page, "invalid");
  assert.strictEqual(badSegment.unitId, null);
  assert.ok(badSegment.error);
  const badQuery = core.parseHashValue("#/ups/overview?site=%ZZ");
  assert.strictEqual(badQuery.invalid, true);
  assert.strictEqual(badQuery.page, "invalid");
});

tc("TC-FIN-07", "real upsOverview Zinc columns carry equipment metadata to the UI snapshot", () => {
  const lib = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodLib.fan"), "utf8");
  assert.match(lib, /"floorName",\s*"location",\s*"make",\s*"model",\s*"serial",\s*"ratedKva",/);
  assert.match(lib, /row\["floorName"\],\s*row\["location"\],\s*row\["make"\],\s*row\["model"\],\s*row\["serial"\],\s*row\["ratedKva"\],/);
  const zinc = [
    'ver:"3.0"',
    "id,dis,siteId,siteName,floorId,floorName,location,make,model,serial,ratedKva,soc,loadPct,batteryTemp,commLost,mode,ts",
    '"p:unit","UPS 01","site:one","Site One","floor:one","Floor One","Room A","Acme","X1","SN-7",80,92.5,41.25,26.5,F,"online",Int("1800000000000")',
    "",
  ].join("\n");
  const grid = core.parseZincGrid(zinc, FinApi.parseZincScalar);
  const snap = core.normalizeFinSnapshot(core.gridToSnapshot(grid));
  assert.strictEqual(snap.units.length, 1);
  assert.deepStrictEqual(
    Object.fromEntries(["id", "location", "make", "model", "serial", "ratedKva"].map((key) => [key, snap.units[0][key]])),
    { id: "p:unit", location: "Room A", make: "Acme", model: "X1", serial: "SN-7", ratedKva: 80 }
  );
});

tc("TC-FIN-08", "poll failure preserves snapshot and later success clears the error", () => {
  const first = { units: [{ id: "first" }] }, second = { units: [{ id: "second" }] };
  const failed = core.pollTransition({ snapshot: first, loadError: null }, { ok: false, error: new Error("offline") });
  assert.strictEqual(failed.snapshot, first);
  assert.match(failed.loadError, /offline/);
  const recovered = core.pollTransition(failed, { ok: true, snapshot: second });
  assert.strictEqual(recovered.snapshot, second);
  assert.strictEqual(recovered.loadError, null);
  const app = fs.readFileSync(path.join(__dirname, "..", "frontend", "app.js"), "utf8");
  const pollBlock = app.match(/setInterval\(function \(\) \{[\s\S]*?\}, loaded\.pollPeriodMs\);/);
  assert.ok(pollBlock, "polling block must exist");
  assert.doesNotMatch(pollBlock[0], /showFatal|innerHTML/);
  assert.match(pollBlock[0], /pollTransition/);
});

tc("TC-FIN-09", "project context module is available to Node and browser callers", () => {
  assert.ok(fs.existsSync(projectContextPath), "project-context.js must exist");
  assert.strictEqual(typeof ProjectContext.resolveProjectContext, "function");
  const html = fs.readFileSync(path.join(__dirname, "..", "frontend", "index.html"), "utf8");
  const contextIndex = html.indexOf('<script src="project-context.js"></script>');
  const finApiIndex = html.indexOf('<script src="fin-api.js"></script>');
  const appIndex = html.indexOf('<script src="app.js"></script>');
  assert.ok(contextIndex >= 0 && contextIndex < finApiIndex && finApiIndex < appIndex,
    "project context and FIN API must load before app.js");
});

tc("TC-FIN-10", "project context accepts one normalized same-origin finMobile candidate", () => {
  const environment = browserEnvironment({
    parentPath: "/finMobile/my%2Dproject/dashboard",
    topPath: "/finMobile/my%2Dproject/dashboard",
    referrer: "https://fin.example/finMobile/my%2Dproject/",
  });
  const context = ProjectContext.resolveProjectContext(environment);
  assert.deepStrictEqual(context, { project: "my-project", evalUrl: "/api/my-project/eval" });
});

tc("TC-FIN-11", "cross-origin frames are ignored without weakening project resolution", () => {
  const context = ProjectContext.resolveProjectContext(browserEnvironment({
    parentThrows: true,
    topThrows: true,
    referrer: "https://fin.example/finMobile/mytest/",
  }));
  assert.strictEqual(context.project, "mytest");
});

tc("TC-FIN-12", "missing malformed and conflicting project candidates fail before fetch", () => {
  const cases = [
    browserEnvironment(),
    browserEnvironment({ parentPath: "/finMobile/%ZZ/", topPath: "/finMobile/%ZZ/" }),
    browserEnvironment({ parentPath: "/finMobile/bad.project/", topPath: "/finMobile/bad.project/" }),
    browserEnvironment({ parentPath: "/finMobile/alpha/", topPath: "/finMobile/beta/" }),
  ];
  cases.forEach((environment) => {
    let fetchCalls = 0;
    assert.throws(() => core.createFinAdapterFromEnvironment(environment, {
      projectContextApi: ProjectContext,
      finApi: FinApi,
      fetchImpl: () => { fetchCalls++; throw new Error("must not fetch"); },
    }), /项目|project/i);
    assert.strictEqual(fetchCalls, 0);
  });
});

tc("TC-FIN-13", "project discovery never accepts query or api-path fallbacks", () => {
  [
    browserEnvironment({ selfPath: "/pod/upsPod/frontend/index.html?project=mytest" }),
    browserEnvironment({ parentPath: "/api/mytest/eval", topPath: "/api/mytest/eval" }),
  ].forEach((environment) => {
    assert.throws(() => ProjectContext.resolveProjectContext(environment), /项目|project/i);
  });
});

console.log(`\n${pass}/${total} passed${process.exitCode ? " (failures present)" : ""}`);
