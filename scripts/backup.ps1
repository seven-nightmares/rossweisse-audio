<#
.SYNOPSIS
  Backs up the catalog database AND the uploaded photos into backups\<timestamp>\.

.DESCRIPTION
  database.dump     PostgreSQL custom-format dump (pg_dump -Fc)
  uploads.tar.gz    Contents of the cms-uploads Docker volume

  The dump is written inside the container and copied out with `docker compose cp`.
  Piping binary output through PowerShell would corrupt it.

.EXAMPLE
  scripts\backup.ps1
  scripts\backup.ps1 -Destination D:\ShopBackups\before-launch
#>
param([string]$Destination)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  $project = 'audiostore'
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $dest = if ($Destination) { $Destination } else { Join-Path $root "backups\$stamp" }
  New-Item -ItemType Directory -Force -Path $dest | Out-Null
  $dest = (Resolve-Path $dest).Path

  Write-Host "Backing up to $dest"

  docker compose up -d --wait db | Out-Null

  Write-Host '  database...'
  docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/audiostore.dump'
  docker compose cp db:/tmp/audiostore.dump (Join-Path $dest 'database.dump')
  docker compose exec -T db rm -f /tmp/audiostore.dump

  Write-Host '  photos...'
  docker run --rm -v "${project}_cms-uploads:/data:ro" -v "${dest}:/backup" alpine:3 `
    tar -czf /backup/uploads.tar.gz -C /data .

  $items = Get-ChildItem $dest | ForEach-Object { "{0} ({1:N1} MB)" -f $_.Name, ($_.Length / 1MB) }
  Write-Host "Done: $($items -join ', ')" -ForegroundColor Green
  Write-Host 'Copy this folder somewhere off this computer (cloud drive, USB disk) to keep it safe.'
}
finally {
  Pop-Location
}
