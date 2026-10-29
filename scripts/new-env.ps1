<#
.SYNOPSIS
  Creates .env from .env.example with freshly generated secrets.
  Refuses to overwrite an existing .env unless -Force is given.
#>
param([switch]$Force)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env'
if ((Test-Path $envFile) -and -not $Force) {
  Write-Host ".env already exists. Use -Force to replace it (this changes all secrets)." -ForegroundColor Yellow
  exit 1
}

function New-Secret([int]$bytes = 16) {
  $buf = [byte[]]::new($bytes)
  [System.Security.Cryptography.RandomNumberGenerator]::Fill($buf)
  [Convert]::ToBase64String($buf)
}
function New-Password {
  # URL-safe so it works unquoted in connection strings.
  (New-Secret 24) -replace '[+/=]', ''
}

$values = @{
  DATABASE_PASSWORD   = New-Password
  APP_KEYS            = (1..4 | ForEach-Object { New-Secret }) -join ','
  API_TOKEN_SALT      = New-Secret
  ADMIN_JWT_SECRET    = New-Secret
  TRANSFER_TOKEN_SALT = New-Secret
  JWT_SECRET          = New-Secret
  ENCRYPTION_KEY      = New-Secret 32
}

$lines = Get-Content (Join-Path $root '.env.example') | ForEach-Object {
  if ($_ -match '^([A-Z_]+)=' -and $values.ContainsKey($Matches[1])) { "$($Matches[1])=$($values[$Matches[1]])" } else { $_ }
}
[System.IO.File]::WriteAllLines($envFile, $lines)
Write-Host "Wrote $envFile with new secrets." -ForegroundColor Green
