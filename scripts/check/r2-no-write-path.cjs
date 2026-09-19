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
// R2 落点 7（详设 M2 §5）：详情页告警区只读——unit 视图模板段不得出现确认/写操作处理器
const html = fs.readFileSync(path.join(POD, "frontend", "index.html"), "utf8");
const seg = (html.split('{{elseif view === "unit"}}')[1] || "").split(/\r?\n\{\{else\}\}/)[0] || "";
const reAck = /\b(ackAlarm|confirmAlarm|acknowledgeAlarm|setAck|writeAck|ackPoint|doAck)\b/;
seg.split(/\r?\n/).forEach((line, i) => {
  if (reAck.test(line)) hits.push("[R2-详情告警只读] unit模板段:" + (i + 1) + "  " + line.trim().slice(0, 90));
});

// M6 落点（详设 M6 §4）：审计视图 append-only——audit 模板段禁写/改/删 handler（A27 CI 可证）
const segAudit = (html.split('{{elseif view === "audit"}}')[1] || "").split(/\r?\n\{\{else\}\}/)[0] || "";
const reAudit = /\b(deleteAudit|editAudit|modifyAudit|updateAudit|removeAudit|clearAudit|purgeLog)\b/;
segAudit.split(/\r?\n/).forEach((line, i) => {
  if (reAudit.test(line)) hits.push("[R2-审计append-only] audit模板段:" + (i + 1) + "  " + line.trim().slice(0, 90));
});

if (hits.length) { console.error("FAIL R2 发现写路径:\n" + hits.join("\n")); process.exit(1); }
console.log("PASS R2 无写点位/控制路径 + 详情告警区只读");
