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
