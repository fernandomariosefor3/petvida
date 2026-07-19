# Guia de Deploy — Stripe + Firebase (PetVida Care v2)

Este guia é para quem vai colocar o sistema de planos (Free/Pro/Premium) no ar
pela primeira vez. Assume Windows com PowerShell e pouca experiência com
linha de comando — cada passo tem o comando exato para copiar e colar.

Todos os comandos abaixo usam `petvid-82a98` como projeto Firebase. Se o seu
projeto tiver outro ID, troque em todos os comandos.

---

## Preparação

### 1. Confirmar branch e PR

No GitHub, confira que:
- Você está olhando o **PR #2** (`v2-sprint-1-claude` → `main`).
- O PR #2 é o que deve ser mesclado — o PR #1 (`v2-sprint-1`) é uma versão
  anterior e mais simples do mesmo recurso, não deve ser usado.

### 2. Confirmar que os checks estão verdes

Na página do PR #2 no GitHub, role até o final e confira que todos os
checks do GitHub Actions aparecem com ✅ (verde), não ❌ (vermelho) nem 🟡
(rodando ainda). Se algum estiver vermelho, pare aqui e peça ajuda antes de
continuar.

### 3. Fazer backup do Firestore

No [Console do Firebase](https://console.firebase.google.com) do projeto
`petvid-82a98`:
1. Menu lateral → **Firestore Database** → aba **Backups**.
2. Clique em **Agendar backup** (se ainda não houver um) ou **Exportar agora**.
3. Anote a data/hora do backup — você vai precisar dela se algo der errado.

### 4. Ativar o plano Blaze

As Cloud Functions agendadas deste projeto (lembretes, reconciliação de
contadores, downgrade por atraso de pagamento) só funcionam no plano pago
**Blaze** (pay-as-you-go). O plano Spark (gratuito) não deploya essas funções.

1. Console do Firebase → ícone de engrenagem → **Uso e faturamento**.
2. Clique em **Modificar plano** → selecione **Blaze**.
3. Vincule uma conta de faturamento do Google Cloud (cartão de crédito).

> O custo real para um app pequeno costuma ficar dentro da faixa gratuita
> mensal do Blaze (que já inclui uma cota generosa). Ainda assim, configure
> o alerta de orçamento no próximo passo para não ter surpresas.

### 5. Criar um alerta de orçamento

1. [Console do Google Cloud](https://console.cloud.google.com) → selecione o
   projeto `petvid-82a98`.
2. Menu → **Faturamento** → **Orçamentos e alertas** → **Criar orçamento**.
3. Defina um valor mensal (ex: R$50) e ative alertas por e-mail em 50%, 90%
   e 100% do valor.

### 6. Confirmar o projeto correto

Antes de rodar qualquer comando, confirme sempre qual projeto está ativo:

```powershell
firebase use
```

Se não aparecer `petvid-82a98`, veja a seção **Configuração** abaixo.

### 7. Criar os produtos no Stripe (modo de TESTE primeiro)

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com) — confirme
   que está no modo **Test mode** (chave no canto superior direito, deve
   dizer "Test mode", não "Live mode").
2. Menu lateral → **Product catalog** → **Add product**.
3. Crie o produto **"PetVida Pro"**:
   - Preço: recorrente, anual (ajuste o valor — os R$14,90/ano usados no
     código são só um valor de partida, **não confirmado comercialmente**).
   - Copie o **Price ID** gerado (começa com `price_`).
4. Repita para **"PetVida Premium"** (o valor de R$29,99/ano também está
   marcado como não confirmado — revise antes de usar em produção).
5. Guarde os dois Price IDs de teste em um lugar seguro (não precisam ir
   para o Git — veja a seção de configuração).

---

## Configuração

### 1. Autenticar o Firebase CLI

```powershell
firebase login
```

Isso abre o navegador para você entrar com a conta Google que administra o
projeto.

### 2. Selecionar o projeto

```powershell
firebase use petvid-82a98
```

### 3. Entender a diferença entre Secret e Parâmetro

| Tipo | O que é | Onde configurar | Exemplos |
|---|---|---|---|
| **Secret** | Valor sensível, nunca deve aparecer em texto puro em lugar nenhum (nem `.env`, nem log) | `firebase functions:secrets:set` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Parâmetro** | Configuração que muda por ambiente, mas não é um segredo (não dá acesso a nada sozinho) | `functions/.env.<project-id>` ou o mesmo comando de secret | `STRIPE_PRO_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID` |

Nenhum valor real deve aparecer neste documento nem em nenhum arquivo
commitado — apenas os **nomes** das variáveis, como já está em
`functions/.env.example`.

### 4. Configurar `STRIPE_SECRET_KEY`

```powershell
firebase functions:secrets:set STRIPE_SECRET_KEY
```

O terminal vai pedir para colar o valor (começa com `sk_test_` no modo de
teste). Cole e aperte Enter — o valor não fica visível na tela nem no
histórico do PowerShell.

### 5. Configurar `STRIPE_WEBHOOK_SECRET`

Você só vai ter esse valor DEPOIS de cadastrar o endpoint do webhook no
Stripe (seção **Deploy** abaixo, passo "cadastrar endpoint no Stripe"). Por
enquanto pode pular — vamos voltar aqui.

```powershell
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

### 6. Configurar `STRIPE_PRO_PRICE_ID` e `STRIPE_PREMIUM_PRICE_ID`

Estes não são segredos, mas como o código lê os dois da mesma forma
(`defineString`), a maneira mais simples e consistente é configurá-los
também como secrets:

```powershell
firebase functions:secrets:set STRIPE_PRO_PRICE_ID
firebase functions:secrets:set STRIPE_PREMIUM_PRICE_ID
```

Cole o Price ID de teste do produto "PetVida Pro" no primeiro comando, e o
do "PetVida Premium" no segundo.

> Alternativa para desenvolvimento local: crie um arquivo
> `functions/.env.petvid-82a98` (sem aspas, sem `export`) com:
> ```
> STRIPE_PRO_PRICE_ID=price_xxxxxxxxxxxx
> STRIPE_PREMIUM_PRICE_ID=price_xxxxxxxxxxxx
> ```
> Esse arquivo já está protegido pelo `.gitignore` (padrão `.env.*`) — nunca
> será enviado ao GitHub.

---

## Seed e migração

Rode estes comandos de dentro da pasta `functions`:

```powershell
cd functions
```

### 1. Rodar primeiro em `--dry-run`

```powershell
node scripts/seed-plans.mjs --project petvid-82a98 --dry-run
node scripts/migrate-user-plan-fields.mjs --project petvid-82a98 --dry-run
```

Isso mostra exatamente o que seria escrito, sem gravar nada. Leia o resumo
com atenção — confira quantos planos e quantos usuários apareceriam.

> Estes comandos precisam de credenciais de administrador do Firebase. Se
> aparecer um erro de "Could not load the default credentials", baixe uma
> chave de conta de serviço em **Console do Firebase → Configurações do
> projeto → Contas de serviço → Gerar nova chave privada**, salve o arquivo
> fora da pasta do projeto (nunca dentro de uma pasta que vá para o Git), e
> rode assim:
> ```powershell
> $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\caminho\para\sua-chave.json"
> node scripts/seed-plans.mjs --project petvid-82a98 --dry-run
> ```

### 2. Confirmar o resumo

Revise a lista de planos (`free`, `pro`, `premium`) e os valores de
`maxPets`/`maxRemindersPerPet`/`price`. **Os preços de R$14,90 (Pro) e
R$29,99 (Premium) estão marcados como `AGUARDANDO CONFIRMAÇÃO COMERCIAL`** —
se você já tem os valores definitivos, edite
`functions/scripts/seed-plans.mjs` antes de continuar.

### 3. Executar de verdade

Só depois de revisar o resumo:

```powershell
node scripts/seed-plans.mjs --project petvid-82a98 --yes
node scripts/migrate-user-plan-fields.mjs --project petvid-82a98 --yes
```

Rode sempre o `seed-plans.mjs` **antes** do `migrate-user-plan-fields.mjs`
(o segundo lê os limites gravados pelo primeiro).

### 4. Validar

No Console do Firebase → Firestore Database:
- Confira que existem os documentos `plans/free`, `plans/pro`,
  `plans/premium` com os campos `name`, `maxPets`, `maxRemindersPerPet`,
  `features`, `price`, `active`, `order`.
- Abra alguns documentos em `users/{id}` e confirme que agora têm
  `petCount`, `petLimit`, `reminderLimitPerPet`.

### 5. Rollback

Os dois scripts são **idempotentes** — rodar de novo não duplica nada, só
atualiza os mesmos documentos. Para reverter:
- `plans/*`: edite ou apague os documentos manualmente no Console do
  Firebase (não há um "desfazer" automático, mas como os dados são apenas
  configuração, isso é seguro).
- Campos de usuário (`petCount`/`petLimit`/`reminderLimitPerPet`): não há
  necessidade de reverter — eles não afetam nada até as regras/funções que
  os validam estarem publicadas.

---

## Administrador

### 1. Localizar o usuário

Você vai precisar do e-mail da conta que deve virar administradora (a mesma
que já usa o app).

### 2. Conceder a custom claim

De dentro da pasta `functions`:

```powershell
node scripts/set-admin-claim.mjs --project petvid-82a98 --email SEU-EMAIL-AQUI@exemplo.com --dry-run
```

Confira o resumo (usuário encontrado, claims atuais, claims novas). Se
estiver correto, rode de verdade:

```powershell
node scripts/set-admin-claim.mjs --project petvid-82a98 --email SEU-EMAIL-AQUI@exemplo.com --yes
```

### 3. Sair e entrar novamente

O usuário que ganhou a claim precisa **sair do app (logout) e entrar de
novo** — ou simplesmente recarregar a página e aguardar alguns segundos,
já que o app tenta atualizar o token automaticamente a cada login. Sem
isso, o navegador continua usando o token antigo (sem a permissão) por até
1 hora.

### 4. Confirmar acesso administrativo

Acesse `/admin` no app. Se o menu "Admin" aparecer no menu lateral e a
página carregar a lista de usuários, funcionou.

### 5. Remover a claim (em caso de erro)

```powershell
node scripts/set-admin-claim.mjs --project petvid-82a98 --email SEU-EMAIL-AQUI@exemplo.com --revoke --yes
```

---

## Deploy

### 1. Publicar as regras do Firestore

```powershell
firebase deploy --only firestore:rules --project petvid-82a98
```

### 2. Publicar as Cloud Functions

```powershell
cd functions
npm run build
cd ..
firebase deploy --only functions --project petvid-82a98
```

Isso pode levar alguns minutos na primeira vez.

### 3. Copiar a URL do webhook

Ao final do deploy, o terminal mostra a URL da função `stripeWebhook`, algo
como:

```
https://us-central1-petvid-82a98.cloudfunctions.net/stripeWebhook
```

Copie essa URL.

### 4. Cadastrar o endpoint no Stripe

1. Dashboard do Stripe (modo de teste) → **Developers** → **Webhooks** →
   **Add endpoint**.
2. Cole a URL copiada no passo anterior.
3. Em **Select events**, marque:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Salve e copie o **Signing secret** (começa com `whsec_`).

### 5. Atualizar `STRIPE_WEBHOOK_SECRET`

```powershell
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
```

Cole o signing secret copiado.

### 6. Republicar a função de webhook

Como o secret mudou, é preciso redeployar para a função pegar o novo valor:

```powershell
firebase deploy --only functions:stripeWebhook --project petvid-82a98
```

### 7. Testar com o Stripe em modo de teste

No Dashboard do Stripe → Webhooks → clique no endpoint cadastrado →
**Send test webhook** → escolha `checkout.session.completed` → **Send test
webhook**. Confira no Console do Firebase (Functions → Logs) se a função
processou sem erro.

---

## Testes pós-deploy

Faça login no app com uma conta de teste (não a sua conta principal) e
confirme, um por um:

- [ ] **Free no limite**: cadastre pets até o limite do plano Free (3) — os
      3 devem funcionar.
- [ ] **Bloqueio acima do limite**: tentar cadastrar o 4º pet deve mostrar a
      mensagem de limite atingido, não uma tela de erro genérica.
- [ ] **Criação simultânea**: abra o app em duas abas e tente cadastrar
      pets ao mesmo tempo perto do limite — o total nunca deve passar do
      limite do plano.
- [ ] **Pro**: assine o plano Pro (cartão de teste do Stripe:
      `4242 4242 4242 4242`, qualquer data futura, qualquer CVC) e confirme
      que o limite de pets aumenta.
- [ ] **Premium**: assine o Premium e confirme que os limites somem (pets
      ilimitados).
- [ ] **Checkout**: o botão de assinatura deve redirecionar para o Stripe e
      voltar para `/checkout-success` após o pagamento.
- [ ] **Cancelamento**: cancele a assinatura no Stripe (ou pelo portal do
      cliente, em `/billing`) e confirme que o acesso é ajustado conforme
      esperado (mantido até o fim do período pago, depois rebaixado).
- [ ] **Pagamento recusado**: use o cartão de teste de recusa
      (`4000 0000 0000 0002`) e confirme que aparece o aviso de pagamento
      pendente no app.
- [ ] **Webhook repetido**: no Dashboard do Stripe, reenvie manualmente um
      evento já processado (botão "Resend") e confirme nos logs das
      Functions que ele foi ignorado (não duplicou nenhuma alteração).
- [ ] **Alteração direta bloqueada**: tente (via DevTools do navegador, por
      exemplo) escrever diretamente no Firestore um campo `plan` diferente
      no seu próprio usuário — deve ser rejeitado pelas regras.
- [ ] **Acesso administrativo**: confirme que só a conta com a custom claim
      acessa `/admin`, e que outra conta comum é redirecionada.

---

## Rollback

### Reverter as Cloud Functions

```powershell
firebase functions:list --project petvid-82a98
```

Para voltar a uma versão anterior, use o histórico de deploys do Console do
Firebase (Functions → aba de cada função → histórico), ou faça um novo
deploy a partir de um commit anterior:

```powershell
git checkout <commit-anterior-conhecido-bom>
cd functions
npm run build
cd ..
firebase deploy --only functions --project petvid-82a98
```

Depois volte para a branch de trabalho: `git checkout v2-sprint-1-claude`.

### Reverter as regras do Firestore

```powershell
git log --oneline -- firestore.rules
git checkout <commit-anterior> -- firestore.rules
firebase deploy --only firestore:rules --project petvid-82a98
```

### Desativar temporariamente o checkout

Sem precisar reverter código: no Dashboard do Stripe, desative
temporariamente o endpoint do webhook (Webhooks → endpoint → **...** →
**Disable**). O botão de assinar continua visível no app, mas os
pagamentos não serão processados até você reativar.

### Preservar dados

Nenhuma ação de rollback acima apaga dados de usuários, pets, lembretes ou
histórico de saúde — reverter Functions/regras só muda o *comportamento*,
não os documentos existentes no Firestore.

### Consultar `stripeEvents` (auditoria)

No Console do Firebase → Firestore → coleção `stripeEvents`: cada documento
tem `status` (`processing`/`succeeded`/`failed`), `type` (tipo do evento
Stripe) e, quando falhou, um campo `error` com a mensagem. Use isso para
investigar por que um webhook específico não teve o efeito esperado.

### Remover uma custom claim equivocada

```powershell
cd functions
node scripts/set-admin-claim.mjs --project petvid-82a98 --email EMAIL-ERRADO@exemplo.com --revoke --yes
```

O usuário precisa sair e entrar de novo (ou aguardar até 1 hora) para a
remoção ter efeito.
