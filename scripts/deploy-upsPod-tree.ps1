param(
  [string]$FinHome = "C:\Program Files (x86)\FIN\FIN 5.3.0.2761",
  [string]$ProjectName = "mytest"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$podSrc = Join-Path $repo "extensions\upsPod\output\upsPod.pod"
$podDst = Join-Path $FinHome "lib\fan\upsPod.pod"
$fan = Join-Path $FinHome "bin\fan.bat"
$seed = Join-Path $repo "scripts\seed\upsPodTreeSeed.fan"
$projDb = Join-Path $FinHome "var\proj\$ProjectName\db"
$evidence = Join-Path $repo "docs\evidence\upsPod-tree-deploy-latest.log"

function Log($msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Add-Content -LiteralPath $evidence -Value $line -Encoding UTF8
}

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  $args = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -FinHome `"$FinHome`" -ProjectName `"$ProjectName`""
  $proc = Start-Process powershell -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ArgumentList $args
  exit $proc.ExitCode
}

Set-Content -LiteralPath $evidence -Value "" -Encoding UTF8

try {
  Log "deploy upsPod tree start project=$ProjectName"

  if (-not (Test-Path -LiteralPath $podSrc)) { throw "Missing built pod: $podSrc" }
  if (-not (Test-Path -LiteralPath $projDb)) { throw "Missing project db: $projDb" }

  $svc = Get-Service -Name FIN5
  if ($svc.Status -ne "Stopped") {
    Log "stopping FIN5"
    Stop-Service -Name FIN5 -Force
    (Get-Service -Name FIN5).WaitForStatus("Stopped", "00:02:00")
  }

  Log "copy pod"
  Copy-Item -LiteralPath $podSrc -Destination $podDst -Force

  Log "seed project tree"
  $seedOut = & $fan $seed $projDb 2>&1
  $seedOut | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) { throw "Seed failed with exit code $LASTEXITCODE" }

  Log "starting FIN5"
  Start-Service -Name FIN5
  (Get-Service -Name FIN5).WaitForStatus("Running", "00:02:00")

  Log "waiting http and project api"
  $deadline = (Get-Date).AddSeconds(120)
  $rootReady = $false
  $lastProbe = "HTTP server not ready"
  do {
    try {
      $r = Invoke-WebRequest -Uri "http://localhost:8080/" -UseBasicParsing -TimeoutSec 5
      if ($r.StatusCode -eq 200) {
        if (-not $rootReady) { Log "http root 200" }
        $rootReady = $true
      }

      if ($rootReady) {
        $handler = New-Object System.Net.Http.HttpClientHandler
        $handler.AllowAutoRedirect = $false
        $client = New-Object System.Net.Http.HttpClient($handler)
        try {
          $projectUri = "http://localhost:8080/api/$ProjectName/eval?expr=1%2B1"
          $projectRes = $client.GetAsync($projectUri).Result
          $projectStatus = [int]$projectRes.StatusCode
          $lastProbe = "project API HTTP $projectStatus"
          if (($projectStatus -ge 200 -and $projectStatus -lt 400) -or $projectStatus -in @(401, 403)) {
            Log "project api ready status=$projectStatus"
            break
          }
        } finally {
          $client.Dispose()
          $handler.Dispose()
        }
      }
    } catch {
      $lastProbe = $_.Exception.Message
    }
    if ((Get-Date) -gt $deadline) { throw "Project API did not become ready: $lastProbe" }
    Start-Sleep -Seconds 2
  } while ($true)

  Log "deploy upsPod tree complete"
} catch {
  Log ("FAILED " + $_.Exception.Message)
  throw
}
