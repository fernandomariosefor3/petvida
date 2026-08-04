# PetVida Care — Plano de Implementação v3

> Documento auto-suficiente. Entregue direto a um agente de código (Claude Code / Codex).
> Nenhum contexto externo é necessário.

---

## 1. Contexto

**Produto:** PetVida Care — web app (PWA) para tutores gerenciarem saúde e rotina de pets.
**URL:** https://petvida.net.br
**Raiz do código:** `petvida-main/`

**Stack:** React 19 + TypeScript + Vite + Tailwind 3 + react-router 7
**Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions, FCM) — projeto `petvid-82a98`
**Pagamento:** Stripe via Cloud Functions + fallback manual PIX/WhatsApp
**Deploy:** automático via GitHub Actions (`.github/workflows/main.yml`) em todo push para `main` — o job `deploy` roda depois que `validate` e `validate-functions` passam, usando `FirebaseExtended/action-hosting-deploy` (`channelId: live`, projeto `petvid-82a98`). **Deploy manual (`firebase deploy`) é proibido:** um build local publicado sem as mesmas variáveis de ambiente do CI (por exemplo `VITE_FIREBASE_VAPID_KEY` ausente) desliga notificações push para todos os usuários.

**Estado do negócio:** ~2 semanas de divulgação. Usuários no plano grátis. Zero assinantes pagantes (verificado na API do Stripe). Receita não é métrica desta versão.

**Objetivo da v3:** tornar o produto mensurável e fazer o lembrete chegar de fato. **Nenhuma funcionalidade nova de produto além da trilha B.**

---

## 2. Regras invioláveis

1. Altere **somente** o que a tarefa pede. Sem refatoração espontânea, sem "melhorias" não solicitadas.
2. **Não toque sem pedido explícito:** `.env`, `src/lib/firebase.ts`, `firestore.rules`, `storage.rules`, `src/contexts/auth/AuthContext.tsx`, `src/router/`, `vite.config.ts`, `tailwind.config.ts`, `package.json`.
   - As tarefas 5 e 7 abaixo exigem tocar em arquivos desta lista. Elas dizem isso explicitamente e só devem ser feitas com autorização.
3. Ao final de **cada** tarefa: `npm run lint && npm run type-check && npm run build`. Não prossiga com erro.
4. Telemetria nunca pode quebrar ou bloquear a aplicação. Sempre `try/catch` silencioso ou no-op.
5. Não altere o comportamento do plano gratuito para forçar upgrade.

---

## 3. Já implementado — NÃO refazer

Estas mudanças já estão no código. Confira antes de começar; se estiverem presentes, pule.

| Arquivo | Estado |
|---|---|
| `src/lib/pushTracking.ts` | ✅ novo — lê `?src=push&rtype=` da URL, dispara `push_opened`, limpa os params |
| `src/lib/activity.ts` | ✅ novo — grava `users/{uid}.lastActiveAt`, throttle de 6h via localStorage |
| `src/components/feature/ActivityTracker.tsx` | ✅ novo — componente que renderiza `null` e chama `pingUserActivity` |
| `src/lib/notifications.ts` | ✅ editado — dispara `push_permission_prompted`, `push_permission_result`, `push_received_foreground` |
| `public/firebase-messaging-sw.js` | ✅ editado — `notificationclick` abre `/reminders?src=push&rtype=...`; `CACHE_NAME` → `petvida-cache-v2` |
| `src/App.tsx` | ✅ editado — chama `reportPushOpenFromUrl()` e renderiza `<ActivityTracker />` |
| `banco_de_funcionalidades_app_pets.md` | ✅ reescrito — removidas afirmações falsas |

**Pendência:** esse código **nunca foi compilado**. A primeira ação é validar (tarefa 1).

---

## 4. Tarefas

### Tarefa 1 — Validar o que já existe
**Prioridade:** primeira, sempre.

```bash
cd petvida-main
npm install
npm run lint
npm run type-check
npm run build
```

Corrija o que quebrar. Não avance com erro.

**Aceite:** os três comandos passam limpos.

---

### Tarefa 2 — Confirmar repositório Git
**Por quê:** produto no ar sem histórico de código não tem rollback.

