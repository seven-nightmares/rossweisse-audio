#!/usr/bin/env sh
# Creates .env from .env.example with freshly generated secrets (macOS/Linux/Git Bash).
# Refuses to overwrite an existing .env unless --force is given.
set -eu
cd "$(dirname "$0")/.."

if [ -f .env ] && [ "${1:-}" != "--force" ]; then
  echo ".env already exists. Use --force to replace it (this changes all secrets)." >&2
  exit 1
fi

secret() { openssl rand -base64 "${1:-16}"; }
password() { openssl rand -base64 24 | tr -d '+/='; }

DATABASE_PASSWORD=$(password)
APP_KEYS="$(secret),$(secret),$(secret),$(secret)"
API_TOKEN_SALT=$(secret)
ADMIN_JWT_SECRET=$(secret)
TRANSFER_TOKEN_SALT=$(secret)
JWT_SECRET=$(secret)
ENCRYPTION_KEY=$(secret 32)

while IFS= read -r line || [ -n "$line" ]; do
  key=${line%%=*}
  case "$key" in
    DATABASE_PASSWORD|APP_KEYS|API_TOKEN_SALT|ADMIN_JWT_SECRET|TRANSFER_TOKEN_SALT|JWT_SECRET|ENCRYPTION_KEY)
      eval "printf '%s=%s\n' \"\$key\" \"\$$key\"" ;;
    *) printf '%s\n' "$line" ;;
  esac
done < .env.example > .env

echo "Wrote .env with new secrets."
