# Fase 0 — Gate de Evidência · Ciclo v3

**Data:** 28 de julho de 2026
**Executado por:** Claude, via skill `petvida-ciclo-versao`
**Convenção:** toda afirmação marcada `[dado]` (verificada em fonte) ou `[hipótese]` (não verificada)

---

## Achado que muda o ciclo

**A conta Stripe de produção do PetVida (`acct_1TBfBeFuifjisDf4`, "PetVida") tem zero clientes, zero assinaturas e zero cobranças.** `[dado]`

| Consulta | Resultado |
|---|---|
| `GET /v1/customers` | 0 registros |
| `GET /v1/subscriptions` (status=all) | 0 registros |
| `GET /v1/charges` | 0 registros |
| `GET /v1/products` | 2 — "PetVida Pro" e "PetVida Premium", `livemode: true` |
| `GET /v1/prices` | 2 — R$ 14,90/ano e R$ 29,99/ano, BRL, recorrência anual, `livemode: true` |

Os produtos e preços foram criados em **~19–20 de julho de 2026** (timestamps `1784547531` e `1784547562`), ou seja, cerca de **8 dias atrás**. Desde então, nenhuma transação. `[dado]`

### O que isso significa

> ### ✅ RESOLVIDO — resposta do fundador, 28/07/2026
>
> O produto começou a ser divulgado há menos de duas semanas. **Os usuários atuais estão todos no plano gratuito; a ausência de receita é esperada e não é considerada problema neste estágio.** O app foi originalmente construído para uso próprio do fundador.
>
> Combinação das hipóteses 1 e 3 abaixo. A hipótese 2 (receita informal via PIX fora do sistema) está **descartada** — não há reconciliação pendente nem risco de renovação perdida.

A premissa de partida do ciclo era "produto na v2 com clientes pagantes em assinatura B2C". Os dados não sustentavam a parte "pagantes". Três explicações eram possíveis:

1. **Os clientes existem, mas são todos do plano Grátis.** ✅ *Confirmada.*
2. **Os clientes pagaram via PIX/WhatsApp**, pelo fluxo manual em `src/pages/planos/page.tsx` (link `wa.me/5585987436263`), sem passar pelo Stripe. ❌ *Descartada.*
3. **A monetização foi ligada há 8 dias e ainda não converteu ninguém.** ✅ *Confirmada.*

### Consequências para o ciclo

**Receita sai da lista de métricas da v3.** Cobrar foco em conversão num produto de duas semanas seria prematuro.

Mas duas coisas continuam valendo, e uma nova aparece:

- **A medição continua sendo pré-requisito.** Divulgar sem instrumentação não é acelerar — é perder o aprendizado da divulgação. Os visitantes que a campanha trouxer só ensinam alguma coisa se o funil estiver medido.
- **A medição de push continua inegociável.** É o core loop do produto e segue invisível.
- **Novo risco identificado:** o produto foi construído para o próprio fundador. A amostra de usuário que orienta as decisões de produto é **n = 1**. Toda estimativa de alcance (o "Reach" da priorização RICE) é hoje uma projeção da rotina pessoal do fundador com o próprio pet. Isso não invalida o produto — invalida escolher a próxima feature sem falar com tutores reais. Endereçado por `pesquisa-tutores.md`.

---

## 1. Funil de produto

**Status: sem dados.** `[dado]`

A instrumentação existe no código. 10 eventos implementados via `src/lib/analytics.ts`:

`app_opened`, `user_registered`, `first_pet_added`, `reminder_created`, `reminder_completed`, `reminder_skipped`, `health_record_added`, `upgrade_clicked`, `checkout_started`, `checkout_completed` `[dado]`

Mas o pipeline está interrompido em dois pontos verificados:

- `initAnalyticsIfConsented()` (`src/lib/firebase.ts:42`) retorna `null` — abortando toda a telemetria — se `firebaseConfig.measurementId` estiver vazio. `[dado]`
- Não existe `.env` local no projeto; o `VITE_FIREBASE_MEASUREMENT_ID` só é injetado em build via secret do GitHub Actions (`.github/workflows/main.yml:41`). Se esse secret não estiver preenchido, **o build de produção sai sem analytics e falha silenciosamente** — por desenho, o `trackEvent` é no-op quando indisponível. `[dado]`
- Segundo gate: mesmo com `measurementId` correto, nada é registrado sem aceite do banner LGPD. A taxa de aceite é desconhecida. `[hipótese]`

