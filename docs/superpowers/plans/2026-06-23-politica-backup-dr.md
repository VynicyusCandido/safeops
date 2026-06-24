# Política de Backup e DR — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar dois scripts shell funcionais (`backup.sh` e `restore.sh`) e um documento de política publicável, implementando e demonstrando a política de backup com criptografia GPG AES-256, verificação de integridade SHA-256 e rotação automática.

**Architecture:** `backup.sh` executa `pg_dump` dentro do container Docker `safeops-db`, comprime com gzip, criptografa com GPG simétrico (AES-256), gera hash SHA-256 e rotaciona mantendo os 7 pares mais recentes em `./backups/`. `restore.sh` verifica o hash, descriptografa, restaura com `pg_restore` e valida contagem de registros nas tabelas críticas. Credenciais e passphrase via variáveis de ambiente.

**Tech Stack:** Bash, `pg_dump`/`pg_restore` (PostgreSQL 16 client tools via Docker exec), `gzip`, `gpg` (GNU Privacy Guard — verificar com `gpg --version`), `sha256sum`, Docker.

## Global Constraints

- Container Docker do banco: `safeops-db`
- Banco de dados: `safeops`
- Credenciais lidas de `.env`: `DB_USERNAME`, `DB_PASSWORD`
- Passphrase de criptografia: `BACKUP_PASSPHRASE` (variável de ambiente — nunca hardcoded)
- Diretório de backups: `./backups/` (relativo à raiz do projeto)
- Retenção: 7 pares mais recentes (`.gpg` + `.gpg.sha256`)
- Scripts devem funcionar a partir da raiz do projeto: `./scripts/backup.sh`
- GPG em modo batch (não-interativo) — passphrase via `--passphrase-fd 0`
- `gpg` deve estar instalado: `gpg --version` (WSL2/Linux já inclui; Windows requer GPG4Win)
- `mapfile` requer Bash 4+ (WSL2/Linux já satisfaz)

---

## Mapa de arquivos

```
Criar:
  scripts/backup.sh
  scripts/restore.sh
  docs/seguranca/politica-backup.md

Modificar:
  .env.example  ← adicionar BACKUP_PASSPHRASE
```

---

## Task 1: `scripts/backup.sh`

**Files:**
- Create: `scripts/backup.sh`

**Interfaces:**
- Consumes: variáveis de ambiente `DB_USERNAME`, `DB_PASSWORD`, `BACKUP_PASSPHRASE`; container Docker `safeops-db` rodando
- Produces: par de arquivos em `./backups/`:
  - `safeops_YYYY-MM-DDTHHMMSS.dump.gz.gpg`
  - `safeops_YYYY-MM-DDTHHMMSS.dump.gz.gpg.sha256`

---

- [ ] **Step 1: Criar o diretório `scripts/` e o arquivo `backup.sh`**

Criar `scripts/backup.sh` com o conteúdo abaixo:

```bash
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
```

- [ ] **Step 2: Tornar o script executável**

```bash
chmod +x scripts/backup.sh
```

- [ ] **Step 3: Verificar que o container está rodando e executar o backup**

```bash
docker ps --filter name=safeops-db --format "{{.Names}}"
# Esperado: safeops-db

BACKUP_PASSPHRASE=senha-de-teste ./scripts/backup.sh
```

Saída esperada:
```
[1/5] Executando pg_dump no container safeops-db...
[2/5] Comprimindo com gzip...
[3/5] Criptografando com GPG AES-256...
[4/5] Gerando hash SHA-256...
[5/5] Rotacionando — mantendo 7 pares mais recentes...

✓ Backup concluído: safeops_2026-06-23T020000.dump.gz.gpg
  Hash: abc123...  backups/safeops_2026-06-23T020000.dump.gz.gpg
```

- [ ] **Step 4: Verificar os arquivos gerados**

```bash
ls -lh backups/
```

Esperado: dois arquivos — um `.gpg` e um `.gpg.sha256`.

```bash
file backups/*.gpg
```

Esperado: `GPG symmetrically encrypted data (AES256 cipher)` — confirma que a criptografia foi aplicada.

- [ ] **Step 5: Commit**

```bash
git add scripts/backup.sh
git commit -m "feat(backup): adiciona script de backup com GPG AES-256 e rotação"
```

---

## Task 2: `scripts/restore.sh`

**Files:**
- Create: `scripts/restore.sh`

