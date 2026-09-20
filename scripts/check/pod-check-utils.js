"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const POD_ROOT = path.join(ROOT, "extensions", "upsPod");
const OUTPUT_POD = path.join(POD_ROOT, "output", "upsPod.pod");

function walkFiles(entry) {
  if (!fs.existsSync(entry)) return [];
  const stat = fs.statSync(entry);
  if (stat.isFile()) return [entry];
  return fs.readdirSync(entry, { withFileTypes: true }).flatMap((item) =>
    walkFiles(path.join(entry, item.name))
  );
}

function productionSourceFiles() {
  const scriptsDir = path.join(ROOT, "scripts");
  const operationalScripts = fs.readdirSync(scriptsDir, { withFileTypes: true })
    .filter((item) => item.isFile() && /^(?:deploy|install)-upsPod.*\.ps1$/i.test(item.name))
    .map((item) => path.join(scriptsDir, item.name));
  return [
    path.join(POD_ROOT, "build.fan"),
    path.join(POD_ROOT, "fan"),
    path.join(POD_ROOT, "frontend"),
    path.join(POD_ROOT, "lib"),
    path.join(POD_ROOT, "locale"),
    path.join(ROOT, "scripts", "seed"),
    ...operationalScripts,
  ].flatMap(walkFiles);
}

function normalizeEntry(entry) {
  return path.posix.normalize(String(entry).replace(/\\/g, "/"))
    .replace(/^(?:\.\/|\/)+/, "");
}

function normalizedRelative(baseDir, file) {
  return normalizeEntry(baseDir == null ? file : path.relative(baseDir, file));
}

function samePath(left, right, platform) {
  const currentPlatform = platform || process.platform;
  const pathApi = currentPlatform === "win32" ? path.win32 : path.posix;
  const normalizedLeft = pathApi.normalize(pathApi.resolve(left));
  const normalizedRight = pathApi.normalize(pathApi.resolve(right));
  return currentPlatform === "win32"
    ? normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
    : normalizedLeft === normalizedRight;
}

function uniqueMatchIndex(source, pattern, token, hits, description) {
  pattern.lastIndex = 0;
  const matches = Array.from(source.matchAll(pattern));
  if (matches.length !== 1) {
    hits.push(description + " must occur exactly once");
    return null;
  }
  return matches[0].index + matches[0][0].indexOf(token);
}