**Verificação pendente (5 minutos, só você pode fazer):** confirmar no GitHub → Settings → Secrets se `VITE_FIREBASE_MEASUREMENT_ID` existe e está preenchido; e no Firebase Console se a propriedade GA4 está vinculada ao projeto `petvid-82a98`.

## 2. Receita e churn

**Status: receita registrada = R$ 0.** `[dado]` (ver seção de abertura)

Churn não é calculável — não há assinatura para cancelar. `[dado]`

Nota positiva: o backend **trata cancelamento corretamente** quando ele existir. `functions/src/subscription-sync.ts` mapeia `canceled`, `incomplete_expired` e `paused` para remoção de acesso, e distingue `past_due`/`unpaid`/`incomplete` como estados que ainda concedem acesso. Há teste de idempotência de webhook. `[dado]` A arquitetura de billing está pronta; o que falta é cliente.

## 3. Retenção

**Status: impossível de calcular.** `[dado]`

Busca por `lastActive`, `last_active`, `lastSeen`, `lastLogin` em `src/` e `functions/src/` retorna **zero ocorrências**. `[dado]`

Não existe nenhum campo de última atividade no documento do usuário. Sem isso não há D1, D7, D30, nem coorte, nem definição de "usuário ativo". Este é o buraco mais caro do produto: **você não consegue distinguir um cliente satisfeito de um cliente que abandonou.**

## 4. Suporte e feedback

**Status: não coletado nesta fase.** `[dado]`

Canais existentes: WhatsApp (`5585987436263`), comentários da página no Facebook, e-mail. Nenhum está agregado em lugar nenhum. Não há sistema de tickets nem caixa de feedback in-app. `[dado]`

**Ação:** exporte as conversas de WhatsApp dos últimos 90 dias e agrupe por tema. É a fonte de sinal mais barata e mais rica que você tem hoje.

## 5. Erros em produção

**Status: taxa de erro desconhecida.** `[dado]`

Busca por `sentry`, `Sentry`, `logrocket` em `src/` e `package.json`: **zero ocorrências.** `[dado]`

Não há captura de exceção do frontend. Um usuário com tela branca no celular dele não gera nenhum sinal do seu lado. `[dado]`

O backend emite log via Cloud Functions (`firebase functions:log`), mas ninguém está olhando de forma sistemática. `[hipótese]`

**Adicional:** as Cloud Functions não emitem nenhum evento de analytics — busca por `logEvent`/`analytics` em `functions/src/` retorna zero. `[dado]` Isso significa que eventos que só o servidor conhece (renovação, falha de cobrança, expiração) são invisíveis na análise de produto.

## 6. Core loop: notificações push

**Status: não medido.** `[dado]`

Busca por `trackEvent`/`logEvent` em `src/lib/notifications.ts` e `public/firebase-messaging-sw.js`: **zero ocorrências.** `[dado]`

Isto merece destaque. A proposta central do PetVida é *"lembrete → notificação → o tutor cuida do pet"*. Esse é o loop que justifica a assinatura. E ele não é medido em nenhum ponto:

- Não se sabe quantos usuários concedem permissão de notificação
- Não se sabe quantas notificações são entregues
- Não se sabe quantas são abertas
- `reminder_completed` existe, mas não há como atribuir a conclusão à notificação

**É inteiramente possível que o core loop do produto esteja quebrado em produção e você não teria como saber.** `[hipótese]` — mas é uma hipótese que custa 6h para eliminar e que invalida todo o resto se for verdadeira.

## 7. SEO e aquisição

**Status: não coletado nesta fase.** `[dado]`

Base técnica pronta e verificada: `public/sitemap.xml`, `public/robots.txt`, JSON-LD via `SeoJsonLd.tsx`, meta tags e Open Graph. `[dado]`

O checklist em `docs/semana-1.md` mostra **Google Search Console não verificado e sitemap não submetido**. `[dado]` Sem isso, não há dado de impressão, clique ou posição.

## 8. Controle de versão

**Status: sem repositório Git nesta pasta.** `[dado]`

Não existe diretório `.git` em `petvida-main/`, apesar de haver `.gitignore` e workflow do GitHub Actions configurado. `[dado]`

Ou o repositório está em outro local no seu computador `[hipótese]`, ou o produto está em produção sem histórico de código e sem rollback. Precisa ser confirmado hoje.

---

## Síntese exigida pela Fase 0

> *"Por que os clientes ficam e por que saem?"*

**Não é possível responder.** Nenhuma das seis fontes de evidência produziu dado utilizável sobre comportamento de cliente. `[dado]`

