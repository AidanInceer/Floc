param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("web", "metro", "docs", "wireframes")]
  [string]$Service
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot

switch ($Service) {
  "web" {
    $Port = 3000
    $WorkingDirectory = Join-Path $RepoRoot "floc/apps/web"
    $NodeArguments = @("--experimental-strip-types", "--import", "./scripts/alias-loader-register.mjs", "server.ts", "--dev")
    $Url = "http://localhost:3000/"
  }
  "metro" {
    $Port = 8081
    $WorkingDirectory = Join-Path $RepoRoot "floc/apps/mobile"
    $NodeArguments = @("../../../node_modules/expo/bin/cli", "start", "--dev-client", "--port", "8081")
    $Url = "http://localhost:8081/status"
  }
  "docs" {
    $Port = 4173
    $WorkingDirectory = $RepoRoot
    $NodeArguments = @("scripts/docs-server.mjs")
    $Url = "http://localhost:4173/"
  }
  "wireframes" {
    $Port = 4100
    $WorkingDirectory = $RepoRoot
    $NodeArguments = @("--experimental-strip-types", "scripts/wireframe-server.mjs")
    $Url = "http://localhost:4100/"
  }
}

$Connection = New-Object System.Net.Sockets.TcpClient
try {
  $Connection.Connect("127.0.0.1", $Port)
  Write-Host "Port $Port is already in use: $Url"
  exit 0
} catch [System.Net.Sockets.SocketException] {
} finally {
  $Connection.Dispose()
}

Write-Host "Starting $Service at $Url"
Push-Location $WorkingDirectory
try {
  & node @NodeArguments
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
