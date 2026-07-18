# Changelog - Sprint 1 (v2.0)

## Data: 18/07/2026

---

## Features Implementadas

### 🎁 Sistema de Planos com Stripe (F1.1, F1.2)

**Novos arquivos:**
- `src/lib/plans.ts` - Configuração centralizada de planos (Free/Premium)
- `src/lib/stripe.ts` - Cliente Stripe para checkout
- `src/pages/planos/page.tsx` - Nova página de planos com checkout real
- `src/pages/checkout-success/page.tsx` - Página de sucesso com verificação
- `functions/src/index.ts` - Cloud Functions para webhook Stripe
- `functions/package.json` - Dependências das Functions
- `functions/tsconfig.json` - TypeScript config das Functions

**Melhorias:**
- Checkout com Stripe Checkout Sessions (redirect)
- Webhook para ativar plano automaticamente após pagamento
- Customer Portal para gerenciar assinatura
- Verificação agendada de assinaturas expiradas
- Fallback para pagamento via WhatsApp

**Variáveis de ambiente adicionadas:**
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_SECRET_KEY=sk_test_... (backend only)
STRIPE_WEBHOOK_SECRET=whsec_... (backend only)
```

---

### 🚀 CI/CD Melhorado (F5.1)

**Arquivo alterado:**
- `.github/workflows/main.yml`

**Melhorias:**
- Job de validação separado (lint + type-check)
- Validação roda em todos os PRs
- Build só roda após validação passar
- Deploy só roda em pushes para main
- Cache de npm para builds mais rápidos
- Artifacts compartilhados entre jobs
- Secrets para Stripe adicionados

**Novo workflow:**
1. `validate` - ESLint + TypeScript check (sempre)
2. `build` - npm build (só em push para main)
3. `deploy` - Firebase Hosting (após build)

---

### 📱 PWA Setup (F2.2)

**Novos arquivos:**
- `public/manifest.json` - Manifesto PWA com ícones e atalhos
- `public/sw.js` - Service Worker para cache e notificações
- `public/icons/icon.svg` - Template SVG do ícone
- `index.html` - Atualizado com meta tags PWA

**Funcionalidades PWA:**
- App instalável na tela inicial
- Cache de assets estáticos
- Fallback offline
- Shortcuts na home screen
- Notificações push (preparado)
- Background sync (preparado)

**Meta tags adicionadas:**
- theme-color, apple-mobile-web-app-*
- manifest.json linked
- Service Worker registration

---

## Melhorias Gerais

### Tipos (types/index.ts)
- Adicionado `PlanId` exportado de `lib/plans`
- Campos opcionais para Stripe: `subscriptionId`, `customerId`

### AppContext
- Integrado com `lib/plans.ts`
- Novas helpers: `canUploadPhoto`, `canExportData`, `maxPets`

### Firebase Config
- Funções configuradas com runtime Node 20
- Emuladores configurados para desenvolvimento local
- Headers de cache otimizados para PWA

### .gitignore
- Criado com entries para node_modules, dist, .env, firebase-debug

---

## Para Deploy

### Passos necessários:

1. **Configurar Stripe** (ver `docs/STRIPE_SETUP.md`)
   - Criar produto/preço no Stripe Dashboard
   - Configurar webhook
   - Obter API keys

2. **Adicionar Secrets no GitHub**
   - `VITE_STRIPE_PUBLIC_KEY`
   - `VITE_STRIPE_PREMIUM_PRICE_ID`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

3. **Deploy Cloud Functions**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

4. **Gerar ícones PWA**
   - Usar `public/icons/icon.svg` como template
   - Converter para PNG nos tamanhos do manifest.json
   - Substituir em `public/icons/`

5. **Testar checkout**
   - Usar cartões de teste do Stripe
   - 4242 4242 4242 4242

---

## Próximos Passos (Sprint 2)

- [ ] FCM Setup - Notificações push
- [ ] Dashboard Inteligente - Próximos 7 dias + streak
- [ ] Analytics - Firebase Analytics / Amplitude

---

## Issues Conhecidos

1. **Ícones PWA** - Necessário gerar PNGs a partir do SVG template
2. **Webhook local** - Requer Stripe CLI para testar localmente
3. **Checkout mobile** - Stripe Checkout pode ter limitações em alguns browsers

---

*Gerado automaticamente em 18/07/2026*
