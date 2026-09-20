param([string]$FinHome = 'C:\Program Files (x86)\FIN\FIN 5.3.0.2761')
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent
$src = Join-Path $repoRoot 'extensions\upsPod\output\upsPod.pod'
$dst = Join-Path $FinHome 'lib\fan\upsPod.pod'
$evidenceDir = Join-Path $repoRoot 'docs\evidence'
$log = Join-Path $evidenceDir 'upsPod-install-latest.log'
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  $child = Start-Process powershell -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ('"' + $PSCommandPath + '"'), '-FinHome', ('"' + $FinHome + '"'))
  if (Test-Path -LiteralPath $log) { Get-Content -LiteralPath $log }
  exit $child.ExitCode
}
try {
  if (-not (Test-Path -LiteralPath $src)) { throw 'Build upsPod before installing.' }
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupDir = Join-Path $evidenceDir "upsPod-backup-$stamp"
  New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  if (Test-Path -LiteralPath $dst) { Copy-Item -LiteralPath $dst -Destination (Join-Path $backupDir 'upsPod.pod') }
  "Start: $(Get-Date -Format o)`nBackup: $backupDir" | Set-Content -LiteralPath $log -Encoding UTF8
  Copy-Item -LiteralPath $src -Destination $dst -Force
  if ((Get-FileHash -LiteralPath $src).Hash -ne (Get-FileHash -LiteralPath $dst).Hash) { throw 'Installed POD hash mismatch' }
  'POD SHA256 verified' | Add-Content -LiteralPath $log
  & (Join-Path $FinHome 'bin\fan.bat') (Join-Path $repoRoot 'extensions\upsPod\test\verifyRegistration.fan') $src 2>&1 | Out-File -LiteralPath $log -Append -Encoding UTF8
  if ($LASTEXITCODE -ne 0) { throw 'Extension registration verification failed' }
  Restart-Service FIN5 -Force
  (Get-Service FIN5).WaitForStatus('Running', [TimeSpan]::FromSeconds(60))
  $ready = $false
  $deadline = (Get-Date).AddSeconds(120)
  while ((Get-Date) -lt $deadline) {
    try {
      $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/' -UseBasicParsing -TimeoutSec 5
      if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { Start-Sleep -Seconds 2 }
  }
  if (-not $ready) { throw 'FIN service started but HTTP readiness timed out' }
  "PASS: FIN5 Running; HTTP 200; $(Get-Date -Format o)" | Add-Content -LiteralPath $log
} catch {
  "FAIL: $($_.Exception.Message)" | Add-Content -LiteralPath $log
  exit 1
}
