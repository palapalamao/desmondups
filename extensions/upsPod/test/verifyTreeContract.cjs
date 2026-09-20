"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const lib = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodLib.fan"), "utf8");
const seed = fs.readFileSync(path.join(__dirname, "..", "..", "..", "scripts", "seed", "upsPodTreeSeed.fan"), "utf8");

assert.match(lib, /return p\.get\("curVal", null\)/, "overview must read point curVal only");
assert.doesNotMatch(lib, /p\.get\("val"|p\.get\("dmValue"/, "overview must not fall back to val/dmValue");
assert.match(lib, /p\.get\("curStatusTs", null\)/, "overview timestamp must use curStatusTs only");
assert.doesNotMatch(lib, /p\.get\("ts"|p\.get\("mod"/, "overview timestamp must not fall back to ts/mod");

assert.match(seed, /"upsSimVal"/, "simulated point source values must be persistent");
assert.match(seed, /"upsSimTs"/, "simulated point source timestamps must be persistent");
const ext = fs.readFileSync(path.join(__dirname, "..", "fan", "UpsPodExt.fan"), "utf8");
assert.match(ext, /changes\["curVal"\] = simVal/, "extension must publish simulated source as transient curVal");
assert.match(ext, /changes\["curStatusTs"\] = now/, "extension must refresh transient curStatusTs at collection time");
assert.match(ext, /Diff\.transient/, "curVal publication must use a transient Folio diff");
assert.match(ext, /houseKeepingFreq\(\) \{ 10sec \}/, "simulated connector must publish every 10 seconds");
assert.match(seed, /removeDuplicateUnits/, "seed migration must remove duplicate simulated UPS records");

console.log("PASS TC-FIN-TREE-01 curVal-only read contract");
console.log("PASS TC-FIN-TREE-02 deterministic duplicate cleanup contract");
