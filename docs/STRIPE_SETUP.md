# Guia de Configuração - Stripe Checkout

Este guia explica como configurar o Stripe para aceitar pagamentos no PetVida Care.

## 1. Criar Conta no Stripe

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Crie uma conta ou faça login
3. Complete a verificação de conta (KYC)

## 2. Configurar Produto/Preço

1. No menu lateral, vá em **Catalog** → **Products**
2. Clique em **Add product**
3. Preencha:
   - **Name:** PetVida Premium (Anual)
   - **Pricing:** R$29,99 / ano
   - **Billing period:** Annual
   - **Currency:** BRL

4. Após criar, copie o **Price ID** (começa com `price_`)

## 3. Configurar Webhook

O webhook é necessário para processar pagamentos automaticamente.

### 3.1 Criar Endpoint

1. Vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. Configure:
   - **Endpoint URL:** `https://petvida.net.br/api/stripe-webhook`
   - **Listen to:** Selecione todos os eventos:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - **Description:** PetVida Production

4. Clique em **Add endpoint**
5. Na tela seguinte, copie o **Webhook secret** (começa com `whsec_`)

### 3.2 Testar Localmente

Para testar locally:

```bash
# Instale Stripe CLI
# Windows:
winget install stripe.stripe-cli

# Ou baixe de: https://github.com/stripe/stripe-cli/releases

# Login
stripe login

# Inicie listener
stripe listen --forward-to localhost:5001/api/stripe-webhook

# Copie o webhook secret (whsec_...)
```

## 4. Obter API Keys

1. Vá em **Developers** → **API keys**
2. Copie:
   - **Publishable key** (pk_test_... ou pk_live_...) → Frontend (.env)
   - **Secret key** (sk_test_... ou sk_live_...) → Backend (.env functions)

⚠️ **IMPORTANTE:** Nunca exponha a Secret Key no frontend!

## 5. Configurar Variáveis de Ambiente

### Frontend (.env)
```
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxxxxxxxxxx
```

### Backend (Firebase Functions)
```bash
# No Firebase Console > Functions > Configuration
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
SITE_URL=https://petvida.net.br
```

## 6. Configurar no GitHub Secrets

Para o CI/CD funcionar, adicione os secrets em:
**GitHub Repo** → **Settings** → **Secrets and variables** → **Actions**

| Secret Name | Valor |
|-------------|-------|
| `VITE_STRIPE_PUBLIC_KEY` | pk_test_... |
| `VITE_STRIPE_PREMIUM_PRICE_ID` | price_... |
| `STRIPE_SECRET_KEY` | sk_test_... |
| `STRIPE_WEBHOOK_SECRET` | whsec_... |
| `FIREBASE_SERVICE_ACCOUNT` | (JSON completo da service account) |

## 7. Testar Checkout

1. Acesse `http://localhost:5173` (dev)
2. Faça login com uma conta existente
3. Vá para `/planos`
4. Clique em "Assinar com Cartão"
5. Use um dos cartões de teste:

| Número | Exp | CVC |
|--------|-----|-----|
| 4242 4242 4242 4242 | Any future | Any |
| 4000 0025 0000 3155 | Any future | Any (3DS) |

## 8. Modo Produção

Para ir ao ar:

1. Ative sua conta no Stripe (complete KYC)
2. Troque as chaves de test para production:
   - `pk_test_` → `pk_live_`
   - `sk_test_` → `sk_live_`
   - `price_` de test para production

3. Atualize o webhook URL para produção
4. Deploy as Functions novamente

## Troubleshooting

### Checkout não redireciona
- Verifique se `VITE_STRIPE_PUBLIC_KEY` está correto
- Verifique o console do navegador por erros

### Webhook não funciona
- Verifique se o endpoint está acessível
- Teste com Stripe CLI: `stripe trigger checkout.session.completed`
- Verifique os logs em **Developers** → **Webhooks** → **Logs**

### Pagamento não ativa plano
- Verifique os logs das Cloud Functions
- `firebase functions:log --only stripeWebhook`

---

Dúvidas? Entre em contato: 0pet0vida0@gmail.com
