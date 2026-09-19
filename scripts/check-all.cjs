// UPS 红线 CI 全量检查入口：node scripts/check-all.cjs
"use strict";
const { execSync } = require("child_process");
const path = require("path");
const checks = ["r1-no-frontend-auth", "r2-no-write-path", "r3-no-fake-data", "r4-no-kernel-patch", "r5-idempotent-seed"];
let fail = 0;
checks.forEach(c => {
  try { console.log(execSync("node \"" + path.join(__dirname, "check", c + ".cjs") + "\"", { encoding: "utf8" }).trim()); }
  catch (e) { fail++; console.error((e.stdout || "").trim(), (e.stderr || "").trim()); }
});
console.log(fail ? "\n红线检查: " + fail + " 项失败" : "\n红线检查: 5/5 全部通过");
process.exit(fail ? 1 : 0);
