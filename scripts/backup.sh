#!/usr/bin/env sh
# Backs up the catalog database AND uploaded photos into backups/<timestamp>/ (or the given folder).
set -eu
cd "$(dirname "$0")/.."
PROJECT=audiostore
DEST=${1:-backups/$(date +%Y%m%d-%H%M%S)}
mkdir -p "$DEST"
DEST=$(cd "$DEST" && pwd)
echo "Backing up to $DEST"

docker compose up -d --wait db >/dev/null

echo "  database..."
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /tmp/audiostore.dump'
docker compose cp db:/tmp/audiostore.dump "$DEST/database.dump"
docker compose exec -T db rm -f /tmp/audiostore.dump

echo "  photos..."
docker run --rm -v "${PROJECT}_cms-uploads:/data:ro" -v "$DEST:/backup" alpine:3 \
  tar -czf /backup/uploads.tar.gz -C /data .

ls -lh "$DEST"
echo "Done. Copy this folder somewhere off this computer to keep it safe."
