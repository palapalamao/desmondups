// UPS 红线 CI 检查（P6）——退出码 0=通过 1=失败；输出命中行便于定位
"use strict";
const fs = require("fs"), path = require("path");
const POD = path.join(__dirname, "..", "..", "extensions", "upsPod");
let hits = [];
function scan(file, re, label) {
  const txt = fs.readFileSync(file, "utf8");
  txt.split(/\r?\n/).forEach((line, i) => {
    if (re.test(line)) hits.push(label + " " + path.relative(path.join(__dirname, "..", ".."), file) + ":" + (i + 1) + "  " + line.trim().slice(0, 90));
  });
}
function walk(d, exts) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return e.name === "vendor" ? [] : walk(p, exts);
    return exts.includes(path.extname(e.name)) ? [p] : [];
  });
}

// 红线 R5（演示数据侧）：种子脚本幂等——两次生成逐字节一致
const { execSync } = require("child_process");
const seedPath = path.join(POD, "frontend", "seed.json");
const seedJs = path.join(__dirname, "..", "seed", "demoSeed.js");
const before = fs.readFileSync(seedPath, "utf8");
execSync("node \"" + seedJs + "\"");
const after = fs.readFileSync(seedPath, "utf8");
if (before !== after) { console.error("FAIL R5 种子两次生成不一致（长度 " + before.length + " vs " + after.length + "）"); process.exit(1); }
console.log("PASS R5 种子幂等（逐字节一致，长度 " + after.length + "）");
