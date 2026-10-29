#!/usr/bin/env sh
# Loads the sample catalog into Strapi, creates/refreshes the storefront's two API tokens,
# writes them into .env (never printed), then restarts the storefront. See seed.ps1.
set -eu
cd "$(dirname "$0")/.."
[ -f .env ] || { echo ".env is missing. Run scripts/new-env.sh first." >&2; exit 1; }

docker compose up -d --wait cms >/dev/null
out=$(docker compose exec -T cms npm run seed -- --with-token 2>&1)
printf '%s\n' "$out" | grep '^Seed complete' || true

api=$(printf '%s\n' "$out" | sed -n 's/^STRAPI_API_TOKEN=//p' | tr -d '\r')
inquiry=$(printf '%s\n' "$out" | sed -n 's/^STRAPI_INQUIRY_TOKEN=//p' | tr -d '\r')
[ -n "$api" ] && [ -n "$inquiry" ] || { printf '%s\n' "$out"; echo "The seed did not return both tokens." >&2; exit 1; }

tmp=$(mktemp)
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
    STRAPI_API_TOKEN=*) printf 'STRAPI_API_TOKEN=%s\n' "$api" ;;
    STRAPI_INQUIRY_TOKEN=*) printf 'STRAPI_INQUIRY_TOKEN=%s\n' "$inquiry" ;;
    *) printf '%s\n' "$line" ;;
  esac
done < .env > "$tmp"
mv "$tmp" .env
echo "Saved both storefront tokens in .env."

docker compose up -d web >/dev/null
echo "Storefront restarted: http://localhost:3001"