O que se sabe com certeza: não há cliente pagante registrado em sistema `[dado]`; não há medição de retenção `[dado]`; não há medição do core loop `[dado]`; não há visibilidade de erro `[dado]`.

---

## 🚦 Veredicto do gate: **FECHADO**

Conforme a regra da skill: *"Se ao fim da Fase 0 não houver dados confiáveis, a versão inteira é instrumentação e correção. Não construa features novas às cegas."*

**A v3 não terá nenhuma funcionalidade nova.**

---

## Escopo resultante da v3 — tema: "Ver antes de construir"

Ordenado por dependência, não por esforço. Os itens 0 e 1 destravam todos os outros.

| # | Item | Esforço | Destrava |
|---|---|---|---|
| 0 | **Responder: os clientes atuais são grátis, PIX/WhatsApp, ou não existem?** Se PIX: planilha com plano, data de pagamento e data de renovação | 1h | Toda a leitura de receita |
| 1 | Confirmar/criar repositório Git e fazer push | 1h | Rollback — pré-requisito de tudo |
| 2 | Confirmar secret `VITE_FIREBASE_MEASUREMENT_ID` + propriedade GA4 vinculada + validar no DebugView | 2h | Os 10 eventos que já existem |
| 3 | Sentry free tier no frontend | 2h | Visibilidade de churn por bug |
| 4 | Campo `lastActiveAt` no doc do usuário + evento de sessão | 4h | D1/D7/D30 e coortes |
| 5 | Instrumentar push: permissão concedida, entrega, abertura, atribuição a `reminder_completed` | 6h | Validação do core loop |
| 6 | Eventos de servidor nas Functions: renovação, falha de cobrança, cancelamento | 3h | Churn mensurável |
| 7 | Verificar domínio no Search Console + submeter sitemap | 1h | Dado de aquisição orgânica |
| 8 | Pesquisa com os usuários atuais (Tally/Forms enviado por WhatsApp, 5 perguntas) | 3h | Sinal qualitativo em 1 semana |
| 9 | Corrigir `banco_de_funcionalidades_app_pets.md` — remove lojas de app, remove funcionalidades inexistentes, adiciona as reais | 1h | Divulgação honesta |

**Total: ~24h** ao longo de 10 semanas.

### Métrica de sucesso da v3

Ao fim do ciclo, estas quatro perguntas devem ter resposta numérica:

1. De cada 100 cadastros, quantos continuam ativos em 30 dias?
2. Qual percentual dos lembretes criados é efetivamente concluído?
3. Que percentual dos usuários concede permissão de notificação, e qual a taxa de abertura?
4. Quantas pessoas visitaram a página de planos, e quantas iniciaram checkout?

**Alvo:** não é um número de produto, é a existência dos números. Se ao fim da v3 você ainda estiver respondendo "acho que", a v3 falhou.

### Fora de escopo — vai para o backlog da v4

Busca de clínicas próximas, Alerta SOS de pet perdido, revisão de precificação, aplicativo nativo nas lojas, qualquer feature de produto.

**Sobre precificação:** os preços atuais (R$ 14,90 e R$ 29,99/ano, ou R$ 1,24 e R$ 2,50/mês) são provavelmente baixos demais para sustentar o negócio. Mas com zero conversões registradas, **não há dado para justificar mudança de preço agora** — mudar o preço às cegas apenas troca um palpite por outro. Isso é decisão da v4, com os dados da v3 na mão.

---

## Próxima etapa

**Fase 1 — Diagnóstico e priorização**, na semana 2. Como o gate fechou, a Fase 1 será curta: o escopo já está determinado acima. Rode `operations:risk-assessment` sobre os itens 4, 5 e 6 (os que tocam código) antes de começar a construir na Fase 3.

---

### Fontes

- Stripe API (conta `acct_1TBfBeFuifjisDf4`): `/v1/customers`, `/v1/subscriptions`, `/v1/charges`, `/v1/products`, `/v1/prices`
- Código-fonte: `src/lib/analytics.ts`, `src/lib/firebase.ts`, `src/lib/notifications.ts`, `src/pages/planos/page.tsx`, `functions/src/subscription-sync.ts`, `public/firebase-messaging-sw.js`
- Configuração: `.env.example`, `.github/workflows/main.yml`, `package.json`
- Documentos internos: `docs/semana-1.md`, `CLAUDE.md`, `banco_de_funcionalidades_app_pets.md`

**Não consultado nesta fase** (exige suas credenciais): Firebase Console, Google Analytics 4, Google Search Console, histórico de WhatsApp.
