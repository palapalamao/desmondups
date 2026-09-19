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

// 红线 R4：不改写上游内核——vendor 白名单 + fan 文件白名单 + 版本钉死
const vendor = fs.readdirSync(path.join(POD, "frontend", "vendor"));
if (vendor.join(",") !== "ractive.min.js") hits.push("[R4] vendor/ 清单越界: " + vendor.join(","));
const fanFiles = fs.readdirSync(path.join(POD, "fan")).sort().join(",");
if (fanFiles !== "UpsPodExt.fan,UpsPodLib.fan") hits.push("[R4] fan/ 文件越界: " + fanFiles);
const buildFan = fs.readFileSync(path.join(POD, "build.fan"), "utf8");
if (!/version = Version\("\d+\.\d+\.\d+"\)/.test(buildFan)) hits.push("[R4] build.fan 缺少钉死的版本号");
if (hits.length) { console.error("FAIL R4 内核边界违规:\n" + hits.join("\n")); process.exit(1); }
console.log("PASS R4 vendor/fan 白名单干净且版本钉死");
