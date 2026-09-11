<#
.SYNOPSIS
  One command to get the whole development loop up: emulator, web server, Metro, app.

.DESCRIPTION
  Every step is idempotent — anything already running is left alone and reported
  as such. That is the point: this is safe to run again mid-session when one
  piece has died, without tearing down the pieces that are healthy.

  The emulator reaches the web server through `adb reverse`, not the LAN
  address. A phone's `localhost` is the phone, so the reverse tunnel is what
  makes `EXPO_PUBLIC_API_URL=http://localhost:3000` in
  floc/apps/mobile/.env.local correct. The LAN route needs an inbound firewall
  rule, which needs an administrator; this needs neither.

  Windows PowerShell 5.1 — no `&&`, no ternary, no null-coalescing.

.PARAMETER Avd
  Android Virtual Device to boot. Default Pixel_9.

.PARAMETER SkipEmulator
  Leave the emulator and the app alone. Web + Metro only.

.PARAMETER SkipWeb
  Do not start the Next.js dev server.

.PARAMETER SkipMetro
  Do not start Metro. Use when Claude is already running it in its own window
  from .claude/launch.json — a second bundler on 8081 would just collide.

.PARAMETER SkipApp
  Do not launch com.floc.app on the device.

.EXAMPLE
  pnpm run:all
.EXAMPLE
  .\scripts\run.ps1 -SkipEmulator
#>
[CmdletBinding()]
param(
  [string]$Avd = "Pixel_9",
  [switch]$SkipEmulator,
  [switch]$SkipWeb,
  [switch]$SkipMetro,
  [switch]$SkipApp
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$WebPort = 3000
$MetroPort = 8081
$AppId = "com.floc.app"
$AppActivity = "$AppId/.MainActivity"

function Write-Step { param([string]$Text) Write-Host "`n== $Text" -ForegroundColor Cyan }
function Write-Ok { param([string]$Text) Write-Host "   ok    $Text" -ForegroundColor Green }
function Write-Skip { param([string]$Text) Write-Host "   have  $Text" -ForegroundColor DarkGray }
function Write-Info { param([string]$Text) Write-Host "   ..    $Text" -ForegroundColor Yellow }

function Test-PortOpen {
  param([int]$Port)
  $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  return $null -ne $listening
}

# A port that is listening is not yet a server that answers, so callers that
# care about readiness wait on this rather than on the socket alone.
function Wait-ForPort {
  param([int]$Port, [int]$TimeoutSeconds = 120, [string]$What = "port $Port")
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortOpen -Port $Port) { return $true }
    Start-Sleep -Seconds 1
  }
  Write-Warning "Gave up waiting for $What after $TimeoutSeconds s."
  return $false
}

