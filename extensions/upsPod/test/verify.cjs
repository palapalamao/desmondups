// verify.cjs — production frontend boundary
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const core = require("../frontend/app.js");

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
  assert.match(app, /var adapter = FinAdapter;/);
  assert.match(app, /detail:\s*function[\s\S]*?unavailableDetail\(/);
  assert.match(app, /history:\s*function[\s\S]*?unavailableHistory\(/);
  [
    ["MockAdapter", /MockAdapter/], ["mock query", /mock=1/], ["overview generator", /genHistory/],
    ["history generator", /deriveHistory/], ["event generator", /deriveEvents/], ["PRNG", /prnd3/],
    ["metric domain", /METRIC_DOMAIN/], ["alarm pseudo-write", /applyAck|submitAck|openAck|ackNote|mock-operator/],
    ["config pseudo-write", /publishConfig|rollbackConfig|submitPublish|rollbackTo|configStore/],
  ].forEach(([label, re]) => {
    assert.doesNotMatch(app, re, "app.js contains " + label);
    assert.doesNotMatch(html, re, "index.html contains " + label);
  });
  assert.match(html, /不可用|缺口/);
});

console.log(`\n${pass}/${total} passed${process.exitCode ? " (failures present)" : ""}`);
