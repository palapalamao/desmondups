# install-upsPod.ps1 — 自提权安装脚本：upsPod.pod → FIN lib\fan → 重启 FIN5 服务
# 由 Codex 生成 2026-09-19；来源产物：extensions/upsPod/output/upsPod.pod（fan build 已验证）
$ErrorActionPreference = "Stop"
# 自提权
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File","`"$PSCommandPath`""
  exit
}
$src = "D:\mygithub\desmondUPS\extensions\upsPod\output\upsPod.pod"
$dst = "C:\Program Files (x86)\FIN\FIN 5.3.0.2761\lib\fan\upsPod.pod"
Copy-Item $src $dst -Force
$len = (Get-Item $dst).Length
"已写入 $dst （$len 字节）" | Out-File "D:\mygithub\desmondUPS\scripts\_install_result.log" -Encoding utf8
Restart-Service FIN5 -Force
"FIN5 服务已重启" | Out-File "D:\mygithub\desmondUPS\scripts\_install_result.log" -Encoding utf8 -Append
