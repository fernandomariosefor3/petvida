# Escopo — Ciclo v3

**Tema:** *"Fazer o lembrete chegar — e conseguir provar que chegou"*
**Duração:** 10 semanas
**Data de abertura:** 28 de julho de 2026

---

## Premissa corrigida

O produto tem ~2 semanas de divulgação. Não há receita, e **não se espera que haja** neste estágio. Os usuários atuais estão no plano gratuito. Receita não é a métrica deste ciclo.

Isso altera o veredicto da Fase 0: o gate continua fechado para *feature especulativa*, mas **abre para uma feature com hipótese explícita e critério de morte definido**. É o caso da trilha WhatsApp abaixo.

---

## Estrutura: duas trilhas

**A trilha A não depende de nada e começa já. A trilha B só existe se a pesquisa autorizar.**

---

## Trilha A — Base (incondicional, ~15h)

Não é burocracia. Sem isto, você não consegue avaliar nem a trilha B nem a divulgação.

| # | Item | Esforço | Por que agora |
|---|---|---|---|
| A1 | Confirmar/criar repositório Git e fazer push | 1h | Sem histórico não há rollback. Pré-requisito de tudo. |
| A2 | Confirmar secret `VITE_FIREBASE_MEASUREMENT_ID` + GA4 vinculado + validar no DebugView | 2h | Destrava os 10 eventos que já existem no código |
| A3 | Sentry free tier no frontend | 2h | Hoje um usuário com tela branca não gera nenhum sinal |
| A4 | Campo `lastActiveAt` no doc do usuário | 3h | Sem isso não existe conceito de "usuário ativo" |
| A5 | **Instrumentar push: permissão concedida, entrega, abertura, atribuição a `reminder_completed`** | 6h | **Item não negociável do ciclo** — ver justificativa abaixo |
| A6 | Corrigir `banco_de_funcionalidades_app_pets.md` | 1h | Hoje ele afirma coisas falsas — ver seção final |

### Por que A5 é inegociável

A proposta central do PetVida é *lembrete → aviso → o tutor cuida do pet*. Hoje nenhum ponto desse caminho é medido. Não se sabe quantos usuários concedem permissão de notificação, quantas notificações são entregues, nem quantas são abertas.

Se o push não estiver chegando — o que é plausível em PWA, especialmente no iOS — **toda divulgação que você fizer estará enchendo um balde furado**, e você levaria meses para descobrir. A5 também produz o número que decide a trilha B: se a taxa de abertura de push for alta, o WhatsApp perde boa parte da razão de existir.

---

## Trilha B — WhatsApp (condicional, ~20h)

**🔒 Bloqueada até a pesquisa com tutores (`pesquisa-tutores.md`) devolver resultado.**

Não escreva uma linha desta trilha antes disso.

### Hipótese sendo testada

> Tutores esquecem doses; notificação push não chega ou não é vista; o aviso no WhatsApp resolve isso; e resolve o suficiente para justificar R$ 14,99/ano.

Quatro afirmações encadeadas. Se qualquer uma cair, a trilha cai.

### Critério de liberação

Definido em `pesquisa-tutores.md`. Resumo:

| Resultado | Ação |
|---|---|
| ✅ 3 critérios atingidos | Construir trilha B completa |
| ⚠️ 2 de 3 | Construir versão mínima: só vacina e vermífugo, sem tela de configuração |
| ❌ Critério de morte atingido | **Cancelar.** Backlog fica com a trilha "compartilhamento com veterinário" da v4 |

### Escopo se liberada

| # | Item | Esforço |
|---|---|---|
| B1 | Conta WhatsApp Business API + verificação de negócio no Meta | 4h |
| B2 | Template de utilidade aprovado pelo Meta (lembrete de vacina/vermífugo) | 3h |
| B3 | Cloud Function de disparo agendado, com deduplicação | 6h |
| B4 | Opt-in explícito do usuário + registro do consentimento (LGPD) | 3h |
| B5 | Limite de mensagens por usuário/mês, com corte automático | 2h |
| B6 | Métricas: enviada, entregue, e conclusão do lembrete atribuída ao canal | 2h |

### Restrições de projeto — não negociáveis

- **Limite obrigatório (B5).** Template de utilidade no Brasil custa ~R$ 0,04–0,05 por mensagem entregue. Sem teto, um usuário com muitos pets e muitos lembretes pode custar mais do que paga. Sugestão: 10 mensagens/mês por pet, com aviso ao usuário ao se aproximar do limite.
- **Opt-in explícito e registrado (B4).** Mandar mensagem sem consentimento é violação de LGPD e motivo de bloqueio da conta pelo Meta. O consentimento precisa ficar gravado com data e origem.
- **Push continua funcionando no plano grátis.** O WhatsApp é adicional, não substituto. Degradar o grátis para forçar upgrade destrói a confiança de quem ainda não paga — e são todos, hoje.

---

## Estrutura de planos (aplicar na semana 1, independente das trilhas)

**Faça agora: você tem zero assinantes.** É o momento mais barato que existirá para mudar. Daqui a seis meses isso vira migração e comunicação de mudança.