- Verifique se existe `.git/` em `petvida-main/`.
- Se **existir** e tiver remoto: faça commit e push das mudanças. Fim.
- Se **não existir**: **pergunte ao usuário antes de rodar `git init`** — o `.gitignore` menciona histórico anterior, então provavelmente há um repositório em outro local. Criar um segundo seria erro.

**Aceite:** mudanças versionadas e enviadas ao remoto correto.

---

### Tarefa 3 — Ativar o Google Analytics 4 ✅ concluída
**Por quê:** existem 10 eventos instrumentados no código que hoje não registram nada.

**Status (28/07/2026):** `.env` local com `VITE_FIREBASE_MEASUREMENT_ID=G-SNLJF200H3` e as demais chaves Firebase. Secrets no GitHub Actions confirmados via `gh secret list`: `VITE_FIREBASE_MEASUREMENT_ID` e `VITE_FIREBASE_VAPID_KEY` já existem. `lint`, `type-check` e `build` locais passam limpos.

**Nota importante:** um secret criado ou atualizado no GitHub só entra em vigor no **próximo build que rodar depois da criação** — builds do CI disparados antes de o secret existir não o carregam. Como o deploy é automático (via push para `main`), o próximo push já publica com os valores corretos.

**Restante:** depois que o deploy automático publicar, abrir o site, aceitar o banner de cookies e confirmar `app_opened`/`user_registered` no **Relatório em Tempo Real** (ou DebugView) do GA4.

Causa raiz: `initAnalyticsIfConsented()` em `src/lib/firebase.ts` retorna `null` se `firebaseConfig.measurementId` estiver vazio. Não existe `.env` local — a variável só entra em build pelo secret do GitHub Actions.

**Passos (exigem o usuário):**
1. Firebase Console → projeto `petvid-82a98` → Configurações → Integrações → ativar Google Analytics. Copiar o `measurementId` (`G-XXXXXXXXXX`).
2. GitHub → Settings → Secrets and variables → Actions → conferir/criar `VITE_FIREBASE_MEASUREMENT_ID`.
3. Criar `.env` local com a mesma variável (para dev). **Não commitar** — já coberto pelo `.gitignore`.
4. Build + deploy.
5. Abrir o site, aceitar o banner de cookies, confirmar os eventos no **DebugView** do GA4.

**Aceite:** `app_opened` e `user_registered` aparecem no DebugView.

---

### Tarefa 4 — Verificar o Google Search Console
1. https://search.google.com/search-console → Adicionar propriedade → **Domínio** → `petvida.net.br`
2. Adicionar o registro TXT no provedor do domínio (Registro.br)
3. Submeter `https://petvida.net.br/sitemap.xml`

**Aceite:** propriedade verificada e sitemap com status de sucesso.

---

### Tarefa 5 — Instalar o Sentry
**Por quê:** hoje, um usuário com tela branca no celular não gera nenhum sinal.

⚠️ **Altera `package.json`. Pedir autorização antes.**

1. Criar projeto React gratuito em sentry.io e copiar o DSN.
2. `npm install @sentry/react`
3. Inicializar em `src/main.tsx`, lendo o DSN de `VITE_SENTRY_DSN`. Se a variável estiver vazia, **não inicializar** (dev não deve poluir o Sentry).
4. Adicionar `VITE_SENTRY_DSN` ao `.env`, ao `.env.example` e aos secrets do GitHub Actions.
5. Definir `tracesSampleRate: 0.1` e `environment: import.meta.env.MODE`.

**Aceite:** erro forçado em produção aparece no painel do Sentry.

---

### Tarefa 6 — Rodar a pesquisa com tutores
**Não é código.** Roda em paralelo com as tarefas acima. Destrava (ou cancela) a Tarefa 8.

Falar com **15 a 25 tutores** no WhatsApp. Não usar amigos e família — eles respondem para agradar.

**Perguntas:**
1. Nos últimos 12 meses, você esqueceu ou atrasou alguma vacina, vermífugo ou antipulga do seu pet?
2. Hoje usa alguma coisa para lembrar disso? App, alarme, papel, a clínica avisa, ou nada?
3. Quando um app manda notificação, você vê na hora, vê depois, ou nem repara? E se chegasse no WhatsApp, mudaria?
4. Existe um app que guarda a carteirinha e avisa **no WhatsApp** na data. Básico grátis; o aviso por WhatsApp custa **R$ 14,99 por ano, pago de uma vez**. Sinceramente: você pagaria, ou acharia que não vale?
5. *(só para quem disse que pagaria)* Quer entrar na lista dos primeiros? Me manda seu e-mail.