function Start-InNewWindow {
  param([string]$Title, [string]$Command)
  $inner = "`$host.UI.RawUI.WindowTitle = '$Title'; Set-Location '$RepoRoot'; $Command"
  Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $inner `
    -WorkingDirectory $RepoRoot | Out-Null
}

# A native tool writing to stderr is not an error, but under
# `$ErrorActionPreference = "Stop"` PowerShell treats it as one — and adb
# announces its own daemon startup on stderr. So every adb call goes through
# here, which merges the streams and hands back plain strings.
function Invoke-Native {
  param([string]$Exe, [string[]]$Arguments)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & $Exe @Arguments 2>&1
    return @($output | ForEach-Object { "$_" })
  }
  finally {
    $ErrorActionPreference = $previous
  }
}

# ---------------------------------------------------------------- Android SDK

function Resolve-AndroidSdk {
  $candidates = @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $env:LOCALAPPDATA "Android\Sdk")
  )
  foreach ($c in $candidates) {
    if ($c -and (Test-Path (Join-Path $c "platform-tools\adb.exe"))) { return $c }
  }
  return $null
}

$Sdk = Resolve-AndroidSdk
$Adb = $null
$Emulator = $null
if ($Sdk) {
  $Adb = Join-Path $Sdk "platform-tools\adb.exe"
  $Emulator = Join-Path $Sdk "emulator\emulator.exe"
}

# Rule 11 in spirit: a missing Android SDK costs you the phone half of the
# loop, never the web half.
if (-not $Sdk -and -not $SkipEmulator) {
  Write-Warning "No Android SDK found. Set ANDROID_HOME, or install it via Android Studio."
  Write-Warning "Continuing with the web app only."
  $SkipEmulator = $true
  $SkipApp = $true
}

# ----------------------------------------------------------------- 1 emulator

if ($Adb) { Invoke-Native -Exe $Adb -Arguments @("start-server") | Out-Null }

function Get-BootedDevice {
  $lines = Invoke-Native -Exe $Adb -Arguments @("devices")
  foreach ($line in $lines) {
    if ($line -match "^(emulator-\d+)\s+device$") { return $Matches[1] }
  }
  return $null
}

$Device = $null

if (-not $SkipEmulator) {
  Write-Step "Emulator ($Avd)"
  $Device = Get-BootedDevice
  if ($Device) {
    Write-Skip "$Device already running"
  }
  else {
    $known = Invoke-Native -Exe $Emulator -Arguments @("-list-avds")
    if ($known -notcontains $Avd) {
      Write-Warning "No AVD called '$Avd'. Known: $($known -join ', ')"
      Write-Warning "Create one in Android Studio > Device Manager."
      $SkipEmulator = $true
      $SkipApp = $true
    }
    else {
      Write-Info "booting $Avd"
      Start-Process -FilePath $Emulator -ArgumentList "-avd", $Avd | Out-Null
      Invoke-Native -Exe $Adb -Arguments @("wait-for-device") | Out-Null

      # `wait-for-device` returns as soon as adb can talk to it, which is long
      # before Android is usable. `sys.boot_completed` is the real signal.
      $deadline = (Get-Date).AddSeconds(300)
      while ((Get-Date) -lt $deadline) {
        $booted = (Invoke-Native -Exe $Adb -Arguments @("shell", "getprop", "sys.boot_completed")) -join ""
        if ($booted.Trim() -eq "1") { break }
        Start-Sleep -Seconds 2
      }
      $Device = Get-BootedDevice
      if ($Device) { Write-Ok "$Device booted" }
      else { Write-Warning "Emulator did not finish booting in time." }
    }
  }
}

# ------------------------------------------------------------ 2 web dev server

if (-not $SkipWeb) {
  Write-Step "Web dev server (port $WebPort)"
  if (Test-PortOpen -Port $WebPort) {
    Write-Skip "something already listening on $WebPort"
  }
  else {
    Write-Info "starting floc-web"
    Start-InNewWindow -Title "floc-web" -Command "pnpm --filter floc-web dev"
    if (Wait-ForPort -Port $WebPort -What "floc-web") { Write-Ok "http://localhost:$WebPort" }
  }
}

# ------------------------------------------------------------------- 3 Metro

if (-not $SkipMetro) {
  Write-Step "Metro (port $MetroPort)"
  if (Test-PortOpen -Port $MetroPort) {
    Write-Skip "something already listening on $MetroPort"
  }
  else {
    Write-Info "starting Metro"
    Start-InNewWindow -Title "floc-mobile metro" -Command "pnpm --filter floc-mobile exec expo start --dev-client"
    if (Wait-ForPort -Port $MetroPort -What "Metro") { Write-Ok "http://localhost:$MetroPort" }
  }
}

# --------------------------------------------------------- 4 reverse tunnels

# These do not survive an emulator reboot, so they are re-asserted on every run
# rather than set up once. `adb reverse` is idempotent.
if ($Device) {
  Write-Step "Reverse tunnels"
  Invoke-Native -Exe $Adb -Arguments @("-s", $Device, "reverse", "tcp:$WebPort", "tcp:$WebPort") | Out-Null
  Invoke-Native -Exe $Adb -Arguments @("-s", $Device, "reverse", "tcp:$MetroPort", "tcp:$MetroPort") | Out-Null
  Write-Ok "device localhost:$WebPort and :$MetroPort now reach this machine"
}

# --------------------------------------------------------------- 5 launch app

if ($Device -and -not $SkipApp) {
  Write-Step "App"
  $installed = (Invoke-Native -Exe $Adb -Arguments @("-s", $Device, "shell", "pm", "list", "packages", $AppId)) -join ""
  if ($installed -match [regex]::Escape($AppId)) {
    Invoke-Native -Exe $Adb -Arguments @("-s", $Device, "shell", "am", "start", "-n", $AppActivity) | Out-Null
    Write-Ok "$AppId launched"
  }
  else {
    Write-Warning "$AppId is not installed. Build it once with:"
    Write-Warning "  pnpm --filter floc-mobile android"
  }
}

Write-Host ""
Write-Host "Ready." -ForegroundColor Green
if (-not $SkipWeb) { Write-Host "  web    http://localhost:$WebPort" }
if (-not $SkipMetro) { Write-Host "  metro  press r in the 'floc-mobile metro' window to reload" }
Write-Host ""
Write-Host "pnpm verify is safe with these up. Stop them before a bare pnpm build / fitness - they share .next." -ForegroundColor DarkGray
