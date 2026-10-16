# Política de Privacidade — Fluxa (MINUTA)

> Minuta gerada em 2026-10-16 a partir do código atual do app
> (entidades `User`, `RefreshToken`, `PasswordResetToken`,
> `EmailVerificationToken`, cookies HttpOnly, logs).
> **Não é texto jurídico final — pendente revisão de advogado antes de publicar.**
> Protótipos navegáveis: `/privacy` e `/terms` no frontend.

## 1. Quem trata seus dados

Fluxa, aplicação de gestão financeira pessoal (projeto em MVP).
Canal de privacidade: **[definir e-mail de contato]** (TODO antes de publicar).

## 2. Quais dados coletamos

| Dado | Onde | Finalidade |
|---|---|---|
| Nome | Cadastro (`users.name`, até 100 chars) | Identificar sua conta |
| E-mail | Cadastro (`users.email`, único) | Login, recuperação de senha, verificação de conta |
| Hash da senha (Argon2 — nunca a senha em texto) | `users.password_hash` | Autenticação |
| Status de verificação de e-mail | `users.verified` | Saber se a conta foi confirmada |
| Transações, categorias e compras parceladas que você registra | Tabelas do app | Funcionalidade central (dashboard, insights, contas a pagar) |
| Tokens de sessão (hash + expiração + revogação) | `refresh_tokens` | Manter você logado com segurança |
| Tokens de reset/verificação (hash + expiração + uso) | `password_reset_tokens`, `email_verification_tokens` | Recuperar senha e confirmar e-mail |
| Cookies estritamente necessários (`access_token`, `refresh_token`, HttpOnly, sem acesso via JS) | Navegador | Sessão; **não há cookies de terceiros, analytics ou publicidade** |
| E-mail em logs operacionais (sem senhas/tokens) | Logs do backend | Diagnóstico e segurança |

**Não coletamos:** localização, contatos, documentos (CPF/RG), dados bancários
(senhas de banco, número de cartão) — o app registra apenas os lançamentos
que você digita.

## 3. Compartilhamento

Seus dados ficam no banco da aplicação (Supabase em produção) e trafegam pela
infraestrutura de hospedagem (Railway = API, Vercel = site). Não vendemos,
alugamos nem compartilhamos seus dados com anunciantes. Sem decisão
automatizada nem perfilamento.

## 4. Segurança

- Senhas com hash Argon2; tokens armazenados como hash com expiração e revogação.
- Sessão em cookies HttpOnly (`Secure` + `SameSite=Lax` em produção).
- Rate limiting contra força bruta no login/cadastro/recuperação.
- Revisão de logs sem segredos (Sprint 7.7).

## 5. Seus direitos (LGPD, art. 18)

Confirmação, acesso, correção, anonimização/bloqueio/eliminação,
portabilidade, informação sobre compartilhamento e revogação do consentimento.
Exercício pelo canal do item 1. Conta e dados podem ser excluídos a pedido —
a exclusão remove lançamentos vinculados após confirmação em tela.

## 6. Retenção

Mantemos seus dados enquanto a conta existir. Tokens expirados/revogados e
logs operacionais são descartados em rotina. Conta excluída = dados pessoais
removidos; registros anonimizados de auditoria, se houver, sem vínculo com você.

## 7. Mudanças

Versão publicada em `/privacy` no app; mudanças relevantes serão avisadas
na aplicação. Última atualização desta minuta: 2026-10-16.
