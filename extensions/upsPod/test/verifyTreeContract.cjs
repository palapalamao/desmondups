"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const lib = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodLib.fan"), "utf8");
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
].forEach(([label, pattern]) => assert.doesNotMatch(production, pattern, "production source must not contain " + label));

console.log("PASS TC-FIN-TREE-01 curVal-only read contract");
console.log("PASS TC-FIN-TREE-02 production telemetry path contains no transient simulator mutation");
