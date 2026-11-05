$ErrorActionPreference='Stop'
$source='D:\mygithub\desmodUPS2.0\build\lib\fan\upsNew.pod'
$target='C:\Program Files (x86)\FIN\FIN 5.3.0.2761\lib\fan\upsNew.pod'
$expected='242E5D8DD19FDD3702857D2971FA0083B404DC218B4BB6FFB1D516BB27331B2B'
$oldHash='40776F650D5C8B4E322DCE9C56F898FAD709FBE46033827BCA677814E48112E7'
$backupDir='D:\mygithub\desmodUPS2.0\deployment-backups\upsNew-0.2.3-20261105'
$backup=Join-Path $backupDir 'upsNew.pod'
$resultFile='D:\mygithub\desmodUPS2.0\scripts\deploy-upsNew-0.2.3-20261105-result.json'
if(Test-Path -LiteralPath $resultFile){throw 'Refusing to reuse an existing result.'}
$r=[ordered]@{status='running';phase='preflight';version='0.2.3';source=$source;target=$target;expectedHash=$expected;backup=$backup;originalService=$null;replacementAttempted=$false;replaced=$false;serviceStarted=$false;httpReady=$false;error=$null;rollback=$null;startedAt=(Get-Date).ToString('o')}
function Save-Result{$r | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $resultFile -Encoding UTF8}
function PortOwners{@(Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)}
function Wait-Free{
 $deadline=(Get-Date).AddSeconds(40)
 while((PortOwners).Count -gt 0 -and (Get-Date) -lt $deadline){Start-Sleep -Seconds 1}
 if((PortOwners).Count -gt 0){throw 'Port 8080 still occupied; replacement prohibited.'}
}
try{
 Save-Result
 if([IO.Path]::GetFullPath($source) -eq [IO.Path]::GetFullPath($target)){throw 'Source and target are the same.'}
 if((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne $expected){throw 'Source hash changed.'}
 if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $oldHash){throw 'Installed hash changed.'}
 if(Test-Path -LiteralPath $backupDir){throw 'Backup directory already exists.'}
 if((Get-CimInstance Win32_Service -Filter "Name='FIN5'").PathName -notlike '*C:\Program Files (x86)\FIN\FIN 5.3.0.2761\bin\finsrv.exe*'){throw 'Unexpected service path.'}
 Add-Type -AssemblyName System.IO.Compression.FileSystem
 $z=[IO.Compression.ZipFile]::OpenRead($source)
 try{$reader=[IO.StreamReader]::new($z.GetEntry('meta.props').Open());try{$meta=$reader.ReadToEnd()}finally{$reader.Dispose()}}finally{$z.Dispose()}
 if($meta -notmatch '(?m)^pod.version=0\.2\.3\s*$' -or $meta -notmatch '(?m)^pod.name=upsNew\s*$'){throw 'Unexpected POD identity.'}
 $r.originalService=(Get-Service FIN5).Status.ToString();$r.phase='stopping';Save-Result
 if((Get-Service FIN5).Status -ne 'Stopped'){Stop-Service FIN5;(Get-Service FIN5).WaitForStatus('Stopped',[TimeSpan]::FromSeconds(40))}
 Wait-Free
 $r.phase='backing-up';Save-Result
 New-Item -ItemType Directory -Path $backupDir | Out-Null
 Copy-Item -LiteralPath $target -Destination $backup
 if((Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash -ne $oldHash){throw 'Backup hash mismatch.'}
 $r.phase='replacing';$r.replacementAttempted=$true;Save-Result
 Copy-Item -LiteralPath $source -Destination $target -Force
 if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $expected){throw 'Installed hash mismatch.'}
 $r.replaced=$true;$r.phase='starting';Save-Result
 Start-Service FIN5;(Get-Service FIN5).WaitForStatus('Running',[TimeSpan]::FromSeconds(40))
 $r.serviceStarted=$true;$r.phase='checking-http';Save-Result
 for($i=0;$i -lt 18;$i++){
  try{$web=Invoke-WebRequest -Uri 'http://127.0.0.1:8080/pod/upsNew/ui/index-0.2.3.html' -UseBasicParsing -TimeoutSec 3;if($web.StatusCode -eq 200){$r.httpReady=$true;break}}catch{$r.lastHttpError=$_.Exception.Message}
  Start-Sleep -Seconds 2
 }
 if(-not $r.httpReady){throw 'Versioned UPS page did not become ready.'}
 $r.actualHash=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash;$r.status='installed';$r.phase='complete'
}catch{
 $r.status='failed';$r.error=$_.Exception.Message;$r.failedPhase=$r.phase;$r.stack=$_.ScriptStackTrace
 try{
  $r.actualService=(Get-Service FIN5).Status.ToString();$r.portOwners=@(PortOwners);$r.actualHash=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
  if($r.replacementAttempted){
   $r.phase='rollback';Save-Result
   if((Get-Service FIN5).Status -ne 'Stopped'){Stop-Service FIN5;(Get-Service FIN5).WaitForStatus('Stopped',[TimeSpan]::FromSeconds(40))}
   Wait-Free
   if((Get-FileHash -LiteralPath $backup -Algorithm SHA256).Hash -ne $oldHash){throw 'Invalid rollback backup.'}
   Copy-Item -LiteralPath $backup -Destination $target -Force
   if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -ne $oldHash){throw 'Rollback hash mismatch.'}
   $r.rollback='old-pod-restored'
  }
  if((PortOwners).Count -eq 0 -and (Get-Service FIN5).Status -eq 'Stopped' -and ($r.originalService -eq 'Running' -or $r.replacementAttempted)){
   Start-Service FIN5;(Get-Service FIN5).WaitForStatus('Running',[TimeSpan]::FromSeconds(40));$r.recoveryService='Running'
  }
 }catch{$r.recoveryError=$_.Exception.Message}
}finally{$r.completedAt=(Get-Date).ToString('o');Save-Result}
if($r.status -ne 'installed'){exit 1}
