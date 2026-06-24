#!/usr/bin/env bash
set -euo pipefail

# Carrega .env se as variáveis ainda não estiverem definidas
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DB_USERNAME:?Variável DB_USERNAME não definida}"
: "${DB_PASSWORD:?Variável DB_PASSWORD não definida}"
: "${BACKUP_PASSPHRASE:?Variável BACKUP_PASSPHRASE não definida}"

CONTAINER="safeops-db"
DB_NAME="safeops"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y-%m-%dT%H%M%S)
DUMP_FILE="${BACKUP_DIR}/safeops_${TIMESTAMP}.dump"
GZ_FILE="${DUMP_FILE}.gz"
GPG_FILE="${GZ_FILE}.gpg"
HASH_FILE="${GPG_FILE}.sha256"
RETAIN=7

mkdir -p "${BACKUP_DIR}"

echo "[1/5] Executando pg_dump no container ${CONTAINER}..."
PGPASSWORD="${DB_PASSWORD}" docker exec -i "${CONTAINER}" \
  pg_dump -U "${DB_USERNAME}" -Fc "${DB_NAME}" > "${DUMP_FILE}"

echo "[2/5] Comprimindo com gzip..."
gzip "${DUMP_FILE}"

echo "[3/5] Criptografando com GPG AES-256..."
echo "${BACKUP_PASSPHRASE}" | gpg --batch --passphrase-fd 0 \
  --symmetric --cipher-algo AES256 \
  --output "${GPG_FILE}" "${GZ_FILE}"
rm "${GZ_FILE}"

echo "[4/5] Gerando hash SHA-256..."
sha256sum "${GPG_FILE}" > "${HASH_FILE}"

echo "[5/5] Rotacionando — mantendo ${RETAIN} pares mais recentes..."
ls -t "${BACKUP_DIR}"/*.gpg 2>/dev/null | tail -n +$((RETAIN + 1)) | while IFS= read -r old_gpg; do
  rm -f "${old_gpg}" "${old_gpg}.sha256"
  echo "  Removido: $(basename "${old_gpg}")"
done

echo ""
echo "✓ Backup concluído: $(basename "${GPG_FILE}")"
echo "  Hash: $(cat "${HASH_FILE}")"
