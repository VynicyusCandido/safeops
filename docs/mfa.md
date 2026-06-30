# Estudo sobre Autenticação Multifator (MFA) - TOTP

Este documento foi criado para ajudar no entendimento da implementação de MFA no projeto SafeOps.

## O que vai acontecer na implementação?

Para tornar o MFA real (não apenas uma interface no frontend), nós utilizaremos o protocolo **TOTP (Time-Based One-Time Password)**. Esse é o padrão usado pelo aplicativo **Google Authenticator**, Authy, entre outros.

**Fluxo de Configuração (Setup):**
1. O usuário entra no sistema e clica em "Ativar MFA".
2. O Backend gera um **Segredo (Secret)** aleatório para esse usuário (ex: `JBSWY3DPEHPK3PXP`) e salva no banco de dados na coluna `mfa_secret`.
3. O Backend retorna uma URL que o Frontend usa para desenhar um **QR Code**.
4. O usuário escaneia o QR Code com o Google Authenticator.

**Fluxo de Login (Verificação):**
1. O usuário digita E-mail e Senha.
2. O Backend percebe que a senha está correta, mas vê no banco de dados que `mfa_enabled = true`.
3. Em vez de enviar o JWT completo autorizando o acesso, o Backend retorna um erro dizendo: `"Falta o MFA!"` (ou uma exceção chamada `MfaRequiredException`).
4. O Frontend entende o erro, não deixa o usuário entrar, e mostra a tela pedindo os 6 dígitos.
5. O usuário digita os 6 dígitos do app e clica em Confirmar.
6. O Frontend envia os 6 dígitos. O Backend compara se o código digitado bate com o segredo salvo. Se sim, ele libera o Token JWT!

## Precisa de E-mail de Autenticação?

**Não!** O método TOTP é diferente do método em que você recebe um código por e-mail ou SMS.

Com o TOTP (Google Authenticator), todo o processo acontece **offline no seu celular**. O aplicativo Google Authenticator pega o "Segredo" que leu no QR Code e usa a "Hora atual do relógio" para gerar os 6 dígitos através de uma fórmula matemática. O backend do Spring Boot faz **exatamente o mesmo cálculo** na hora exata que você tenta logar. Se os números baterem, o acesso é liberado. 

Por isso é muito mais rápido e seguro que e-mail: se o provedor de e-mail cair ou houver atraso, o usuário ainda consegue logar na mesma hora!

## E como o aplicativo não serve para qualquer e-mail?
Para que outra pessoa conseguisse gerar o código válido para o seu e-mail, ela precisaria da sua "Chave Secreta" Única. 

Quando você clica em "Ativar MFA", o sistema gera uma senha (a Chave Secreta) exclusiva para o seu usuário. Essa chave é enviada para o seu celular apenas uma vez através do QR Code inicial. O aplicativo Google Authenticator não faz ideia de qual é essa sua chave, a menos que você escaneie o código. 

Os 6 dígitos são como o resultado de uma equação matemática: `Chave Secreta + Hora Atual = 6 Dígitos`. Como a outra pessoa não tem a sua "Chave Secreta", a equação dela sempre dará um resultado errado! Além disso, o aplicativo funciona 100% offline e de forma anônima, sem vincular a sua conta de e-mail do Gmail ao nosso sistema.

## O que foi alterado no código para fazer o MFA funcionar?

**No Backend (Spring Boot):**
1. **Dependência Adicionada**: Inserimos a biblioteca `totp` (`dev.samstevens.totp`) no `pom.xml`. É ela quem faz o trabalho de gerar a Chave Secreta e o QR Code, além de verificar se o código de 6 dígitos está correto usando o algoritmo baseado no tempo.
2. **Banco de Dados e Entidade**: Criamos um script no Liquibase (`db.changelog_05_add_mfa_columns.sql`) para adicionar as colunas `mfa_secret` e `mfa_enabled` na tabela `usuario`. Atualizamos também a entidade `Usuario.java` para refletir essas colunas.
3. **Serviço de Autenticação (`AuthService.java`)**: 
   - Adicionamos a função `generateMfaSecret()` para gerar a Chave Secreta única para cada usuário.
   - Adicionamos a função `verifyMfaCode(secret, code)` que usa o horário atual do servidor para calcular o token esperado e comparar com o que o usuário digitou.
   - Modificamos a função principal de `login()`. Agora, se o banco acusar que o usuário tem `mfaEnabled = true`, o backend barra o login inicial e exige a validação do código de 6 dígitos antes de liberar o Token JWT.
4. **Controllers e Testes (`AuthController.java` / `AuthControllerTest.java`)**:
   - Ajustamos a troca de senha obrigatória (que ocorre no primeiro acesso de um usuário novo). Antes, ao trocar a senha, o usuário já era logado automaticamente. Alteramos isso para **não** devolver o cookie logado; forçando o usuário a passar pela tela de login regular, onde o MFA será exigido e configurado. Os testes também foram atualizados para refletir essa quebra.
5. **Tratamento de Exceções**: Criamos a `MfaRequiredException`, uma exceção específica para o Spring sinalizar de forma clara ao Frontend que a autenticação parou na etapa do MFA.

**No Frontend (React/Next.js):**
1. **Tela de Login (`page.tsx`)**: Transformamos a página em um "fluxo" de etapas. Se a API pede o MFA, a tela oculta os inputs de E-mail/Senha e passa a renderizar o QR Code (para configuração inicial) ou apenas o input de 6 dígitos.
2. **Serviços e Estado (`auth-service.ts` / `auth-store.ts`)**: Adicionamos a propriedade opcional `mfaCode` na requisição de login. O Zustand (`auth-store.ts`) foi adaptado para armazenar se o fluxo atual está em fase de exigência de MFA ou não.

### Atualização Recente: Geração e Setup do QR Code no Primeiro Login
Para garantir que o usuário veja e escaneie o QR Code no seu primeiro acesso após trocar a senha provisória, incluímos as seguintes lógicas:
- **Exceção de Setup (`MfaSetupRequiredException`)**: Criada para interceptar logins sem MFA e transportar a imagem do QR Code.
- **Desenho do QR Code (`AuthService.java`)**: Caso o usuário tenha `mfa_enabled = false`, o backend usa a classe `ZxingPngQrGenerator` (da lib TOTP) para transformar a chave secreta num QR Code em Base64 e forçar o envio disso para o frontend.
- **Renderização na Tela (`page.tsx`)**: O Next.js detecta o erro `MFA_SETUP_REQUIRED`, captura a imagem em Base64, desenha o código de barras na interface e exige que os 6 dígitos gerados pelo Autenticador sejam inseridos antes de liberar o acesso total.
