$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$cacheDir = Join-Path $projectRoot '.npm-test-cache'
$modulesDir = Join-Path $projectRoot 'node_modules'
$distDir = Join-Path $projectRoot 'dist'

try {
  # Installs only in this project; the cache is also kept inside the project.
  npm ci --cache $cacheDir --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }

  npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }

  Write-Host 'Temporary build verification passed.' -ForegroundColor Green
}
finally {
  foreach ($directory in @($modulesDir, $cacheDir, $distDir)) {
    if (Test-Path -LiteralPath $directory) {
      Remove-Item -LiteralPath $directory -Recurse -Force
    }
  }
  Write-Host 'Removed temporary npm modules, cache, and build output.' -ForegroundColor Yellow
}
