// R3: production source and the explicitly built POD must contain no fabricated-data path.
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  POD_ROOT,
  productionSourceFiles,
  requireOutputPod,
  withExtractedPod,
  relative,
} = require("./pod-check-utils");

const forbidden = [
  "MockAdapter",
  "mock=1",
  "genHistory",
  "deriveHistory",
  "deriveEvents",
  "prnd3",
  "METRIC_DOMAIN",
  "seed.json",
  "seed-data.js",
  "upsSimVal",
  "upsSimTs",
];

function scan(files, label) {
  const hits = [];
  files.forEach((file) => {
    const body = fs.readFileSync(file);
    forbidden.forEach((token) => {
      if (body.includes(Buffer.from(token))) hits.push(label + " " + relative(file) + ": " + token);
    });
  });
  return hits;
}

function assertGapContract(core, label) {
  const unit = { id: "@unit", name: "UPS 01", soc: null, loadPct: null, batteryTemp: null, ts: null };
  const detail = core.unavailableDetail([unit], unit.id);
  assert.strictEqual(detail.available, false, label + " detail.available");
  assert.strictEqual(detail.dataGap, true, label + " detail.dataGap");
  assert.strictEqual(detail.status, "unavailable", label + " detail.status");
  assert.strictEqual(detail.detail, null, label + " detail.detail");
  assert.deepStrictEqual(detail.series, {}, label + " detail.series");
  assert.deepStrictEqual(detail.events, [], label + " detail.events");

  const history = core.unavailableHistory([unit], unit.id, { metrics: "soc,load,temp", span: "7d" });
  assert.strictEqual(history.available, false, label + " history.available");
  assert.strictEqual(history.dataGap, true, label + " history.dataGap");
  assert.strictEqual(history.status, "unavailable", label + " history.status");
  assert.deepStrictEqual(history.series, { soc: [], load: [], temp: [] }, label + " history.series");
  assert.deepStrictEqual(history.events, [], label + " history.events");
}

try {
  const podFile = requireOutputPod(process.argv.slice(2), "node scripts/check/r3-no-fake-data.cjs");
  const hits = scan(productionSourceFiles(), "source");
  assertGapContract(require(path.join(POD_ROOT, "frontend", "app.js")), "source");

  withExtractedPod(podFile, (podDir, podFiles) => {
    hits.push(...scan(podFiles, "pod"));
    assertGapContract(require(path.join(podDir, "frontend", "app.js")), "pod");
  });

  if (hits.length) throw new Error("R3 禁止项:\n" + hits.join("\n"));
  console.log("PASS R3 production source and explicit output POD contain no fabricated-data path; gap contracts verified");
} catch (error) {
  console.error("FAIL R3", error.message);
  process.exit(1);
}
