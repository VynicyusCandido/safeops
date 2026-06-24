#!/usr/bin/env bash
set -euo pipefail

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

# Lista backups disponíveis
echo "Backups disponíveis em ${BACKUP_DIR}:"
mapfile -t GPG_FILES < <(ls -t "${BACKUP_DIR}"/*.gpg 2>/dev/null)

if [ ${#GPG_FILES[@]} -eq 0 ]; then
  echo "Nenhum backup encontrado em ${BACKUP_DIR}."
  exit 1
fi

for i in "${!GPG_FILES[@]}"; do
  echo "  $((i + 1))) $(basename "${GPG_FILES[$i]}")"
done

echo ""
read -rp "Digite o número do backup a restaurar: " choice
GPG_FILE="${GPG_FILES[$((choice - 1))]}"

[ -z "${GPG_FILE}" ] && { echo "Seleção inválida."; exit 1; }

HASH_FILE="${GPG_FILE}.sha256"
GZ_FILE="${GPG_FILE%.gpg}"
DUMP_FILE="${GZ_FILE%.gz}"

echo ""
echo "[1/5] Verificando integridade SHA-256..."
sha256sum --check "${HASH_FILE}" || {
  echo "ERRO: hash inválido — backup corrompido ou adulterado. Restauração abortada."
  exit 1
}
echo "  Hash OK."

echo ""
echo "[2/5] Descriptografando com GPG..."
echo "${BACKUP_PASSPHRASE}" | gpg --batch --passphrase-fd 0 \
  --decrypt --output "${GZ_FILE}" "${GPG_FILE}"

echo "[3/5] Descomprimindo..."
gunzip "${GZ_FILE}"

echo ""
echo "⚠️  ATENÇÃO: Pare o backend (Spring Boot) antes de continuar."
echo "    Se o backend estiver rodando, a restauração pode falhar por conexões ativas."
read -rp "Backend parado? [s/N]: " confirm
if [[ ! "${confirm}" =~ ^[sS]$ ]]; then
  rm -f "${DUMP_FILE}"
  echo "Restauração cancelada. Arquivo temporário removido."
  exit 0
fi

echo ""
echo "[4/5] Restaurando banco ${DB_NAME}..."
PGPASSWORD="${DB_PASSWORD}" docker exec -i "${CONTAINER}" \
  pg_restore -U "${DB_USERNAME}" -d "${DB_NAME}" --clean --if-exists < "${DUMP_FILE}"

echo "[5/5] Validando registros restaurados..."
count_table() {
  PGPASSWORD="${DB_PASSWORD}" docker exec "${CONTAINER}" \
    psql -U "${DB_USERNAME}" -d "${DB_NAME}" -tAc "SELECT COUNT(*) FROM $1;"
}

USERS=$(count_table usuario)
OCORRENCIAS=$(count_table ocorrencia)
LOGS=$(count_table log_auditoria)

rm -f "${DUMP_FILE}"

echo ""
echo "✓ Restauração concluída:"
echo "  usuario:       ${USERS} registro(s)"
echo "  ocorrencia:    ${OCORRENCIAS} registro(s)"
echo "  log_auditoria: ${LOGS} registro(s)"