**Interfaces:**
- Consumes: par de arquivos `.gpg` + `.gpg.sha256` produzido por `backup.sh`; variáveis `DB_USERNAME`, `DB_PASSWORD`, `BACKUP_PASSPHRASE`; container `safeops-db` rodando
- Produces: banco `safeops` restaurado; saída com contagem de registros por tabela

---

- [ ] **Step 1: Criar `scripts/restore.sh`**

Criar `scripts/restore.sh` com o conteúdo abaixo:

```bash
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
```

- [ ] **Step 2: Tornar o script executável**

```bash
chmod +x scripts/restore.sh
```

- [ ] **Step 3: Testar verificação de integridade — cenário de hash adulterado**

```bash
# Corrompe o hash para testar a detecção
cp backups/*.sha256 /tmp/hash_original.bak
echo "hash_invalido  arquivo" > backups/$(ls backups/*.sha256 | head -1 | xargs basename)

BACKUP_PASSPHRASE=senha-de-teste ./scripts/restore.sh
# Selecionar o backup disponível
```

Esperado: `ERRO: hash inválido — backup corrompido ou adulterado. Restauração abortada.` e script termina com código de saída != 0.

```bash
# Restaura o hash original
cp /tmp/hash_original.bak backups/$(ls backups/*.sha256 | head -1 | xargs basename)
```

- [ ] **Step 4: Testar restauração completa**

```bash
# Insere um registro de teste para confirmar que a restauração traz o estado do backup
PGPASSWORD="${DB_PASSWORD}" docker exec safeops-db \
  psql -U "${DB_USERNAME}" -d safeops \
  -c "INSERT INTO usuario (id, nome, email, senha_hash, perfil, ativo, trocar_senha_no_proximo_login) VALUES (gen_random_uuid(), 'Teste Restore', 'restore@test.com', 'hash', 'SOLICITANTE', true, false);"

# Executa a restauração (deve reverter o INSERT acima)
BACKUP_PASSPHRASE=senha-de-teste ./scripts/restore.sh
# Selecionar o backup, confirmar backend parado
```

Esperado: usuário `restore@test.com` não aparece após restauração — confirma que o estado do banco voltou ao ponto do backup.

- [ ] **Step 5: Commit**

```bash
git add scripts/restore.sh
git commit -m "feat(backup): adiciona script de restauração com verificação de integridade"
```

---

## Task 3: Documento de política + atualização do `.env.example`

**Files:**
- Create: `docs/seguranca/politica-backup.md`
- Modify: `.env.example`

**Interfaces:**
- Consumes: nada de código — é documentação
- Produces: documento publicável referenciável no relatório final; `.env.example` com `BACKUP_PASSPHRASE`

---

- [ ] **Step 1: Criar `docs/seguranca/politica-backup.md`**

Criar o arquivo com o conteúdo abaixo:

