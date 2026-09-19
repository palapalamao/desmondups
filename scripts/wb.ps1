param([string]$json)
$tmp = "D:\mygithub\desmondUPS\scripts\_wb_cmd.json"
[System.IO.File]::WriteAllText($tmp, $json, (New-Object System.Text.UTF8Encoding($false)))
curl.exe -s -X POST http://127.0.0.1:10086/command -H "Content-Type: application/json" --data-binary "@$tmp"
