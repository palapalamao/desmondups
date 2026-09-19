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

// 红线 R2：只读优先——fan/与前端不得出现写点位/控制动作语义
const re = /\b(pointWrite|hisWrite|invokeAction|writePoint|actuate|commitTo|sendCommand)\b/;
walk(path.join(POD, "fan"), [".fan"]).forEach(f => scan(f, re, "[R2]"));
walk(path.join(POD, "frontend"), [".js"]).forEach(f => scan(f, re, "[R2]"));
if (hits.length) { console.error("FAIL R2 发现写路径:\n" + hits.join("\n")); process.exit(1); }
console.log("PASS R2 无写点位/控制路径");
