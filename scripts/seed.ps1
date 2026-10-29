<#
.SYNOPSIS
  Loads the sample catalog into Strapi (skipping anything already there), creates or refreshes
  the storefront's two API tokens, and writes them into .env. Then restarts the storefront.

.DESCRIPTION
  STRAPI_API_TOKEN       custom token: read catalog content only (cannot see inquiries)
  STRAPI_INQUIRY_TOKEN   custom token: create inquiries only
  The tokens are written straight into .env and never printed.

.EXAMPLE
  scripts\seed.ps1
#>
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  $envFile = Join-Path $root '.env'
  if (-not (Test-Path $envFile)) { throw '.env is missing. Run scripts\new-env.ps1 first.' }

  docker compose up -d --wait cms | Out-Null
  $out = docker compose exec -T cms npm run seed -- --with-token 2>&1
  $out | Where-Object { $_ -match '^Seed complete' } | Write-Host

  $tokens = @{}
  foreach ($line in $out) {
    if ($line -match '^(STRAPI_API_TOKEN|STRAPI_INQUIRY_TOKEN)=(.+)$') { $tokens[$Matches[1]] = $Matches[2].Trim() }
  }
  if ($tokens.Count -ne 2) { $out | Write-Host; throw 'The seed did not return both tokens.' }

  $lines = Get-Content $envFile | ForEach-Object {
    if ($_ -match '^(STRAPI_API_TOKEN|STRAPI_INQUIRY_TOKEN)=') { "$($Matches[1])=$($tokens[$Matches[1]])" } else { $_ }
  }
  [System.IO.File]::WriteAllLines($envFile, $lines)
  Write-Host 'Saved both storefront tokens in .env.'

  docker compose up -d web | Out-Null
  Write-Host 'Storefront restarted: http://localhost:3001' -ForegroundColor Green
}
finally {
  Pop-Location
}