function findR3AppHits(source, label) {
  const hits = [];
  const prefix = label + " frontend/app.js: ";
  if (/Math\.random\s*\(/.test(source)) hits.push(prefix + "Math.random");
  if (/performance\.now\s*\(/.test(source)) hits.push(prefix + "unexpected performance.now wall clock");
  if (/(^|[^\w$.])Date\s*\(\s*\)/m.test(source)) hits.push(prefix + "unexpected Date() wall clock");

  const allowedDateNow = new Set([
    uniqueMatchIndex(source,
      /generatedAt:\s*raw\.generatedAt\s*\|\|\s*Date\.now\(\)/g,
      "Date.now()", hits, prefix + "snapshot metadata clock"),
    uniqueMatchIndex(source,
      /return\s*\{\s*source:\s*"fin-folio"[\s\S]{0,180}?generatedAt:\s*Date\.now\(\),\s*sites:[\s\S]{0,180}?units:\s*units\s*\}/g,
      "Date.now()", hits, prefix + "grid snapshot metadata clock"),
    uniqueMatchIndex(source,
      /var\s+pagination\s*=\s*paginate\([^;]+\),\s*now\s*=\s*Date\.now\(\);[\s\S]{0,500}?classifyFreshness\(unit\.ts,\s*now,/g,
      "Date.now()", hits, prefix + "freshness clock"),
  ].filter((index) => index !== null));

  for (const match of source.matchAll(/Date\.now\(\)/g)) {
    if (!allowedDateNow.has(match.index)) hits.push(prefix + "unexpected Date.now at offset " + match.index);
  }

  const allowedDateDisplay = uniqueMatchIndex(source,
    /tsText:\s*unit\.ts\s*===\s*null\s*\?\s*"无数据"\s*:\s*new Date\(unit\.ts\)\.toLocaleTimeString\(\)/g,
    "new Date", hits, prefix + "telemetry timestamp display");
  for (const match of source.matchAll(/new\s+Date\s*\([^)]*\)/g)) {
    if (match.index !== allowedDateDisplay) hits.push(prefix + "unexpected new Date at offset " + match.index);
  }

  if (!/var\s+adapter\s*=\s*FinAdapter\s*;/.test(source)) hits.push(prefix + "Folio-only adapter contract missing");
  if (!/function\s+showFatal\s*\(error\)\s*\{[\s\S]*?加载失败（fail-closed，不兜底）[\s\S]*?\}/.test(source)) {
    hits.push(prefix + "fail-closed fatal contract missing");
  }
  if (!/catch\s*\(error\)\s*\{\s*showFatal\(error\);\s*return;\s*\}/.test(source) || !/\.catch\(showFatal\)/.test(source)) {
    hits.push(prefix + "bootstrap must terminate through showFatal");
  }
  return hits;
}

function findForbiddenPathHits(files, baseDir, rules, label) {
  const exact = new Set((rules.exact || []).map((item) => normalizeEntry(item).toLowerCase()));
  const prefixes = (rules.prefixes || []).map((item) => normalizeEntry(item).toLowerCase());
  return files.flatMap((file) => {
    const entry = normalizedRelative(baseDir, file);
    const comparable = entry.toLowerCase();
    return exact.has(comparable) || prefixes.some((prefix) => comparable.startsWith(prefix))
      ? [label + " " + entry + ": forbidden path"]
      : [];
  });
}

function findForbiddenContentHits(files, baseDir, rules, label) {
  return files.flatMap((file) => {
    const entry = normalizedRelative(baseDir, file);
    const body = fs.readFileSync(file, "utf8");
    return rules.flatMap((rule) => {
      if (rule.paths && !rule.paths.test(entry)) return [];
      rule.pattern.lastIndex = 0;
      return rule.pattern.test(body) ? [label + " " + entry + ": " + rule.name] : [];
    });
  });
}

function requireOutputPod(argv, usage) {
  if (argv.length !== 1) throw new Error("Usage: " + usage + " <extensions/upsPod/output/upsPod.pod>");
  const actual = path.resolve(argv[0]);
  if (!fs.existsSync(OUTPUT_POD) || !fs.statSync(OUTPUT_POD).isFile()) {
    throw new Error("缺少当前 checkout 构建输出；请先在 extensions/upsPod 运行 fan build: " + OUTPUT_POD);
  }
  if (!fs.existsSync(actual) || !fs.statSync(actual).isFile()) {
    throw new Error("缺少构建输出；请先在 extensions/upsPod 运行 fan build: " + actual);
  }
  const actualReal = fs.realpathSync.native(actual);
  const outputReal = fs.realpathSync.native(OUTPUT_POD);
  if (!samePath(actualReal, outputReal, process.platform)) {
    throw new Error("必须显式检查当前 checkout 的构建输出: " + OUTPUT_POD);
  }
  return actualReal;
}

function withExtractedPod(podFile, fn) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "upsPod-check-"));
  try {
    const listing = spawnSync("jar", ["tf", podFile], { encoding: "utf8" });
    if (listing.error) throw listing.error;
    if (listing.status !== 0) {
      throw new Error("无法读取构建 POD entry: " + (listing.stderr || listing.stdout || "jar exited " + listing.status).trim());
    }
    const entries = listing.stdout.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean);
    const result = spawnSync("jar", ["xf", podFile], { cwd: tempDir, encoding: "utf8" });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error("无法解包构建 POD: " + (result.stderr || result.stdout || "jar exited " + result.status).trim());
    }
    return fn(tempDir, walkFiles(tempDir), entries);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

module.exports = {
  ROOT,
  POD_ROOT,
  productionSourceFiles,
  normalizeEntry,
  normalizedRelative,
  samePath,
  findR3AppHits,
  findForbiddenPathHits,
  findForbiddenContentHits,
  requireOutputPod,
  withExtractedPod,
};
