<#
.SYNOPSIS
  Stop what run.ps1 started: the web dev server and Metro.

.DESCRIPTION
  Needed before a bare `pnpm build` or `fitness`: those write `.next`, which
  `next dev` owns, and building over a live dev server corrupts its chunks.
  `pnpm verify` builds into `.next-verify` and does not need this.

  The emulator is left running — it is slow to boot and harmless to keep.
  Use -Emulator to close it too.

  Windows PowerShell 5.1.

.EXAMPLE
  pnpm run:stop
.EXAMPLE
  .\scripts\stop.ps1 -Emulator
#>
[CmdletBinding()]
param(
  [switch]$Emulator
)

$ErrorActionPreference = "Stop"

function Stop-Port {
  param([int]$Port, [string]$What)
  $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $listening) {
    Write-Host "   none  $What (port $Port)" -ForegroundColor DarkGray
    return
  }
  foreach ($procId in ($listening.OwningProcess | Sort-Object -Unique)) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "   ok    stopped $What (pid $procId)" -ForegroundColor Green
    }
    catch {
      Write-Warning "Could not stop $What (pid $procId): $($_.Exception.Message)"
    }
  }
}

Write-Host "`n== Stopping" -ForegroundColor Cyan
Stop-Port -Port 3000 -What "floc-web"
Stop-Port -Port 8081 -What "Metro"

if ($Emulator) {
  $adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
  if ($env:ANDROID_HOME) { $adb = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe" }
  if (Test-Path $adb) {
    & $adb emu kill 2>$null | Out-Null
    Write-Host "   ok    emulator closed" -ForegroundColor Green
  }
}

Write-Host "`nSafe to run pnpm verify.`n" -ForegroundColor Green
