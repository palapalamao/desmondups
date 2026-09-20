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

console.log("PASS POD path guard rejects empty forbidden source files and ZIP entries");
