"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const lib = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodLib.fan"), "utf8");
const tree = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodTree.fan"), "utf8");
const behavior = fs.readFileSync(path.join(__dirname, "fan", "UpsPodTreeTest.fan"), "utf8");
const prodBuild = fs.readFileSync(path.join(__dirname, "..", "build.fan"), "utf8");
const testBuild = fs.readFileSync(path.join(__dirname, "build.fan"), "utf8");
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

["upsTreeRead", "upsTreeCreate", "upsTreeUpdate"].forEach(name => {
  const returnType = name === "upsTreeRead" ? "Grid" : "Dict";
  assert.match(lib, new RegExp("@Axon\\s*\\{\\s*admin\\s*=\\s*true\\s*\\}\\s*static " + returnType + " " + name + "\\("),
    name + " must be admin-only");
  assert.match(lib, new RegExp('checkAdmin\\("' + name + '"\\)'),
    name + " must perform a defense-in-depth admin check");
});
assert.match(lib, /UpsPodTree\.read\(cx\.db\)/,
  "tree read must use only the current HxContext database");
assert.match(lib, /UpsPodTree\.create\(cx\.db, recType, payloadJson\)/,
  "tree create must use only the current HxContext database");
assert.match(lib, /UpsPodTree\.update\(cx\.db, id, payloadJson\)/,
  "tree update must use only the current HxContext database");
assert.match(lib, /(?:^|\n)const class UpsPodLib\s*\{/,
  "Axon library type must remain internal to the production pod");
assert.match(tree, /(?:^|\n)const class UpsPodTree\s*\{/,
  "tree implementation type must remain internal to the production pod");
assert.doesNotMatch(lib + tree, /public const class UpsPod(?:Lib|Tree)/,
  "behavior tests must not expand the production pod API");
assert.doesNotMatch(lib, /upsTreeDelete/, "tree API must not expose delete");

[
  'case "site":  return ["dis", "navName", "tz", "upsTreeKey"]',
  'case "floor": return ["dis", "navName", "siteRef", "upsTreeKey"]',
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
assert.match(tree, /changes\[type\] = Marker\.val/,
  "server must inject the structural type marker");
assert.match(tree, /changes\["upsSite"\] = Marker\.val/,
  "server must inject upsSite for site records");
assert.match(tree, /changes\["upsUnit"\] = Marker\.val/,
  "server must inject upsUnit for equipment records");
assert.match(tree, /ConcurrentMap mutationLocks/,
  "mutation locks must be isolated by Folio in a concurrent map");
assert.match(tree, /db\.dir\.normalize\.uri\.toStr[\s\S]*mutationLocks\.getOrAdd/,
  "each Folio directory must resolve its own mutation gate");
assert.match(tree, /Duration\.now >= deadline[\s\S]*throw UpsPodTreeBusyErr\(\)/,
  "lock acquisition must have a bounded timeout and stable busy error");
assert.strictEqual((tree.match(/acquireMutationLock\(db\)/g) || []).length, 2,
  "both create and update must acquire the per-Folio mutation lock");
assert.strictEqual((tree.match(/gate\.val = false/g) || []).length, 2,
  "both create and update must release their gate in finally");
assert.match(tree, /effective\.isEmpty\) return result\("unchanged", old, type\)/,
  "identical updates must return unchanged without committing");
assert.match(tree, /"status": "conflict"[\s\S]*?"conflictId": existing\.id/,
  "conflicts must return the conflicting record id");
assert.doesNotMatch(tree, /Diff\.remove|commitRemoveTrash/,
  "tree boundary must not expose record deletion");
assert.match(tree, /allowRatedKvaRemove && name == "ratedKva"\) out\[name\] = Remove\.val/,
  "only ratedKva update null may translate to a tag removal");
assert.match(tree, /normalize\(parsePayload\(payloadJson\), updateAllowed\(type\), true\)/,
  "tag removal must be enabled only for update normalization");
[
  "curVal", "curStatus", "curStatusTs", "his", "history", "alarms",
  "val", "dmValue", "upsSimVal", "upsSimTs",
].forEach(name => assert.ok(!tree.includes(`"${name}"`), `tree mutation source must not name reserved field ${name}`));
assert.match(behavior, /class UpsPodTreeTest : HxTest/,
  "tree behavior tests must run on the HxTest/Folio harness");
assert.match(behavior, /Pod\.find\("upsPod"\)\.type\("UpsPod(?:Tree|Lib)"\)/,
  "separate test pod must reach internal production types reflectively");
assert.match(prodBuild, /srcDirs\s*=\s*\[`fan\/`\]/,
  "production pod must compile only fan sources");
assert.doesNotMatch(prodBuild, /`test\/`/,
  "production pod must not compile behavior tests");
assert.match(testBuild, /podName\s*=\s*"upsPodTest"[\s\S]*"upsPod 0\.8\.1"[\s\S]*srcDirs\s*=\s*\[`fan\/`\]/,
  "separate test pod must compile only test/fan and depend on the built upsPod pod");
assert.match(behavior, /Type\.find\("hxd::HxdTestSpi"\)/,
  "tree behavior tests must select the isolated Hxd Folio runtime");
assert.match(behavior, /addUser\([\s\S]*?makeContext\(/,
  "tree behavior tests must construct real user contexts");
assert.match(behavior, /testConcurrentIdempotentCreateCommitsExactlyOneRecord/,
  "tree behavior tests must cover overlapping idempotent creates");
assert.match(behavior, /testConcurrentMutationsPreserveSiblingNameUniqueness/,
  "tree behavior tests must cover update/update and create/update races");
assert.match(behavior, /testMutationLockIsPerFolioAndTimesOut/,
  "tree behavior tests must cover per-Folio isolation and bounded timeout");
assert.match(behavior, /testRepeatedUpdateDoesNotCommitOrNotifyObservers/,
  "tree behavior tests must cover commit-free repeated updates");
assert.match(behavior, /verifySame\(Actor\.locals\[actorKey\], sentinelCx\)/,
  "wrapper behavior tests must verify actor-local context restoration");
assert.match(behavior, /canonicalSnapshot\(db2\)/,
  "second isolated runtime must use a complete records and history snapshot");

console.log("PASS TC-FIN-TREE-01 curVal-only read contract");
console.log("PASS TC-FIN-TREE-02 production telemetry path contains no simulator or seed mutation");
console.log("PASS TC-FIN-TREE-03 admin-only metadata mutation API and current-project db boundary");
console.log("PASS TC-FIN-TREE-04 exact create/update allowlists, conflicts, and no delete path");
console.log("PASS TC-FIN-TREE-05 real HxTest/Folio behavior harness is present");
