"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const utils = require("./pod-check-utils");

assert.strictEqual(typeof utils.findForbiddenPathHits, "function",
  "shared POD checks must inspect normalized file and ZIP entry paths");
assert.strictEqual(typeof utils.findForbiddenContentHits, "function",
  "shared POD checks must enforce deployment and generator content boundaries");
assert.strictEqual(typeof utils.samePath, "function",
  "output POD comparison must follow platform path semantics");
assert.strictEqual(typeof utils.findR3AppHits, "function",
  "R3 must enforce random, wall-clock, and fail-closed structure");

assert.strictEqual(utils.samePath("C:\\Repo\\output\\upsPod.pod", "c:/repo/output/UPSPOD.POD", "win32"), true,
  "Windows path comparison must be case-insensitive");
assert.strictEqual(utils.samePath("/Repo/output/upsPod.pod", "/repo/output/upsPod.pod", "linux"), false,
  "POSIX path comparison must remain case-sensitive");
assert.strictEqual(utils.samePath("/repo/output/../output/upsPod.pod", "/repo/output/upsPod.pod", "linux"), true,
  "POSIX path comparison must normalize dot segments");
const currentLeft = process.platform === "win32" ? "C:\\Repo\\output\\upsPod.pod" : "/tmp/Repo/output/upsPod.pod";
const currentRight = process.platform === "win32" ? "c:\\repo\\output\\UPSPOD.POD" : "/tmp/repo/output/upsPod.pod";
assert.strictEqual(utils.samePath(currentLeft, currentRight, process.platform), process.platform === "win32",
  "current-platform path comparison must use native case semantics");

const validApp = fs.readFileSync(path.join(__dirname, "..", "..", "extensions", "upsPod", "frontend", "app.js"), "utf8");
assert.deepStrictEqual(utils.findR3AppHits(validApp, "valid"), [],
  "current production app must satisfy the structural R3 contract");

const syntheticApp = `
  function renamedTelemetryBuilder() {
    var anchor = Date.now();
    return { value: Math.random(), series: [{ ts: anchor, value: 1 }], events: [{ at: new Date() }] };
  }
  var adapter = FinAdapter;
`;
const syntheticHits = utils.findR3AppHits(syntheticApp, "negative").join("\n");
assert.match(syntheticHits, /Math\.random/);
assert.match(syntheticHits, /unexpected Date\.now/);
assert.match(syntheticHits, /unexpected new Date/);
assert.match(syntheticHits, /fail-closed fatal/);
assert.match(syntheticHits, /bootstrap must terminate through showFatal/);

const repo = path.resolve("C:\\repo");
const sourceRules = {
  exact: [
    "extensions/upsPod/frontend/seed.json",
    "extensions/upsPod/frontend/seed-data.js",
    "scripts/seed/demoSeed.js",
  ],
  prefixes: ["scripts/seed/"],
};

const sourceHits = utils.findForbiddenPathHits([
  path.join(repo, "extensions", "upsPod", "frontend", "seed.json"),
  path.join(repo, "extensions", "upsPod", "frontend", "seed-data.js"),
  path.join(repo, "scripts", "seed", "demoSeed.js"),
  path.join(repo, "scripts", "seed", "another-generator.fan"),
  path.join(repo, "extensions", "upsPod", "frontend", "app.js"),
], repo, sourceRules, "source");

assert.deepStrictEqual(sourceHits, [
  "source extensions/upsPod/frontend/seed.json: forbidden path",
  "source extensions/upsPod/frontend/seed-data.js: forbidden path",
  "source scripts/seed/demoSeed.js: forbidden path",
  "source scripts/seed/another-generator.fan: forbidden path",
]);

let podHits;
assert.doesNotThrow(() => {
  podHits = utils.findForbiddenPathHits([
    "./frontend\\seed.json",
    "/frontend/seed-data.js",
    "scripts/seed/",
    "frontend/app.js",
  ], null, { exact: ["frontend/seed.json", "frontend/seed-data.js"], prefixes: ["scripts/seed/"] }, "pod");
}, "raw ZIP entry names must be normalized without a filesystem base path");

assert.deepStrictEqual(podHits, [
  "pod frontend/seed.json: forbidden path",
  "pod frontend/seed-data.js: forbidden path",
  "pod scripts/seed/: forbidden path",
]);

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "upsPod-utils-test-"));
try {
  const deploy = path.join(tempRoot, "scripts", "deploy-upsPod.ps1");
  const install = path.join(tempRoot, "scripts", "install-upsPod.ps1");
  const app = path.join(tempRoot, "extensions", "upsPod", "frontend", "app.js");
  [deploy, install, app].forEach((file) => fs.mkdirSync(path.dirname(file), { recursive: true }));
  fs.writeFileSync(deploy, "Invoke-Thing seed");
  fs.writeFileSync(install, "upsPodTreeSeed()");
  fs.writeFileSync(app, "demoSeed()");

  const contentHits = utils.findForbiddenContentHits([deploy, install, app], tempRoot, [
    { name: "seed deployment", pattern: /upsPodTreeSeed|seed project tree|\bseed\b/i,
      paths: /^scripts\/(?:deploy|install).*\.ps1$/i },
    { name: "demo generator", pattern: /demoSeed/i },
  ], "source");

  assert.deepStrictEqual(contentHits, [
    "source scripts/deploy-upsPod.ps1: seed deployment",
    "source scripts/install-upsPod.ps1: seed deployment",
    "source extensions/upsPod/frontend/app.js: demo generator",
  ]);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log("PASS POD path, platform path, and R3 source guards");
