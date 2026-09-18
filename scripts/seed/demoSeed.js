// demoSeed.js — M1 演示数据种子：确定性 + 幂等（方法论 v2.0 第18条）
// 用法：node scripts/seed/demoSeed.js  → 生成 extensions/upsPod/frontend/seed.json
// 同一版本同一参数输出逐字节一致；重复执行覆盖写同一文件（幂等）。
// version 0.1.0
"use strict";
const fs = require("fs");
const path = require("path");

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260918); // 固定种子：确定性
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const ri = (min, max) => min + Math.floor(rnd() * (max - min + 1));

const SITES = [
  { id: "site-a", name: "A站点 · 数据中心" },
  { id: "site-b", name: "B站点 · 制造工厂" },
  { id: "site-c", name: "C站点 · 区域仓库" },
];
const TOPOLOGIES = ["online", "lineInteractive", "modularN1"];
const MAKES = ["Vertiv", "APC", "Eaton", "Huawei", "Kehua"];

const units = [];
for (let i = 0; i < 60; i++) {
  const site = SITES[i % SITES.length];
  const topo = TOPOLOGIES[i % TOPOLOGIES.length];
  const commLost = rnd() < 0.08; // 8% 断讯——覆盖 Q5/F4 场景
  const onBattery = !commLost && rnd() < 0.12;
  const u = {
    id: "UPS-" + site.id.slice(-1).toUpperCase() + String(i + 1).padStart(2, "0"),
    siteId: site.id,
    siteName: site.name,
    name: "UPS " + site.id.slice(-1).toUpperCase() + "-" + String(i + 1).padStart(2, "0"),
    location: pick(["1F 配电室", "2F UPS 间", "B1 电池室", "3F 机房"]) + " 机位" + ri(1, 12),
    make: pick(MAKES),
    model: topo === "modularN1" ? "Modular " + ri(20, 60) + "kVA" : pick(["30kVA", "40kVA", "60kVA", "80kVA"]),
    topology: topo,
    ratedKva: ri(20, 80),
    commLost: commLost,
    mode: commLost ? "unknown" : onBattery ? "battery" : "online",
    loadPct: commLost ? null : ri(15, 85),
    soc: commLost ? null : onBattery ? ri(18, 55) : ri(70, 100),
    // 采集时间：正常=当前；8% 超时(标参考值)；1 台无值(标缺口)
    tsOffsetSec: commLost ? ri(600, 3600) : rnd() < 0.08 ? ri(60, 300) : ri(0, 9),
  };
  if (i === 57) u.tsOffsetSec = null; // 缺口样本
  units.push(u);
}

const out = {
  seedVersion: "0.1.0",
  note: "tsOffsetSec=null 表示缺口；绝对时间由前端加载时计算（确定性：本文件不含墙钟）",
  pollPeriodMs: 10000,
  sites: SITES,
  units: units, // 保留 tsOffsetSec 相对偏移 —— 文件逐字节确定，可重建
};
const dest = path.join(__dirname, "..", "..", "extensions", "upsPod", "frontend", "seed.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log("seed.json written:", units.length, "units ->", dest);