**A pergunta 5 é o dado real.** Quem diz "pagaria" mas não manda o e-mail respondeu por educação. Registre a taxa.

**Critérios — escreva o veredicto antes de ver as respostas:**

| Resultado | Decisão |
|---|---|
| ≥60% esqueceram **e** ≥50% não veem push **e** ≥30% dos "pagaria" mandaram e-mail | ✅ Construir a Tarefa 8 completa |
| 2 dos 3 critérios | ⚠️ Versão mínima: WhatsApp só para vacina e vermífugo |
| <40% esqueceram **ou** <20% mandaram e-mail **ou** maioria diz que a clínica já avisa | ❌ Cancelar a Tarefa 8 |

Se cancelar, o próximo candidato é **compartilhar a carteirinha com o veterinário e com um 2º tutor**.

---

### Tarefa 7 — Reestruturar os planos: de 3 para 2
**Por quê:** você tem zero assinantes. É o momento mais barato que existirá para mudar.

⚠️ **Toca billing e `src/types`. Pedir autorização e ter plano de rollback antes.**

**Estrutura alvo:**

| Recurso | Grátis | Pago — R$ 14,99/ano |
|---|---|---|
| Pets | **ilimitado** | ilimitado |
| Lembretes por pet | ilimitado | ilimitado |
| Carteirinha e histórico | ✓ | ✓ |
| Foto do pet | ✓ | ✓ |
| Lembrete por push | ✓ | ✓ |
| Lembrete por WhatsApp | ✗ | ✓ *(Tarefa 8)* |
| Export em PDF | ✗ | ✓ |
| Compartilhar com veterinário / 2º tutor | ✗ | ✓ *(v4)* |

**Duas decisões deliberadas:**
- **Pets ilimitados no grátis.** Limitar a 3 não converte — a maioria tem 1 ou 2 e nunca encosta no teto, e quem tem 5 desiste antes de virar usuário. Cobre-se pela *entrega* e pelo *compartilhamento*, não pela quantidade.
- **R$ 14,99, não R$ 9,99.** Mensagem de WhatsApp custa ~R$ 0,04–0,05. Um usuário pesado consome ~R$ 6,48/ano. A R$ 9,99 o usuário mais engajado vira o menos rentável.

**Passos:**
1. `src/types` — reduzir `Plan` para `'free' | 'pro'`, atualizar `PLAN_LIMITS`. `maxPets` e `maxRemindersPerPet` viram `UNLIMITED` nos dois planos; `exportData` só no pago.
2. Firestore, coleção `plans/` — atualizar via `functions/scripts/seed-plans.mjs`.
3. Stripe — criar preço de R$ 14,99/ano e **desativar** os antigos (`price_1TvFX6FuifjisDf4mM21ORm7` R$14,90 e `price_1TvFXbFuifjisDf4x3FdZ2R4` R$29,99). Atualizar `functions/.env.petvid-82a98`.
4. `src/pages/planos/page.tsx` — layout de 2 colunas.
5. Revisar `functions/src/plan-resolution.ts` e `subscription-sync.ts` para o plano removido.
6. Rodar os testes: `cd functions && npm test`.

**Aceite:** checkout completo funciona em modo teste do Stripe; usuário existente no plano `premium` não perde acesso.

---

### Tarefa 8 — Lembrete por WhatsApp
**🔒 BLOQUEADA até a Tarefa 6 devolver resultado. Não comece antes.**

Diferencial central da v3: **o app cujo lembrete efetivamente chega.** Push em PWA no iOS é frágil; WhatsApp no Brasil tem alcance que push não tem. E como a mensagem custa dinheiro, um concorrente gratuito não consegue copiar em escala.

| # | Item | Detalhe |
|---|---|---|
| 8.1 | Conta WhatsApp Business API + verificação de negócio no Meta | ~1 semana de espera |
| 8.2 | Template de **utilidade** aprovado (lembrete de vacina/vermífugo) | Categoria utilidade, não marketing — muito mais barata |
| 8.3 | Cloud Function agendada de disparo, com deduplicação | Nova, em `functions/src/` |
| 8.4 | Opt-in explícito + registro do consentimento (data e origem) | **Obrigatório LGPD** e exigência do Meta |
| 8.5 | Limite de mensagens por usuário/mês, com corte automático | Sugestão: 10/mês por pet |
| 8.6 | Eventos: `whatsapp_sent`, `whatsapp_delivered`, e conclusão atribuída ao canal | Para comparar com push |

