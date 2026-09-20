"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const deploy = fs.readFileSync(path.join(__dirname, "..", "deploy-upsPod-tree.ps1"), "utf8");

assert.doesNotMatch(deploy, /projDb|upsPodTreeSeed|seed project tree|\bseed\b/i,
  "部署脚本不得打开或修改项目数据库，也不得运行 seed");
assert.match(deploy, /Get-FileHash[\s\S]*\$podSrc[\s\S]*SHA256/i,
  "部署脚本必须计算构建源 POD 的 SHA-256");
assert.match(deploy, /Get-FileHash[\s\S]*\$podDst[\s\S]*SHA256/i,
  "部署脚本必须计算安装目标 POD 的 SHA-256");
assert.match(deploy, /\$sourceHash\s+-ne\s+\$(destinationHash|destHash)/i,
  "部署脚本必须比较源和目标 POD 的 SHA-256");

assert.ok(
  deploy.includes('/api/$ProjectName/eval'),
  "部署脚本必须检查目标项目 API，而不只是检查 FIN 首页"
);
assert.ok(
  deploy.includes("AllowAutoRedirect"),
  "目标项目健康检查必须关闭重定向，以区分项目 API 与登录页"
);
assert.ok(
  deploy.includes("project api ready"),
  "部署日志必须明确记录目标项目已经可用"
);
assert.ok(
  deploy.includes("$projectStatus -ge 200") && deploy.includes("$projectStatus -lt 400"),
  "项目 API 健康检查必须接受登录重定向状态"
);
assert.ok(
  deploy.includes("-PassThru") && deploy.includes("$proc.ExitCode"),
  "提权部署进程必须把真实退出码传回调用方"
);
assert.ok(
  deploy.includes("Add-Type -AssemblyName System.Net.Http"),
  "Windows PowerShell 提权进程必须显式加载 System.Net.Http"
);

console.log("PASS TC-FIN-DEPLOY-01 目标项目 API 健康检查");
