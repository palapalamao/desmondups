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

// TC-M1-逻辑-09 sparklinePoints（REQ-M1-10：定程映射/空态/坐标数）
tc("TC-M1-逻辑-09", "趋势坐标：空→空串，定程 0→y=h 100→y=0", () => {
  assert.strictEqual(core.sparklinePoints([], 240, 60, 0, 100), "");
  assert.strictEqual(core.sparklinePoints(null, 240, 60, 0, 100), "");
  assert.strictEqual(core.sparklinePoints([0, 50, 100], 240, 60, 0, 100), "0,60 120,30 240,0");
  const pts = core.sparklinePoints(new Array(24).fill(50), 240, 60, 0, 100).split(" ");
  assert.strictEqual(pts.length, 24);            // 24 点 → 24 坐标对
  assert.strictEqual(pts[0], "0,30");            // 首点 x=0
  assert.strictEqual(pts[23], "240,30");         // 末点 x=w，step=w/23
  assert.strictEqual(core.sparklinePoints([80], 240, 60, 0, 100), "0,12"); // 单点不成线，step=0
});
// TC-M1-逻辑-10 rollHistory（REQ-M1-10：滚动窗口追加+超窗移位）
tc("TC-M1-逻辑-10", "滚动窗口：24 点超窗 shift，返回同一引用", () => {
  const arr = [];
  for (let i = 1; i <= 24; i++) core.rollHistory(arr, i, 24);
  assert.deepStrictEqual(arr, Array.from({ length: 24 }, (_, i) => i + 1)); // 恰好 24 不 shift
  const ref = core.rollHistory(arr, 25, 24);
  assert.strictEqual(ref, arr);                  // 返回同一引用（原型先例）
  assert.strictEqual(arr.length, 24);            // 超窗仍 24
  assert.strictEqual(arr[0], 2);                 // 最旧点(1)已出窗
  assert.strictEqual(arr[23], 25);               // 最新点在尾
});
// TC-M1-逻辑-11 hasTrend（Q11：断讯不渲染趋势，R3）
tc("TC-M1-逻辑-11", "趋势判定：断讯/点数不足→false，正常→true", () => {
  const h24 = new Array(24).fill(50);
  assert.strictEqual(core.hasTrend(mk({ socHistory: h24, loadHistory: h24 })), true);
  assert.strictEqual(core.hasTrend(mk({ commLost: true, socHistory: h24, loadHistory: h24 })), false); // Q11 断讯优先
  assert.strictEqual(core.hasTrend(mk({ socHistory: [], loadHistory: [] })), false);   // 缺口/空数组
  assert.strictEqual(core.hasTrend(mk({ socHistory: [50], loadHistory: [50] })), false); // 1 点不成线
  assert.strictEqual(core.hasTrend(mk({ socHistory: [50, 51], loadHistory: [50, 51] })), true); // 2 点成线
});


// ===== M2 设备详情逻辑（详设 §4/§6：buildDetail / pageFreshness / 参考值标记 / 告警只读契约） =====
// TC-M2-逻辑-01 buildDetail（未找到 → null；断讯 → 档案在、detail=null，D-M2-02）
tc("TC-M2-逻辑-01", "详情：取到/未知id→null/断讯→detail=null 档案保留", () => {
  const det = { battery: {}, ts: { battery: now, load: now, electronics: now, environment: now, transfer: now } };
  const units = [mk({ id: "a", detail: det }),
                 mk({ id: "b", commLost: true, mode: "unknown", loadPct: null, soc: null, detail: null })];
  const ok = core.buildDetail(units, "a");
  assert.strictEqual(ok.unit.id, "a");
  assert.strictEqual(ok.detail, det);
  assert.strictEqual(core.buildDetail(units, "NOPE"), null); // fail-closed 不兜底
  const lost = core.buildDetail(units, "b");
  assert.strictEqual(lost.unit.id, "b");
  assert.strictEqual(lost.detail, null); // D-M2-02：遥测整区不渲染，档案照常
});
// TC-M2-逻辑-02 pageFreshness（D-M2-05：各组最差 gap > stale > ok）
tc("TC-M2-逻辑-02", "页面时效：最差聚合；detail=null→gap", () => {
  assert.strictEqual(core.pageFreshness(null, now, P), "gap");
  const tsOk = { battery: now, load: now, electronics: now, environment: now, transfer: now };
  assert.strictEqual(core.pageFreshness({ ts: tsOk }, now, P), "ok");
  assert.strictEqual(core.pageFreshness({ ts: Object.assign({}, tsOk, { load: now - 30000 }) }, now, P), "stale");
  assert.strictEqual(core.pageFreshness({ ts: Object.assign({}, tsOk, { transfer: null }) }, now, P), "gap");
});
// TC-M2-逻辑-03 参考值标记完整性（D-M2-04，读种子全量断言）
tc("TC-M2-逻辑-03", "参考值：预测类字段 reference=true 且 source 非空", () => {
  const seed = require("../frontend/seed.json");
  const details = seed.units.map(u => u.detail).filter(Boolean);
  assert.ok(details.length > 0, "种子应含非空 detail");
  details.forEach(d => {
    assert.strictEqual(d.battery.reference, true);
    assert.ok(d.battery.source && d.battery.source.length > 0, "battery.source 非空");
    assert.strictEqual(d.runtimeEstimate.reference, true);
    assert.ok(d.runtimeEstimate.source && d.runtimeEstimate.source.length > 0, "runtimeEstimate.source 非空");
    d.predictions.forEach(p => {
      assert.strictEqual(p.reference, true);
      assert.ok(p.source && p.source.length > 0, "prediction.source 非空");
    });
  });
});
// TC-M2-逻辑-04 告警契约只读（详设 §6：每项恰 severity/message/time/ack 四字段）
tc("TC-M2-逻辑-04", "告警：契约恰四字段，无写操作字段", () => {
  const seed = require("../frontend/seed.json");
  let n = 0;
  seed.units.forEach(u => {
    if (!u.detail) return;
    u.detail.alarms.forEach(a => {
      n++;
      assert.deepStrictEqual(Object.keys(a).sort(), ["ack", "message", "severity", "time"]);
      assert.strictEqual(typeof a.ack, "boolean");
    });
  });
  assert.ok(n > 0, "种子应含至少一条告警以约束契约");
});

console.log(`\n${pass}/15 通过${process.exitCode ? "（存在失败）" : ""}`);
