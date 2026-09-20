param(
  [string]$FinHome = 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761',
  [string]$ProjectName = 'mytest'
)

$ErrorActionPreference = 'Stop'
$deployer = Join-Path $PSScriptRoot 'deploy-upsPod-tree.ps1'
try {
  & $deployer -FinHome $FinHome -ProjectName $ProjectName
  exit 0
} catch {
  Write-Error $_
  exit 1
}
