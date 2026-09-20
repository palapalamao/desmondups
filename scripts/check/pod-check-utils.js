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
  return [
    path.join(POD_ROOT, "build.fan"),
    path.join(POD_ROOT, "fan"),
    path.join(POD_ROOT, "frontend"),
    path.join(POD_ROOT, "lib"),
    path.join(POD_ROOT, "locale"),
    path.join(ROOT, "scripts", "seed"),
    path.join(ROOT, "scripts", "deploy-upsPod-tree.ps1"),
    path.join(ROOT, "scripts", "deploy-upsPod.ps1"),
    path.join(ROOT, "scripts", "install-upsPod.ps1"),
  ].flatMap(walkFiles);
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
    const result = spawnSync("jar", ["xf", podFile], { cwd: tempDir, encoding: "utf8" });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error("无法解包构建 POD: " + (result.stderr || result.stdout || "jar exited " + result.status).trim());
    }
    return fn(tempDir, walkFiles(tempDir));
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function relative(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

module.exports = { POD_ROOT, productionSourceFiles, requireOutputPod, withExtractedPod, relative };
