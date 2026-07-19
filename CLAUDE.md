# Regras do Projeto PetVida

## REGRA PRINCIPAL
Nunca altere nada além do que foi explicitamente pedido.  
Se o pedido for "adicionar cor", adicione cor — não mova código, não mude estrutura, não refatore, não "melhore" nada por conta própria.

## Configuração do site — NÃO TOCAR sem pedido direto
- Arquivo `.env` — nunca alterar ou recriar sem ser solicitado
- `firebase.ts` / configuração do Firebase — nunca alterar
- `firestore.rules` — nunca alterar
- `AuthContext.tsx` — nunca alterar a lógica de autenticação
- Rotas e estrutura de navegação — nunca alterar
- Quaisquer arquivos de configuração (`vite.config.ts`, `tailwind.config.js`, `package.json`) — nunca alterar sem pedido

## Fluxo obrigatório para qualquer mudança
1. Editar apenas os arquivos necessários para o que foi pedido
2. Rodar `npm run build` para verificar se compila
3. Fazer deploy: `firebase deploy --only hosting --project petvid-82a98`

## Sobre imagens
- Imagens de pets (cão, gato, pássaro, coelho) vêm do Unsplash via URL
- Cachorro padrão: `https://images.unsplash.com/photo-1587300003388-59208cc962cb`
- Gato: `https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba`
- Pássaro: `https://images.unsplash.com/photo-1444464666168-49d633b86797`
- Coelho: `https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308`
