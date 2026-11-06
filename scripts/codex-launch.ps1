param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("web", "metro", "docs", "wireframes")]
  [string]$Service
)
$ErrorActionPreference = "Stop"
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
  & node scripts/workspace.mjs start $Service
  exit $LASTEXITCODE
} finally { Pop-Location }
