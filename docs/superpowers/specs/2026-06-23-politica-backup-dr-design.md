# Política de Backup e Recuperação de Desastres — SafeOps

**Data:** 2026-06-23
**Disciplina:** Segurança da Informação — Avaliação N3
**Projeto:** P05-B — SafeOps

---

## Objetivo

Especificar a política de backup e recuperação de desastres do SafeOps, atendendo ao requisito do adendo de AppSec: proteção de dados em repouso e continuidade operacional. Cada decisão é rastreada a um risco ou requisito de segurança previamente identificado.

---

## Parâmetros de Recuperação

| Parâmetro | Valor | Justificativa |
|---|---|---|
| **RPO** (máximo de dados aceitável perder) | 24 horas | Ocorrências operacionais são registradas ao longo do dia; perder mais de 24h comprometeria rastreabilidade de incidentes |
| **RTO** (máximo de tempo para voltar ao ar) | 4 horas | Tempo suficiente para restauração manual com validação; sistema não é crítico em tempo real |

---

## Escopo do Backup

Banco de dados completo `safeops` (PostgreSQL 16), incluindo todas as tabelas:

- `usuario` — credenciais e perfis (dados pessoais LGPD)
- `ocorrencia` — registros operacionais confidenciais
- `comentario` — comunicação interna auditável
- `log_auditoria` — trilha imutável de eventos (evidência forense)

A tabela `log_auditoria` é especialmente crítica: sua perda elimina rastreabilidade de ações passadas.

---

## Frequência e Janela

| Parâmetro | Valor |
|---|---|
| Frequência | Diária |
| Horário | 02h00 (fora do horário de uso) |
| Tipo | Backup lógico completo (`pg_dump`) |

---

## Processo de Backup (`scripts/backup.sh`)

```
1. Lê variáveis de ambiente (DB_USERNAME, DB_PASSWORD, DB_URL, BACKUP_PASSPHRASE)
2. Executa pg_dump no container Docker → formato custom (-Fc)
3. Comprime com gzip → safeops_YYYY-MM-DDTHHMMSS.dump.gz
4. Criptografa com GPG (AES-256 simétrico) → .dump.gz.gpg
5. Gera hash SHA-256 do arquivo criptografado → .dump.gz.gpg.sha256
6. Remove o .gz intermediário (dado descriptografado não permanece em disco)
7. Rotaciona: mantém os 7 pares mais recentes (.gpg + .sha256); remove os demais
```

**Destino:** diretório `./backups/` no host (fora do container Docker).

**Estrutura resultante:**
```
backups/
  safeops_2026-06-23T020000.dump.gz.gpg
  safeops_2026-06-23T020000.dump.gz.gpg.sha256
  safeops_2026-06-22T020000.dump.gz.gpg
  safeops_2026-06-22T020000.dump.gz.gpg.sha256
  ...
```

---

## Criptografia em Repouso

| Decisão | Justificativa | Risco mitigado |
|---|---|---|
| GPG AES-256 simétrico | Padrão amplamente auditado; disponível em Linux/Mac sem dependências extras | Exposição de dados pessoais e operacionais em caso de acesso físico ao disco ou vazamento do arquivo de backup |
| Passphrase via variável de ambiente (`BACKUP_PASSPHRASE`) | Segue o mesmo padrão do projeto (`.env`); não hardcoded no script | Exposição de credencial em repositório público |
| Remoção do arquivo intermediário descriptografado | Dado sensível não permanece em disco após criptografia | Acesso indevido ao dump após execução do script |

---

## Verificação de Integridade

- **No backup:** SHA-256 gerado sobre o arquivo `.gpg` e salvo em `.gpg.sha256`
- **Na restauração:** SHA-256 recalculado e comparado antes de descriptografar
- **Se hash divergir:** script aborta com erro — backup corrompido ou adulterado não é restaurado

---

## Retenção e Rotação

| Parâmetro | Valor | Justificativa |
|---|---|---|
| Retenção | 7 backups (7 dias) | Permite recuperar até 1 semana atrás; equilíbrio entre cobertura e espaço em disco |
| Rotação | Automática pelo `backup.sh` | Remove os mais antigos após cada execução bem-sucedida |

---

## Processo de Restauração (`scripts/restore.sh`)

```
1. Lista backups disponíveis em ./backups/ para seleção
2. Verifica integridade via SHA-256 — aborta se divergir
3. Descriptografa com GPG (solicita BACKUP_PASSPHRASE)
4. Descomprime → arquivo .dump temporário
5. Exibe aviso: operador deve parar o backend manualmente antes de confirmar
6. Restaura com pg_restore no container Docker
7. Valida: conta registros em usuario, ocorrencia, log_auditoria
8. Remove o .dump intermediário descriptografado
9. Exibe resumo de registros restaurados por tabela
```

---

## Responsabilidades

| Responsável | Ação |
|---|---|
| ADMINISTRADOR | Executar backup manual quando necessário; executar restauração |
| ADMINISTRADOR | Testar restauração mensalmente em banco isolado |
| Equipe técnica | Manter `BACKUP_PASSPHRASE` segura e documentada fora do repositório |

---

## Limitações Conhecidas (a documentar no relatório)

| Limitação | Risco residual | Recomendação para produção |
|---|---|---|
| Backup armazenado localmente | Falha de hardware no servidor elimina backup e dados simultaneamente | Replicar para storage externo (S3, GCS) ou servidor separado |
| Sem agendamento automático | Backup depende de execução manual ou cron configurado pelo operador | Configurar cron job: `0 2 * * * /path/backup.sh` |
| Sem backup incremental | Cada backup é completo; cresce linearmente com o volume de dados | pg_WAL archiving para volumes grandes |
| Passphrase única | Comprometimento da passphrase expõe todos os backups retidos | Rotação periódica da passphrase + re-criptografia dos backups |

---

## Arquivos a Criar

```
scripts/
  backup.sh
  restore.sh
docs/seguranca/
  politica-backup.md   ← versão publicável (sem detalhes de implementação interna)
.env.example           ← adicionar BACKUP_PASSPHRASE
```

---

## Rastreabilidade com o Adendo

| Requisito do adendo | Como é atendido |
|---|---|
| Especificação da política de backup e recuperação de desastres | Este documento |
| Proteção de dados em repouso | GPG AES-256 nos arquivos de backup |
| Justificativa técnica rastreável | Cada decisão mapeada a risco neste documento |
| Incorporação de AppSec desde as fases iniciais | Política define RPO/RTO, criptografia e verificação de integridade como requisitos, não adicionados depois |
