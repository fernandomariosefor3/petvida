# PetVida Care 🐾

Web app (PWA) para tutores gerenciarem a saúde e a rotina dos seus pets — carteirinha digital, lembretes, histórico e alertas.

**Domínio:** [petvida.net.br](https://petvida.net.br)

---

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 3 + react-router 7
- **Backend:** Firebase (Auth, Firestore, Storage, Cloud Functions, FCM)
- **Pagamentos:** Stripe (checkout via Cloud Functions)
- **CI/CD:** GitHub Actions — deploy automático em push para `main`
- **Hospedagem:** Firebase Hosting (projeto `petvid-82a98`, canal `live`)

---

## Funcionalidades

- Carteirinha digital e histórico de saúde (vacinas, consultas, exames, cirurgias, peso)
- Lembretes de vacina, consulta, medicamento e banho com notificação push
- Alerta de lembretes atrasados
- Evolução de peso com gráfico
- Múltiplos pets com perfil completo (foto, raça, microchip, castração, tipo sanguíneo, alergias)
- Comparação entre pets
- Export do histórico em PDF (plano pago)
- i18n (português/inglês)
- PWA instalável (funciona offline com service worker)
- Política de privacidade e termos LGPD com banner de consentimento
- Proteção de rotas e Firestore/Storage Rules por usuário

**Planos:** Grátis · Pro · Premium (detalhes em `src/types/index.ts`).

---

## Requisitos

- Node.js 20+
- Firebase CLI (`npm install -g firebase-tools`) — apenas para emulador e testes locais de Functions
- Conta Firebase com o projeto `petvid-82a98` configurado

---

## Desenvolvimento local

```bash
npm install
npm run dev
# → http://localhost:5173
```

O app lê as chaves Firebase de um arquivo `.env` na raiz (veja `.env.example`). Variáveis ausentes desligam a funcionalidade correspondente em dev — isso é por desenho.

Cloud Functions e testes com emulador Firestore:

```bash
cd functions
npm install
npm test          # testes unitários + emulador Firestore + firestore.rules
```

---

## Validação

Antes de todo commit, os três comandos precisam passar limpos:

```bash
npm run lint
npm run type-check
npm run build
```

O CI roda exatamente esses três mais os testes das Functions em todo push e pull request.

---

## Deploy

**Deploy é automático via CI.** Todo push para `main` dispara o workflow `.github/workflows/main.yml`:

1. `validate` — lint, type-check e build do frontend
2. `validate-functions` — build e testes das Cloud Functions
3. `deploy` — publica no Firebase Hosting (somente após os dois primeiros passarem)

**Nunca rode `firebase deploy` manualmente.** Um build local sem as mesmas variáveis de ambiente do CI (ex.: `VITE_FIREBASE_VAPID_KEY` ausente) desliga notificações push para todos os usuários. Para publicar: commit + push para `main` e acompanhe o workflow na aba **Actions**.

---

## Variáveis de ambiente

As chaves entram no build pelo CI (GitHub Secrets) e em dev pelo `.env` local. Não commite o `.env`.

| Variável | Obrigatória em prod | Uso |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | sim | Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | sim | Firebase |
| `VITE_FIREBASE_PROJECT_ID` | sim | Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | sim | Firebase |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | sim | Firebase |
| `VITE_FIREBASE_APP_ID` | sim | Firebase |
| `VITE_FIREBASE_MEASUREMENT_ID` | sim | Google Analytics |
| `VITE_FIREBASE_VAPID_KEY` | sim | Push (FCM) |
| `VITE_SITE_URL` | sim | URL canônica/SEO |

---

## Estrutura do projeto

```
src/
├── components/        # componentes reutilizáveis
├── contexts/          # auth e data contexts
├── i18n/              # traduções
├── lib/               # firebase, notifications, activity, pushTracking
├── pages/             # rotas (dashboard, pets, reminders, planos, billing, ...)
├── router/            # definição das rotas
└── types/             # tipos e limites dos planos
functions/src/         # Cloud Functions (billing, subscription-sync, plan-resolution)
docs/                  # documentação do produto e ciclos
.github/workflows/     # CI/CD
```

---

## Documentação

- `docs/PLANO-V3.md` — plano de implementação da v3 (tarefas e regras)
- `docs/banco_de_funcionalidades_app_pets.md` — fonte de verdade para divulgação
- `docs/ciclos/v3/` — diagnóstico, escopo e pesquisa com tutores

© 2026 PetVida Care. Todos os direitos reservados.
