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
  if (actual.toLowerCase() !== OUTPUT_POD.toLowerCase()) {
    throw new Error("必须显式检查当前 checkout 的构建输出: " + OUTPUT_POD);
  }
  if (!fs.existsSync(actual) || !fs.statSync(actual).isFile()) {
    throw new Error("缺少构建输出；请先在 extensions/upsPod 运行 fan build: " + actual);
  }
  return actual;
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
  findForbiddenPathHits,
  findForbiddenContentHits,
  requireOutputPod,
  withExtractedPod,
};
