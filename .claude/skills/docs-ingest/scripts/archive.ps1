# archive.ps1 — move raw + refined input files to dated archive entries
# Usage: archive.ps1 -Filename "my-notes.md"
param(
  [Parameter(Mandatory)][string]$Filename
)

$base     = "docs/input"
$date     = Get-Date -Format "yyyy-MM-dd"
$stem     = [System.IO.Path]::GetFileNameWithoutExtension($Filename)
$ext      = [System.IO.Path]::GetExtension($Filename)

# If the stem already starts with a date prefix (yyyy-MM-dd_) keep it as-is
$prefix   = if ($stem -match '^\d{4}-\d{2}-\d{2}_') { "" } else { "${date}_" }

$rawSrc      = "$base/raw/$Filename"
$refinedSrc  = "$base/refined/$Filename"
$rawDest     = "$base/archive/${prefix}${stem}${ext}"
$refinedDest = "$base/archive/${prefix}${stem}_refined${ext}"

if (Test-Path $rawSrc) {
  Move-Item $rawSrc $rawDest -Force
  Write-Host "Archived raw:     $rawDest"
} else {
  Write-Warning "Raw file not found: $rawSrc"
}

if (Test-Path $refinedSrc) {
  Move-Item $refinedSrc $refinedDest -Force
  Write-Host "Archived refined: $refinedDest"
} else {
  Write-Warning "Refined file not found: $refinedSrc"
}