**Restrições:**
- Enviar sem opt-in registrado viola LGPD e derruba a conta no Meta.
- Sem o limite de 8.5, um usuário com muitos pets custa mais do que paga.
- Push continua funcionando no plano grátis. WhatsApp é **adicional**, não substituto.

**Aceite:** lembrete chega no WhatsApp; taxa de abertura comparável à do push no painel.

---

## 5. Métricas de sucesso da v3

Ao final, estas perguntas devem ter resposta **numérica**:

1. Que % dos usuários concede permissão de notificação? *(evento `push_permission_result`)*
2. Desses, que % **não** está com o PWA instalado? *(campo `standalone` do mesmo evento — é o número que revela se o push morre no iOS)*
3. Que % das notificações é aberto? *(evento `push_opened`)*
4. De cada 100 cadastros, quantos seguem ativos em 30 dias? *(campo `lastActiveAt`)*
5. Qual a razão `reminder_completed / reminder_created`?
6. *(se a Tarefa 8 rodar)* Abertura via WhatsApp vs. via push — **alvo: WhatsApp ≥ 2× push**

O alvo não é um número bom. É a **existência** dos números. Se ao final você ainda responder "acho que", a v3 falhou.

**Limitação conhecida:** taxa de entrega real do push não é mensurável pelo cliente. Só existe do lado do FCM — exige ativar o export para BigQuery no console do Firebase.

---

## 6. Ordem de execução

| Semana | Fazer |
|---|---|
| 1 | Tarefas 1, 2, 3 · iniciar a Tarefa 6 (pesquisa) |
| 2 | Tarefas 4, 5 · ler resultado da pesquisa → **liberar ou cancelar a Tarefa 8** |
| 3 | Tarefa 7 (planos) · 8.1 e 8.2 se liberada (são espera, não código) |
| 4–7 | Tarefa 8: 8.3 a 8.6 |
| 8 | Congelamento de escopo. O que não ficou pronto é cortado, não empurrado. |
| 9 | Validação e deploy |
| 10 | Medição e retrospectiva |

**Tarefas 6 e 8.1/8.2 são espera, não trabalho.** Rodam em paralelo sem custo de cronograma.

---

## 7. Fora de escopo — backlog da v4

Compartilhamento com veterinário e 2º tutor · link público de emergência · acesso offline da carteirinha · busca de clínicas 24h · alerta SOS de pet perdido · app nativo nas lojas · revisão de preço com dado real · testes automatizados de frontend.

---

## 8. Checklist antes do deploy

- [ ] `npm run lint && npm run type-check && npm run build` limpos
- [ ] `cd functions && npm test` passando
- [ ] `bash scripts/smoke-test.sh`
- [ ] Fluxo manual em janela anônima: cadastro → login → criar pet → criar lembrete → concluir
- [ ] Testado em celular real, não só no DevTools
- [ ] Banner de cookies e consentimento LGPD ainda funcionando
- [ ] Eventos novos confirmados no DebugView do GA4
- [ ] Fluxo do plano **grátis** testado — é onde está a maioria dos usuários
- [ ] Se billing foi tocado: checkout testado em modo teste do Stripe
- [ ] Plano de rollback escrito

Deploy: commit + push para `main`; acompanhar o workflow na aba **Actions** do repositório (jobs `validate` → `validate-functions` → `deploy`). **Nunca rode `firebase deploy` manualmente** — o CI já publica com as variáveis de ambiente corretas.

Depois: abrir em janela anônima, confirmar carregamento e login, acompanhar `firebase functions:log` por 24h.

---

## 9. Risco a manter em vista

O app foi construído pelo fundador para uso próprio. A amostra de usuário que orienta as decisões de produto é **n = 1**. Toda estimativa de "quantos usuários querem isso" é hoje uma projeção da rotina pessoal dele com o próprio pet.

Isso não invalida o produto — invalida escolher a próxima funcionalidade sem falar com tutores reais. É o motivo da Tarefa 6 existir, e o motivo de a Tarefa 8 estar bloqueada por ela.
