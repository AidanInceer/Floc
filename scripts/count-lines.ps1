# Counts source code lines in the repo. Skips deps and build output.
$exts = @('ts','tsx','js','jsx','mjs','cjs','css','sh','bash','sql','html')
$skip = '[\\/](node_modules|\.next|\.next-verify|dist|build|\.turbo|coverage|\.expo|android|ios)[\\/]'

$files = Get-ChildItem -Path $PSScriptRoot\.. -Recurse -File |
  Where-Object { $exts -contains $_.Extension.TrimStart('.') } |
  Where-Object { $_.FullName -notmatch $skip }

$total = 0
$byExt = @{}
foreach ($f in $files) {
  $lines = (Get-Content -LiteralPath $f.FullName | Measure-Object -Line).Lines
  $total += $lines
  $e = $f.Extension.TrimStart('.')
  $byExt[$e] = ($byExt[$e] + $lines)
}

$byExt.GetEnumerator() | Sort-Object Value -Descending |
  ForEach-Object { "{0,-6} {1,8}" -f $_.Key, $_.Value }
"{0,-6} {1,8}" -f '-----', '--------'
"{0,-6} {1,8}" -f 'TOTAL', $total
"Files: $($files.Count)"
