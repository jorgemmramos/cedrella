# Configurar o Supabase — Cedrella v1.5

## O que é o Supabase?

O Supabase é uma plataforma open-source que fornece uma base de dados PostgreSQL, autenticação e API REST. O plano gratuito suporta até 50 000 linhas e 500 MB — mais do que suficiente para uso pessoal.

---

## Passo 1 — Criar o projecto no Supabase

1. Aceder a [https://app.supabase.com](https://app.supabase.com) e criar conta (gratuita)
2. Clicar em **New Project**
3. Preencher:
   - **Name:** cedrella
   - **Database Password:** (guardar em local seguro)
   - **Region:** escolher a mais próxima (ex: EU West)
4. Aguardar ~2 minutos enquanto o projecto é criado

---

## Passo 2 — Criar as tabelas

1. No painel do projecto, ir a **SQL Editor** → **New query**
2. Copiar todo o conteúdo de [`web/supabase/schema.sql`](../supabase/schema.sql)
3. Colar no editor e clicar **Run**
4. Confirmar que as tabelas `readings`, `plants` e `sensors` aparecem em **Table Editor**

---

## Passo 3 — Obter as credenciais

1. Ir a **Project Settings** → **API**
2. Copiar:
   - **Project URL** (ex: `https://abcxyzabc.supabase.co`)
   - **anon / public key** (começa com `eyJ...`)

---

## Passo 4 — Configurar a app

Editar o ficheiro `web/config.js`:

```js
export const SUPABASE_URL  = 'https://abcxyzabc.supabase.co';  // Project URL
export const SUPABASE_ANON = 'eyJ...';                          // anon key
```

> A chave `anon` é segura para expor — os dados estão protegidos por Row Level Security (cada utilizador vê apenas os seus dados).

---

## Passo 5 — Configurar autenticação (magic link)

O Cedrella usa **magic link** por email — não há palavra-passe. O utilizador introduz o email e recebe um link de acesso.

1. No Supabase, ir a **Authentication** → **URL Configuration**
2. Em **Site URL**, colocar o URL da app:
   - Produção: `https://jorgemmramos.github.io/cedrella/`
   - Local: `http://localhost:3000`
3. Em **Redirect URLs**, adicionar os mesmos URLs
4. Ir a **Authentication** → **Email Templates** → **Magic Link**
5. Personalizar o email se desejado (opcional)

---

## Passo 6 — Deploy com as credenciais

```bash
# Fazer commit das credenciais configuradas
git add web/config.js
git commit -m "config: add Supabase credentials"
git push origin main
```

O GitHub Action faz deploy automático. Em ~2 minutos a app em produção usa o Supabase.

> **Nota:** O `config.js` está incluído no `.gitignore`? Não — as credenciais Supabase anon são seguras para o repositório público. Se preferires manter o repo sem credenciais, podes configurar o `config.js` fora do controlo de versões e fazer deploy manual.

---

## Como funciona a sincronização

| Situação | Comportamento |
|----------|---------------|
| Online + sessão activa | Lê/escreve no Supabase; cache local em IndexedDB |
| Offline | Escreve no IndexedDB; fila de sync para o Supabase |
| Reconecta à internet | Service Worker dispara; escritas pendentes são enviadas |
| Novo dispositivo | Login com o mesmo email; histórico sincronizado automaticamente |

---

## Resolução de problemas

| Problema | Causa provável | Solução |
|----------|---------------|---------|
| "Supabase não está configurado" | `config.js` vazio | Preencher `SUPABASE_URL` e `SUPABASE_ANON` |
| Email de login não chega | Filtro de spam | Verificar pasta de spam; reenviar |
| Dados não sincronizam | RLS não configurado | Correr `schema.sql` de novo |
| "Invalid API key" | Chave errada | Copiar novamente de Project Settings → API |

---

## Sair da sessão

Para terminar a sessão:
1. Abrir a consola do browser (F12)
2. Executar: `localStorage.clear(); location.reload()`

---

## Próximos passos — v2.0

- Notificações push quando a planta precisa de água
- Dashboard multi-planta com comparação
- App Windows nativa (Qt6/QML)
