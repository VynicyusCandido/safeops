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
