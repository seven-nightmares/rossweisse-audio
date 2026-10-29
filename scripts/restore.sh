#!/usr/bin/env sh
# Restores the catalog database AND uploaded photos from a backup folder made by backup.sh/backup.ps1.
# This REPLACES all current listings and photos.  Usage: scripts/restore.sh backups/20261011-101500 [--yes]
set -eu
cd "$(dirname "$0")/.."
PROJECT=audiostore
FROM=$(cd "${1:?Usage: restore.sh <backup-folder> [--yes]}" && pwd)
for f in database.dump uploads.tar.gz; do
  [ -f "$FROM/$f" ] || { echo "Missing $f in $FROM" >&2; exit 1; }
done

if [ "${2:-}" != "--yes" ]; then
  printf "This replaces ALL current listings and photos with %s. Type 'restore' to continue: " "$FROM"
  read -r answer
  [ "$answer" = "restore" ] || { echo "Cancelled."; exit 1; }
fi

echo "Stopping storefront and CMS..."
docker compose stop web cms
docker compose up -d --wait db >/dev/null

echo "Restoring database..."
docker compose cp "$FROM/database.dump" db:/tmp/restore.dump
docker compose exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction /tmp/restore.dump; status=$?; rm -f /tmp/restore.dump; exit $status'

echo "Restoring photos..."
docker run --rm -v "${PROJECT}_cms-uploads:/data" -v "$FROM:/backup:ro" alpine:3 \
  sh -c 'find /data -mindepth 1 -delete && tar -xzf /backup/uploads.tar.gz -C /data'

echo "Starting CMS and storefront..."
docker compose up -d
echo "Restore complete."
