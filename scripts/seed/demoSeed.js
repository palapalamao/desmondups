// demoSeed.js — M1 演示数据种子：确定性 + 幂等（方法论 v2.0 第18条）
// 用法：node scripts/seed/demoSeed.js  → 生成 extensions/upsPod/frontend/seed.json
// 同一版本同一参数输出逐字节一致；重复执行覆盖写同一文件（幂等）。
// version 0.4.0
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

// ---- M2 详情生成（确定性：仅用种子 PRND，无墙钟无随机源——R3/r3 检查扫描字样，勿写随机API名） ----
// 断讯/缺口单元 detail=null（D-M2-02：前端档案照常、遥测整区不渲染）
const STATUSES = ["normal", "normal", "normal", "warning", "critical"];
const PREDICTION_POOL = [
  { risk: "warning", label: "电池内阻呈上升趋势", value: "组 2" },
  { risk: "critical", label: "电容组寿命临近", value: "功率模块 3" },
  { risk: "warning", label: "风扇转速偏差", value: "风扇 2" },
];
const genDetail = (u) => {
  const dead = u.commLost || u.tsOffsetSec === null;
  if (dead) return null;
  const battery = {
    stringVoltage: ri(372, 410),
    impedance: ri(4, 14),
    impedanceBaseline: ri(4, 8),
    temperature: ri(20, 35),
    chargeCurrent: u.mode === "battery" ? 0 : ri(1, 10),
    predictedReplacement: pick(["2027 Q1", "2027 Q3", "2028 Q1", "2028 Q4"]),
    reference: true, source: "内阻趋势外推",
  };
  const electronics = {
    inverterVoltage: pick([220, 230, 240]),
    inverterFrequency: pick([50, 50, 50, 60]),
    inverterThd: ri(1, 5),
    rectifierStatus: pick(STATUSES),
    fanStatus: pick(STATUSES),
    capacitorHealthPct: ri(55, 100),
  };
  const alarms = [];
  if (u.mode === "battery")
    alarms.push({ severity: "warning", message: "市电中断，电池供电中", time: "10 分钟前", ack: false });
  if (battery.impedance > battery.impedanceBaseline * 1.15)
    alarms.push({ severity: "warning", message: "电池内阻超基线 15%", time: "1 小时前", ack: rnd() < 0.5 });
  if (electronics.capacitorHealthPct < 70)
    alarms.push({ severity: "critical", message: "电容组健康度低于 70%", time: "昨天", ack: false });
  return {
    battery: battery,
    load: { kw: Math.round(u.loadPct * u.ratedKva * 0.8) / 10, capacityKw: u.ratedKva * 0.8, requiredMinutes: ri(5, 30) },
    electronics: electronics,
    environment: {
      ambientTempC: ri(18, 30),
      humidityPct: ri(30, 65),
      airQuality: pick(["normal", "normal", "warning"]),
      waterDetected: rnd() < 0.05,
    },
    transfer: {
      switchStatus: pick(["normal", "normal", "warning"]),
      bypassAvailable: rnd() < 0.95,
      lastTransferMs: ri(0, 20),
      lastTransferAt: pick(["本周", "2 周前", "1 个月前", "3 个月前", "无记录"]),
    },
    predictions: rnd() < 0.4 ? [Object.assign({}, pick(PREDICTION_POOL), { reference: true, source: "设备自诊断上报" })] : [],
    runtimeEstimate: { minutes: Math.max(5, Math.round(u.soc / Math.max(1, u.loadPct) * 60)), reference: true, source: "SOC×负载模型" },
    alarms: alarms,
  };
};

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
    serial: "SN" + site.id.slice(-1).toUpperCase() + String(i + 1).padStart(4, "0"), // M2 REQ-M2-01 档案：序列号
    commLost: commLost,
    mode: commLost ? "unknown" : onBattery ? "battery" : "online",
    loadPct: commLost ? null : ri(15, 85),
    soc: commLost ? null : onBattery ? ri(18, 55) : ri(70, 100),
    // 采集时间：正常=当前；8% 超时(标参考值)；1 台无值(标缺口)
    tsOffsetSec: commLost ? ri(600, 3600) : rnd() < 0.08 ? ri(60, 300) : ri(0, 9),
  };
  if (i === 57) u.tsOffsetSec = null; // 缺口样本
  u.detail = genDetail(u); // M2：详情（断讯/缺口为 null，D-M2-02）
  units.push(u);
}

const out = {
  seedVersion: "0.6.0",
  note: "tsOffsetSec=null 表示缺口；绝对时间由前端加载时计算（确定性：本文件不含墙钟）",
  pollPeriodMs: 10000,
  sites: SITES,
  units: units, // 保留 tsOffsetSec 相对偏移 —— 文件逐字节确定，可重建
};
const dest = path.join(__dirname, "..", "..", "extensions", "upsPod", "frontend", "seed.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log("seed.json written:", units.length, "units ->", dest);
