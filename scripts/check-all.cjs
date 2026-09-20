// UPS 红线 CI 全量检查入口：默认检查当前 checkout 构建输出，也可显式传入同一路径。
"use strict";
const { spawnSync } = require("child_process");
const path = require("path");
const checks = ["pod-check-utils.test", "r1-no-frontend-auth", "r2-no-write-path", "r3-no-fake-data", "r4-no-kernel-patch", "r5-idempotent-seed"];
if (process.argv.length > 3) {
  console.error("Usage: node scripts/check-all.cjs [extensions/upsPod/output/upsPod.pod]");
  process.exit(1);
}
const builtPod = process.argv[2] || path.join(__dirname, "..", "extensions", "upsPod", "output", "upsPod.pod");
let fail = 0;
checks.forEach(c => {
  const args = [path.join(__dirname, "check", c + ".cjs")];
  if (c === "r3-no-fake-data" || c === "r5-idempotent-seed") args.push(builtPod);
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  if (result.stdout.trim()) console.log(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  if (result.status !== 0) fail++;
});
console.log(fail ? "\n红线检查: " + fail + " 项失败" : "\n红线检查: " + checks.length + "/" + checks.length + " 全部通过");
process.exit(fail ? 1 : 0);
