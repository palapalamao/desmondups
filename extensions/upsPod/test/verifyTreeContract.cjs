"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const lib = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodLib.fan"), "utf8");
const tree = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodTree.fan"), "utf8");
const behavior = fs.readFileSync(path.join(__dirname, "UpsPodTreeTest.fan"), "utf8");
const ext = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodExt.fan"), "utf8");
const build = fs.readFileSync(path.join(__dirname, "..", "build.fan"), "utf8");
const deploy = fs.readFileSync(path.join(__dirname, "..", "..", "..", "scripts", "deploy-upsPod-tree.ps1"), "utf8");

assert.match(lib, /return p\.get\("curVal", null\)/, "overview must read point curVal only");
assert.doesNotMatch(lib, /p\.get\("val"|p\.get\("dmValue"/, "overview must not fall back to val/dmValue");
assert.match(lib, /p\.get\("curStatusTs", null\)/, "overview timestamp must use curStatusTs only");
assert.doesNotMatch(lib, /p\.get\("ts"|p\.get\("mod"/, "overview timestamp must not fall back to ts/mod");

const production = [ext, build, deploy].join("\n");
[
  ["Diff.transient", /Diff\.transient/],
  ["lifecycle telemetry publisher", /publishSimCurVals|onHouseKeeping|houseKeepingFreq/],
  ["seed deployment", /upsPodTreeSeed|demoSeed|seed project tree|\bseed\b/i],
].forEach(([label, pattern]) => assert.doesNotMatch(production, pattern, "production source must not contain " + label));
assert.ok(!fs.existsSync(path.join(__dirname, "..", "..", "..", "scripts", "seed", "demoSeed.js")), "demo generator must be removed");
assert.ok(!fs.existsSync(path.join(__dirname, "..", "..", "..", "scripts", "seed", "upsPodTreeSeed.fan")), "tree seed deployment must be removed");

assert.match(lib, /@Axon\s*\{\s*admin\s*=\s*false\s*\}\s*static Grid upsTreeRead\(\)/,
  "tree read Axon must be registered read-only");
["upsTreeCreate", "upsTreeUpdate"].forEach(name => {
  assert.match(lib, new RegExp("@Axon\\s*\\{\\s*admin\\s*=\\s*true\\s*\\}\\s*static Dict " + name + "\\("),
    name + " must be admin-only");
  assert.match(lib, new RegExp('checkAdmin\\("' + name + '"\\)'),
    name + " must perform a defense-in-depth admin check");
});
assert.match(lib, /UpsPodTree\.read\(HxContext\.curHx\(true\)\.db\)/,
  "tree read must use only the current HxContext database");
assert.match(lib, /UpsPodTree\.create\(cx\.db, recType, payloadJson\)/,
  "tree create must use only the current HxContext database");
assert.match(lib, /UpsPodTree\.update\(cx\.db, id, payloadJson\)/,
  "tree update must use only the current HxContext database");
assert.doesNotMatch(lib, /upsTreeDelete/, "tree API must not expose delete");

[
  'case "site":  return ["dis", "navName", "site", "tz", "upsSite", "upsTreeKey"]',
  'case "floor": return ["dis", "navName", "floor", "siteRef", "upsTreeKey"]',
  'case "site":  return ["dis", "navName", "tz"]',
  'case "floor": return ["dis", "navName"]',
  'case "point": return ["dis", "navName", "kind", "unit"]',
].forEach(contract => assert.ok(tree.includes(contract), "missing exact tree allowlist: " + contract));
assert.match(tree, /"make", "model", "serial", "ratedKva", "upsTreeKey"/,
  "equip create allowlist must include equipment metadata and stable key");
assert.match(tree, /"make", "model", "serial", "ratedKva"\]/,
  "equip update allowlist must include only mutable equipment metadata");
assert.match(tree, /"upsSocPct", "upsLoadPct", "upsBatteryTemp",\s*"upsCommStatus", "upsTreeKey"/,
  "point create allowlist must enumerate supported metric markers");
assert.match(tree, /count != 1/, "point create must require exactly one metric marker");
assert.match(tree, /"status": "conflict"[\s\S]*?"conflictId": existing\.id/,
  "conflicts must return the conflicting record id");
assert.doesNotMatch(tree, /Diff\.remove|Remove\.val|commitRemoveTrash/,
  "tree boundary must not expose deletion");
[
  "curVal", "curStatus", "curStatusTs", "his", "history", "alarms",
  "val", "dmValue", "upsSimVal", "upsSimTs",
].forEach(name => assert.ok(!tree.includes(`"${name}"`), `tree mutation source must not name reserved field ${name}`));
assert.match(behavior, /class UpsPodTreeTest : HxTest/,
  "tree behavior tests must run on the HxTest/Folio harness");
assert.match(behavior, /Type\.find\("hxd::HxdTestSpi"\)/,
  "tree behavior tests must select the isolated Hxd Folio runtime");

console.log("PASS TC-FIN-TREE-01 curVal-only read contract");
console.log("PASS TC-FIN-TREE-02 production telemetry path contains no simulator or seed mutation");
console.log("PASS TC-FIN-TREE-03 admin-only metadata mutation API and current-project db boundary");
console.log("PASS TC-FIN-TREE-04 exact create/update allowlists, conflicts, and no delete path");
console.log("PASS TC-FIN-TREE-05 real HxTest/Folio behavior harness is present");
