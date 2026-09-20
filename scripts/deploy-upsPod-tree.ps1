param(
  [string]$FinHome = "C:\Program Files (x86)\FIN\FIN 5.3.0.2761",
  [string]$ProjectName = "mytest"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$podSrc = Join-Path $repo "extensions\upsPod\output\upsPod.pod"
$podDst = Join-Path $FinHome "lib\fan\upsPod.pod"
$backupPath = "$podDst.deploy-backup"
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

$deploymentError = $null
$rollbackError = $null
$deploymentComplete = $false
$replacementStarted = $false
$backupCreated = $false
$serviceStateCaptured = $false
$originalServiceStatus = $null

try {
  Log "deploy upsPod tree start project=$ProjectName"

  if (-not (Test-Path -LiteralPath $podSrc)) { throw "Missing built pod: $podSrc" }
  $sourceHash = (Get-FileHash -LiteralPath $podSrc -Algorithm SHA256).Hash

  $svc = Get-Service -Name FIN5
  $originalServiceStatus = $svc.Status
  $serviceStateCaptured = $true

  if (Test-Path -LiteralPath $podDst) {
    Log "backup installed pod"
    Copy-Item -LiteralPath $podDst -Destination $backupPath -Force
    $backupCreated = $true
  }

  if ($svc.Status -ne "Stopped") {
    Log "stopping FIN5"
    Stop-Service -Name FIN5 -Force
    (Get-Service -Name FIN5).WaitForStatus("Stopped", "00:02:00")
  }

  $replacementStarted = $true
  Log "copy pod"
  Copy-Item -LiteralPath $podSrc -Destination $podDst -Force
  $destinationHash = (Get-FileHash -LiteralPath $podDst -Algorithm SHA256).Hash
  if ($sourceHash -ne $destinationHash) {
    throw "POD SHA-256 mismatch: source=$sourceHash destination=$destinationHash"
  }
  Log "pod sha256 verified $sourceHash"

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
  $deploymentComplete = $true
} catch {
  $deploymentError = $_
  Log ("FAILED " + $_.Exception.Message)
} finally {
  if ($deploymentError) {
    try {
      if ($replacementStarted) {
        $rollbackService = Get-Service -Name FIN5
        if ($rollbackService.Status -ne "Stopped") {
          Log "stopping FIN5 for pod restore"
          Stop-Service -Name FIN5 -Force
          (Get-Service -Name FIN5).WaitForStatus("Stopped", "00:02:00")
        }

        if ($backupCreated) {
          Log "restoring previous pod"
          Copy-Item -LiteralPath $backupPath -Destination $podDst -Force
        } elseif (Test-Path -LiteralPath $podDst) {
          Log "removing newly installed pod"
          Remove-Item -LiteralPath $podDst -Force
        }
      }

      if ($serviceStateCaptured -and $originalServiceStatus -eq "Running") {
        $restoreService = Get-Service -Name FIN5
        if ($restoreService.Status -ne "Running") {
          Log "restoring FIN5 running state"
          Start-Service -Name FIN5
          (Get-Service -Name FIN5).WaitForStatus("Running", "00:02:00")
        }
      }
      Log "rollback complete"
    } catch {
      $rollbackError = $_
      Log ("ROLLBACK FAILED " + $_.Exception.Message)
    }
  } elseif ($deploymentComplete -and $backupCreated) {
    Remove-Item -LiteralPath $backupPath -Force
  }
}

if ($rollbackError) {
  throw "Deployment failed: $($deploymentError.Exception.Message); rollback failed: $($rollbackError.Exception.Message)"
}
if ($deploymentError) { throw $deploymentError }
