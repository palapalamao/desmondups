// verify.cjs — M1 逻辑验证（Node VM 风格，参照 docs/demo 的验证边界声明）
// 覆盖：TC-M1-逻辑-*（筛选/排序/分页/统计/时效分级/新风险检测）
// 声明：本脚本验证 upsCore 纯逻辑，不是浏览器 DOM/视觉/FIN 集成测试（真机目检另行记录）。
"use strict";
const assert = require("assert");
const core = require("../frontend/app.js"); // Node 分支导出 upsCore

let pass = 0;
function tc(id, name, fn) {
  try { fn(); pass++; console.log("PASS", id, name); }
  catch (e) { console.error("FAIL", id, name, "-", e.message); process.exitCode = 1; }
}

const now = Date.now(), P = 10000;
const mk = (o) => Object.assign(
  { id: "U", name: "U", siteId: "s1", commLost: false, mode: "online", loadPct: 50, soc: 90, ts: now }, o);

// TC-M1-逻辑-01 严重度分级
tc("TC-M1-逻辑-01", "严重度：电池+SOC<30=critical", () => {
  assert.strictEqual(core.topSeverity(mk({ mode: "battery", soc: 20 })), "critical");
  assert.strictEqual(core.topSeverity(mk({ mode: "battery", soc: 60 })), "warning");
  assert.strictEqual(core.topSeverity(mk({ mode: "online" })), "normal");
  assert.strictEqual(core.topSeverity(mk({ commLost: true })), "commLost"); // Q5/F4
});
// TC-M1-逻辑-02 时效分级（R3）
tc("TC-M1-逻辑-02", "时效：ok/stale/gap 三态", () => {
  assert.strictEqual(core.classifyFreshness(now - 5000, now, P), "ok");
  assert.strictEqual(core.classifyFreshness(now - 30000, now, P), "stale"); // >2×周期=参考值
  assert.strictEqual(core.classifyFreshness(null, now, P), "gap");          // 缺口
});
// TC-M1-逻辑-03 筛选
tc("TC-M1-逻辑-03", "四维筛选组合", () => {
  const units = [mk({ id: "a", siteId: "s1" }), mk({ id: "b", siteId: "s2" }),
                 mk({ id: "c", siteId: "s1", commLost: true }), mk({ id: "d", siteId: "s1", mode: "battery" })];
  assert.deepStrictEqual(core.filterUnits(units, { site: "s1" }).map(u => u.id), ["a", "c", "d"]);
  assert.deepStrictEqual(core.filterUnits(units, { comm: "lost" }).map(u => u.id), ["c"]);
  assert.deepStrictEqual(core.filterUnits(units, { site: "s1", mode: "battery" }).map(u => u.id), ["d"]);
  assert.deepStrictEqual(core.filterUnits(units, { sev: "commLost" }).map(u => u.id), ["c"]);
});
// TC-M1-逻辑-04 排序（Q4：严重度>通讯>名称）
tc("TC-M1-逻辑-04", "排序：严重度优先", () => {
  const units = [mk({ id: "n1", name: "B" }), mk({ id: "c1", name: "Z", mode: "battery", soc: 20 }),
                 mk({ id: "n2", name: "A" }), mk({ id: "w1", name: "M", mode: "battery", soc: 80 })];
  assert.deepStrictEqual(core.sortUnits(units).map(u => u.id), ["c1", "w1", "n2", "n1"]);
});
// TC-M1-逻辑-05 统计徽标
tc("TC-M1-逻辑-05", "统计：四类计数", () => {
  const units = [mk({ mode: "battery", soc: 20 }), mk({ mode: "battery", soc: 80 }),
                 mk({}), mk({ commLost: true, mode: "unknown", loadPct: null, soc: null })];
  assert.deepStrictEqual(core.statCounts(units), { critical: 1, warning: 1, normal: 1, commLost: 1 });
});
// TC-M1-逻辑-06 分页
tc("TC-M1-逻辑-06", "分页：50/100 与越界收敛", () => {
  const units = Array.from({ length: 120 }, (_, i) => mk({ id: "u" + i }));
  let pg = core.paginate(units, 1, 50);
  assert.strictEqual(pg.items.length, 50); assert.strictEqual(pg.pages, 3);
  pg = core.paginate(units, 3, 50);
  assert.strictEqual(pg.items.length, 20);
  pg = core.paginate(units, 99, 50); // 页码越界 → 收敛到末页
  assert.strictEqual(pg.page, 3);
  pg = core.paginate(units, 1, 100);
  assert.strictEqual(pg.pages, 2);
});
// TC-M1-逻辑-07 新风险检测（Q6：只提示不重排）
tc("TC-M1-逻辑-07", "新风险：恶化检测+排除首次/超时效", () => {
  const prev = { a: "normal", b: "warning", c: "normal" };
  const units = [mk({ id: "a", mode: "battery", soc: 20, ts: now }),          // normal→critical ✔
                 mk({ id: "b", mode: "battery", soc: 20, ts: now }),          // warning→critical ✔
                 mk({ id: "c", mode: "battery", soc: 20, ts: now - 999999 }), // 超时效 → 不计
                 mk({ id: "d", mode: "battery", soc: 20, ts: now })];         // 无 prev → 不计
  const risks = core.detectNewRisks(prev, units, now, P);
  assert.deepStrictEqual(risks.map(r => r.id).sort(), ["a", "b"]);
});
// TC-M1-逻辑-08 种子确定性（幂等：两次生成逐字节一致）
tc("TC-M1-逻辑-08", "种子：确定性可重建", () => {
  const fs = require("fs"), path = require("path"), os = require("os");
  const seedPath = path.join(__dirname, "..", "frontend", "seed.json");
  const a = fs.readFileSync(seedPath, "utf8");
  const tmp = path.join(os.tmpdir(), "seed-check.json");
  const orig = process.argv; // demoSeed 写死路径，改为临时比对生成逻辑：直接重跑脚本
  require("child_process").execSync(`node "${path.join(__dirname, "..", "..", "..", "scripts", "seed", "demoSeed.js")}"`);
  const b = fs.readFileSync(seedPath, "utf8");
  assert.strictEqual(a, b); // 种子不含墙钟 → 两次生成须逐字节一致
});

console.log(`\n${pass}/8 通过${process.exitCode ? "（存在失败）" : ""}`);