| | Grátis | Pago — R$ 14,99/ano |
|---|---|---|
| Pets | **ilimitado** | ilimitado |
| Carteirinha e histórico de saúde | ✓ | ✓ |
| Lembrete por push | ✓ | ✓ |
| Foto do pet | ✓ | ✓ |
| **Lembrete por WhatsApp** | ✗ | ✓ *(trilha B)* |
| **Compartilhar com veterinário / 2º tutor** | ✗ | ✓ *(v4)* |
| **Export em PDF** | ✗ | ✓ |

### Duas decisões que exigem justificativa

**1. Pets ilimitados no grátis.** O limite de 3 pets não converte: a maioria dos tutores tem 1 ou 2 e nunca encosta no teto, enquanto quem tem 5 desiste antes de virar usuário. Cobrar por *quantidade* penaliza justamente o usuário mais engajado. Cobre pela **entrega** e pelo **compartilhamento**.

**2. R$ 14,99 e não R$ 9,99.** A R$ 9,99, um usuário pesado da trilha B consome ~R$ 6,48/ano em mensagens, antes da taxa do Stripe e do Firebase — a margem some e o usuário mais fiel vira o menos rentável. A R$ 14,99 a conta fecha. *Confirme as taxas atuais do Stripe Brasil no seu painel; não tenho certeza dos percentuais vigentes.*

### Implementação

Os planos vêm do Firestore (`plans/`), com fallback em `PLAN_LIMITS` (`src/types`). Alterar exige:
- atualizar os docs em `plans/` no Firestore
- atualizar `PLAN_LIMITS` no código para o fallback bater
- **desativar o preço `price_1TvFX6FuifjisDf4mM21ORm7` (R$ 14,90) no Stripe e criar o novo de R$ 14,99**, ou manter o de R$ 29,99 renomeado — decida antes de mexer
- ajustar `src/pages/planos/page.tsx` para 2 colunas

⚠️ Isso toca billing. Rode `operations:change-request` com plano de rollback antes de aplicar em produção.

---

## Métricas de sucesso do ciclo

**Trilha A** — ao fim da v3, estas perguntas têm resposta numérica:

1. Que percentual dos usuários concede permissão de notificação?
2. Das notificações enviadas, quantas são entregues e quantas abertas?
3. De cada 100 cadastros, quantos seguem ativos em 30 dias?
4. Qual a razão `reminder_completed / reminder_created`?

O alvo não é um número bom. É a **existência** dos números. Se ao fim da v3 você ainda responder "acho que", a trilha A falhou.

**Trilha B** (se liberada):

5. Taxa de abertura do lembrete via WhatsApp vs. via push — *alvo: WhatsApp ≥ 2× push*
6. Conclusão de lembrete quando avisado por WhatsApp vs. por push
7. Primeiro assinante pagante — *alvo: ≥ 1 conversão orgânica até o fim do ciclo*

Se a taxa de abertura do WhatsApp **não** for materialmente melhor que a do push, a hipótese estava errada. Registre isso na retro e não insista.

---

## Fora de escopo — backlog da v4

- Compartilhamento com veterinário e 2º tutor *(segundo candidato mais forte; entra na v4 se a trilha B morrer)*
- Link público de emergência / acesso offline da carteirinha
- Busca de clínicas 24h e Alerta SOS de pet perdido
- App nativo nas lojas
- Revisão de preço com base em dado real de conversão
- Testes automatizados de frontend

---

## Correção pendente e urgente

`banco_de_funcionalidades_app_pets.md` é a fonte de verdade dos posts, e hoje está errado em quatro pontos:

- Nome do app ainda é placeholder: *"(Substitua aqui pelo Nome Oficial do seu App)"*
- Afirma disponibilidade em **Google Play e App Store** — o produto é uma web app/PWA, não está nas lojas
- Lista funcionalidades **que não existem no código**: busca de clínicas 24h e Alerta SOS de pet perdido
- Omite funcionalidades **que existem**: export em PDF, comparação entre pets, gráfico de evolução de peso, planos

Corrija antes do próximo post (item A6). Como está, qualquer divulgação gerada a partir dele promete ao cliente algo que o produto não entrega — e isso, com produto de duas semanas, é o jeito mais rápido de queimar a confiança que você ainda nem construiu.

---

## Cronograma

| Semana | Trilha A | Trilha B | Divulgação |
|---|---|---|---|
| 1 | A1, A2, A6 + reestruturar planos | Rodar a pesquisa | Post: dica de saúde |
| 2 | A3, A4 | Ler resultado → **liberar ou matar** | Post: divulgação do app |
| 3 | A5 (push) | B1, B2 se liberada | Post: pergunta à comunidade |
| 4–7 | — | B3, B4, B5, B6 | 1 post/semana, mix rotativo |
| 8 | Congelamento de escopo | Congelamento | Post: curiosidade |
| 9 | Validação e release | | Posts de anúncio da versão |
| 10 | Medição e retro | | Post: resultado / prova social |

---

## Próximo passo imediato

1. Rodar a pesquisa (`pesquisa-tutores.md`) — começa hoje, 15–25 conversas
2. Em paralelo, A1 e A2 — juntos custam 3h e destravam toda a leitura de dados
