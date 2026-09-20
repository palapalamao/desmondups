// R3: production source and the explicitly built POD must contain no fabricated-data path.
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const {
  ROOT,
  POD_ROOT,
  productionSourceFiles,
  normalizedRelative,
  findForbiddenPathHits,
  findForbiddenContentHits,
  findR3AppHits,
  requireOutputPod,
  withExtractedPod,
} = require("./pod-check-utils");

const forbidden = [
  "Math.random",
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

const sourcePathRules = {
  exact: [
    "extensions/upsPod/frontend/seed.json",
    "extensions/upsPod/frontend/seed-data.js",
    "scripts/seed/demoSeed.js",
    "scripts/seed/upsPodTreeSeed.fan",
  ],
  prefixes: ["scripts/seed/"],
};
const podPathRules = {
  exact: ["frontend/seed.json", "frontend/seed-data.js", "scripts/seed/demoSeed.js"],
  prefixes: ["scripts/seed/"],
};
const seedBoundaryRules = [
  { name: "upsPodTreeSeed", pattern: /upsPodTreeSeed/i },
  { name: "demoSeed", pattern: /demoSeed/i },
  { name: "seed project tree", pattern: /seed project tree/i },
  { name: "seed deployment", pattern: /\bseed\b/i, paths: /^scripts\/(?:deploy|install).*\.ps1$/i },
];

function scan(files, label, baseDir) {
  const hits = [];
  files.forEach((file) => {
    const body = fs.readFileSync(file);
    const entry = normalizedRelative(baseDir, file);
    forbidden.forEach((token) => {
      // Vendored Ractive uses randomness only for internal instance IDs; R4 owns that immutable dependency.
      if (token === "Math.random" && /(?:^|\/)frontend\/vendor\//.test(entry)) return;
      if (body.includes(Buffer.from(token))) {
        hits.push(label + " " + entry + ": " + token);
      }
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

  const normalized = core.normalizeFinSnapshot({ units: [{ id: "@gap", soc: null, loadPct: null,
    batteryTemp: null, ts: null }] }).units[0];
  assert.strictEqual(normalized.soc, null, label + " normalized.soc");
  assert.strictEqual(normalized.loadPct, null, label + " normalized.loadPct");
  assert.strictEqual(normalized.batteryTemp, null, label + " normalized.batteryTemp");
  assert.strictEqual(normalized.ts, null, label + " normalized.ts");
  assert.strictEqual(normalized.commLost, true, label + " normalized.commLost");
  assert.deepStrictEqual(normalized.socHistory, [], label + " normalized.socHistory");
  assert.deepStrictEqual(normalized.loadHistory, [], label + " normalized.loadHistory");
  assert.strictEqual(normalized.detail, null, label + " normalized.detail");

  const previous = { units: [{ id: "@last-good" }] };
  const failedPoll = core.pollTransition({ snapshot: previous, loadError: null },
    { ok: false, error: new Error("offline") });
  assert.strictEqual(failedPoll.snapshot, previous, label + " failed poll snapshot");
  assert.match(failedPoll.loadError, /offline/, label + " failed poll error");
}

try {
  const podFile = requireOutputPod(process.argv.slice(2), "node scripts/check/r3-no-fake-data.cjs");
  const sourceFiles = productionSourceFiles();
  const hits = scan(sourceFiles, "source", ROOT);
  hits.push(...findForbiddenPathHits(sourceFiles, ROOT, sourcePathRules, "source"));
  hits.push(...findForbiddenContentHits(sourceFiles, ROOT, seedBoundaryRules, "source"));
  const sourceApp = path.join(POD_ROOT, "frontend", "app.js");
  hits.push(...findR3AppHits(fs.readFileSync(sourceApp, "utf8"), "source"));
  assertGapContract(require(sourceApp), "source");

  withExtractedPod(podFile, (podDir, podFiles, podEntries) => {
    hits.push(...scan(podFiles, "pod", podDir));
    hits.push(...findForbiddenPathHits(podEntries, null, podPathRules, "pod"));
    hits.push(...findForbiddenContentHits(podFiles, podDir, seedBoundaryRules, "pod"));
    const builtApp = path.join(podDir, "frontend", "app.js");
    hits.push(...findR3AppHits(fs.readFileSync(builtApp, "utf8"), "pod"));
    assertGapContract(require(builtApp), "pod");
  });

  if (hits.length) throw new Error("R3 禁止项:\n" + hits.join("\n"));
  console.log("PASS R3 production source and explicit output POD contain no fabricated-data path; gap contracts verified");
} catch (error) {
  console.error("FAIL R3", error.message);
  process.exit(1);
}