```markdown
# Política de Backup e Recuperação de Desastres — SafeOps

**Projeto:** P05-B — Ocorrências Operacionais
**Sistema:** SafeOps
**Disciplina:** Segurança da Informação — Avaliação N3
**Data:** 2026-06-23

---

## 1. Parâmetros de Recuperação

| Parâmetro | Valor | Justificativa |
|---|---|---|
| **RPO** (máximo de dados aceitável perder) | 24 horas | Ocorrências operacionais são registradas ao longo do dia; perder mais de 24h compromete rastreabilidade de incidentes |
| **RTO** (tempo máximo para restauração) | 4 horas | Tempo suficiente para restauração manual com validação; sistema não é crítico em tempo real |

---

## 2. Escopo

Banco de dados completo `safeops` (PostgreSQL 16), incluindo todas as tabelas:

| Tabela | Classificação | Criticidade |
|---|---|---|
| `usuario` | Restrito/Confidencial | Credenciais e dados pessoais (LGPD) |
| `ocorrencia` | Confidencial | Registros operacionais internos |
| `comentario` | Confidencial | Comunicação interna auditável |
| `log_auditoria` | Confidencial | Trilha imutável — perda elimina rastreabilidade forense |

---

## 3. Frequência e Tipo

| Parâmetro | Valor |
|---|---|
| Frequência | Diária |
| Horário recomendado | 02h00 (fora do horário de uso) |
| Tipo | Backup lógico completo via `pg_dump` (formato custom `-Fc`) |

---

## 4. Proteção em Repouso

| Controle | Implementação | Risco mitigado |
|---|---|---|
| Compressão | gzip | Redução de tamanho; não é controle de segurança |
| Criptografia | GPG AES-256 simétrico | Exposição de dados confidenciais em caso de acesso físico ao disco ou vazamento do arquivo |
| Passphrase | Variável de ambiente `BACKUP_PASSPHRASE` | Credencial não armazenada em código ou arquivo versionado |
| Dado intermediário | Arquivo `.gz` removido imediatamente após criptografia | Dado descriptografado não permanece em disco |

---

## 5. Verificação de Integridade

- Hash **SHA-256** gerado sobre o arquivo `.gpg` e armazenado junto ao backup (`.gpg.sha256`)
- Hash **verificado pelo `restore.sh` antes de qualquer operação** — restauração abortada se divergir
- Garante detecção de corrupção acidental ou adulteração intencional

---

## 6. Retenção e Rotação

| Parâmetro | Valor |
|---|---|
| Retenção | 7 backups (7 dias) |
| Rotação | Automática pelo `backup.sh` — remove os mais antigos após cada execução bem-sucedida |

---

## 7. Procedimento de Backup

```bash
# A partir da raiz do projeto, com o container Docker rodando:
BACKUP_PASSPHRASE=<passphrase-segura> ./scripts/backup.sh
```

Ou com as variáveis já no `.env`:
```bash
./scripts/backup.sh
```

---

## 8. Procedimento de Restauração

```bash
# 1. Parar o backend (Spring Boot) antes de executar
# 2. Executar:
BACKUP_PASSPHRASE=<passphrase-segura> ./scripts/restore.sh
# 3. Selecionar o backup desejado na lista
# 4. Confirmar que o backend está parado
# 5. Validar os contadores exibidos ao final
```

---

## 9. Responsabilidades

| Responsável | Ação |
|---|---|
| ADMINISTRADOR | Executar backup antes de operações de risco (atualizações, migrações) |
| ADMINISTRADOR | Testar restauração mensalmente em banco isolado |
| Equipe técnica | Manter `BACKUP_PASSPHRASE` documentada fora do repositório (ex: gerenciador de senhas) |

---

## 10. Limitações Conhecidas

| Limitação | Risco residual | Recomendação para produção |
|---|---|---|
| Backup armazenado localmente | Falha de hardware no servidor elimina backup e dados simultaneamente | Replicar para storage externo (S3, GCS) ou servidor separado |
| Sem agendamento automático | Backup depende de execução manual ou cron configurado manualmente | `0 2 * * * cd /app && ./scripts/backup.sh >> /var/log/safeops-backup.log 2>&1` |
| Sem backup incremental | Cada backup é completo; cresce com o volume | WAL archiving do PostgreSQL para volumes maiores |
| Passphrase única e sem rotação | Comprometimento expõe todos os backups retidos | Rotação periódica da passphrase com re-criptografia |

---

## 11. Rastreabilidade com o Adendo

| Requisito do adendo | Atendimento |
|---|---|
| Especificação da política de backup e DR | Este documento |
| Proteção de dados em repouso | GPG AES-256 nos arquivos de backup |
| Justificativa técnica rastreável | Cada controle mapeado ao risco que mitiga (seções 4 e 5) |
| AppSec desde o design | RPO/RTO e criptografia definidos como requisitos, não adicionados depois |

---

*Scripts: [`scripts/backup.sh`](../../scripts/backup.sh) e [`scripts/restore.sh`](../../scripts/restore.sh)*
```

- [ ] **Step 2: Adicionar `BACKUP_PASSPHRASE` ao `.env.example`**

Abrir `.env.example` e adicionar ao final:

```
# Backup
BACKUP_PASSPHRASE=   # passphrase para criptografia GPG dos backups — guarde fora do repositório
```

- [ ] **Step 3: Verificar que `.env.example` não contém valor real**

```bash
grep BACKUP_PASSPHRASE .env.example
```

Esperado: linha com valor vazio ou comentário — nunca uma passphrase real.

- [ ] **Step 4: Commit final**

```bash
git add docs/seguranca/politica-backup.md .env.example
git commit -m "docs(backup): adiciona política de backup e atualiza .env.example"
```

---

## Verificação Final

- [ ] Executar backup do zero e confirmar os dois arquivos em `./backups/`
- [ ] Confirmar que `file backups/*.gpg` retorna `GPG symmetrically encrypted data (AES256 cipher)`
- [ ] Executar restore e confirmar que os contadores de registros fazem sentido
- [ ] Confirmar que adulteração do hash aborta a restauração
- [ ] Confirmar que `BACKUP_PASSPHRASE` não aparece em nenhum arquivo versionado:

```bash
git grep -r "BACKUP_PASSPHRASE" -- ':!.env.example' ':!docs/' ':!scripts/'
```

Esperado: sem resultados.
