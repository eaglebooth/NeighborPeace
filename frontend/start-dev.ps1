$projectPath = "D:\Genlayer\NeighborPeace\frontend"
$logPath = Join-Path $projectPath "dev-server.log"

"Starting NeighborPeace dev server at $(Get-Date -Format o)" | Set-Content -LiteralPath $logPath
Set-Location -LiteralPath $projectPath
& "C:\Program Files\nodejs\npm.cmd" run dev -- -p 3050 *>&1 | Tee-Object -FilePath $logPath -Append
