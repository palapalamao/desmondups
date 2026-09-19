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

// 红线 R3：宁缺毋假——数据链路无随机源/墙钟进种子；fail-closed 不得造假兜底
const appJs = path.join(POD, "frontend", "app.js");
const seedJs = path.join(__dirname, "..", "seed", "demoSeed.js");
scan(appJs, /Math\.random/, "[R3-random]");
scan(seedJs, /Math\.random|Date\.now|new Date\(/, "[R3-wallclock]");
const boot = fs.readFileSync(appJs, "utf8");
if (!boot.includes("加载失败（fail-closed")) hits.push("[R3] app.js 缺少 fail-closed fatal 文案，疑似存在静默兜底");
if (hits.length) { console.error("FAIL R3 宁缺毋假违规:\n" + hits.join("\n")); process.exit(1); }
console.log("PASS R3 无随机源/墙钟/静默兜底");
