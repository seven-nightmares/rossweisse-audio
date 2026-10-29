<#
.SYNOPSIS
  Restores the catalog database AND uploaded photos from a backup folder made by backup.ps1.
  This REPLACES all current listings and photos.

.EXAMPLE
  scripts\restore.ps1 -From backups\20261011-101500
#>
param(
  [Parameter(Mandatory)][string]$From,
  [switch]$Yes
)
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

$root = Split-Path -Parent $PSScriptRoot
$from = (Resolve-Path $From).Path
foreach ($f in 'database.dump', 'uploads.tar.gz') {
  if (-not (Test-Path (Join-Path $from $f))) { throw "Missing $f in $from" }
}

if (-not $Yes) {
  $answer = Read-Host "This replaces ALL current listings and photos with the backup in $from. Type 'restore' to continue"
  if ($answer -ne 'restore') { Write-Host 'Cancelled.'; exit 1 }
}

Push-Location $root
try {
  $project = 'audiostore'

  Write-Host 'Stopping storefront and CMS...'
  docker compose stop web cms
  docker compose up -d --wait db | Out-Null

  Write-Host 'Restoring database...'
  docker compose cp (Join-Path $from 'database.dump') db:/tmp/restore.dump
  docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction /tmp/restore.dump; status=$?; rm -f /tmp/restore.dump; exit $status'

  Write-Host 'Restoring photos...'
  docker run --rm -v "${project}_cms-uploads:/data" -v "${from}:/backup:ro" alpine:3 `
    sh -c 'find /data -mindepth 1 -delete && tar -xzf /backup/uploads.tar.gz -C /data'

  Write-Host 'Starting CMS and storefront...'
  docker compose up -d
  Write-Host 'Restore complete.' -ForegroundColor Green
}
finally {
  Pop-Location
}
