# Semana 1 — Setup base de monetização

> 🎯 Objetivo: deixar o site **mensurável**, **legalmente em ordem** e **rastreável**.

Tempo estimado: **4 a 6 horas** distribuídas na semana.

---

## ✅ Checklist

- [x] `public/privacidade.html` adicionado
- [x] `public/termos.html` adicionado
- [ ] `public/cookie-banner.js` — **ainda não existe, precisa ser criado** (ver observação abaixo)
- [ ] Banner de cookies integrado no `index.html`
- [ ] Google Analytics 4 / Firebase Analytics criado
- [ ] Google Search Console verificado
- [ ] Sitemap submetido no Search Console
- [ ] `robots.txt` validado
- [ ] Política e Termos linkados no rodapé do app
- [ ] Smoke test: navegação anônima abre o site sem erro no console

> ⚠️ **Nota:** `cookie-banner.js` é referenciado neste guia mas não foi fornecido junto com os outros arquivos. Sem ele, os passos de GA4/Analytics abaixo (que dependem do consentimento do usuário) ficam incompletos. Avise se quiser que ele seja construído antes de prosseguir.

---

## 1. Subir as páginas legais

Os arquivos ficam em `public/`:

```
public/
├── privacidade.html    - Política de Privacidade (LGPD)
├── termos.html         - Termos de Uso
└── cookie-banner.js    - Banner de consentimento LGPD (pendente)
```

**Como integrar:**

1. Os arquivos já estão em `public/` do projeto React/Vite.
2. Firebase Hosting serve arquivos estáticos da pasta `public/` na raiz. Após `firebase deploy`, eles ficam acessíveis em:
   - `https://petvida.net.br/privacidade`
   - `https://petvida.net.br/termos`
3. No `index.html` (raiz do Vite), antes do `</body>`, adicione (quando o cookie-banner.js existir):

```html
<script src="/cookie-banner.js" defer></script>
```

E defina o ID do GA4/Firebase Analytics antes do banner carregar:

```html
<script>
  window.PETVIDA_GA_ID = 'G-XXXXXXXXXX'; // substituir depois de criar a propriedade
</script>
```

4. No rodapé do app React, adicionar os links:

```jsx
<footer className="text-sm text-gray-500">
  © {new Date().getFullYear()} PetVida Care ·{' '}
  <a href="/privacidade">Privacidade</a> ·{' '}
  <a href="/termos">Termos</a>
</footer>
```

> 💡 **Dica SEO:** o Firebase Hosting já tem "clean URLs" ativado, então `/privacidade.html` é reescrito para `/privacidade` automaticamente. Os canonicals e meta tags já apontam para URLs sem `.html`.

---

## 2. Firebase Analytics / Google Analytics 4 (GA4)

Como o projeto já usa Firebase (Auth, Firestore, Storage), o caminho mais direto é habilitar o **Firebase Analytics** direto no console do Firebase — ele já é powered by GA4 e evita criar uma propriedade GA4 solta e sem vínculo com o projeto:

1. No [Firebase Console](https://console.firebase.google.com) → projeto `petvid-82a98` → **Configurações do projeto** → aba **Integrações** → ativar **Google Analytics**
2. Isso cria/vincula automaticamente uma propriedade GA4 e gera o `measurementId` (formato `G-XXXXXXXXXX`)
3. No código (`src/lib/firebase.ts`), adicionar:

```ts
import { getAnalytics, isSupported } from 'firebase/analytics';

// ...
export const analyticsPromise = isSupported().then((ok) => (ok ? getAnalytics(app) : null));
```

4. Adicionar `measurementId` ao `firebaseConfig` e a variável `VITE_FIREBASE_MEASUREMENT_ID` no `.env`
5. **Importante (LGPD):** só inicializar o Analytics **depois** do consentimento do usuário no banner de cookies — não antes.

### Eventos personalizados recomendados:

```js
// Cadastro concluído
logEvent(analytics, 'sign_up', { method: 'email' });

// Pet cadastrado
logEvent(analytics, 'pet_added', { species: 'dog' });

// Assinatura iniciada
logEvent(analytics, 'begin_checkout', { plan: 'premium_yearly' });
```

---

## 3. Google Search Console

### Verificação do domínio (método DNS):

1. Acesse https://search.google.com/search-console/
2. **Adicionar propriedade** → **Domínio** → `petvida.net.br`
3. Copie o registro TXT do Google
4. No painel do seu provedor de domínio (Registro.br, Cloudflare, etc.), adicione o TXT:

```
Tipo: TXT
Nome: @
Valor: google-site-verification=XXXXXXXXXXXX
```

5. Volte no Search Console e clique em **Verificar**. Pode levar até 72h, mas geralmente é instantâneo.

### Submeter sitemap:

1. No Search Console, menu **Sitemaps**
2. Adicione: `https://petvida.net.br/sitemap.xml`
3. Status esperado: **Sucesso** em algumas horas

### URLs importantes no GSC:

- **Cobertura** → páginas indexadas e erros 404
- **Desempenho** → impressões, cliques e posição média no Google
- **Experiência** → Core Web Vitals

---

## 4. robots.txt e sitemap.xml

Já existem em `public/`. **Melhoria sugerida:** incluir `/privacidade` e `/termos` no sitemap:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://petvida.net.br/</loc>
    <lastmod>2026-07-01</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://petvida.net.br/register</loc>
    <lastmod>2026-07-01</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://petvida.net.br/faq</loc>
    <lastmod>2026-07-01</lastmod>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://petvida.net.br/privacidade</loc>
    <lastmod>2026-07-01</lastmod>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://petvida.net.br/termos</loc>
    <lastmod>2026-07-01</lastmod>
    <priority>0.3</priority>
  </url>
</urlset>
```

---

## 5. Validação final

### 🧪 Teste técnico

```bash
bash scripts/smoke-test.sh
```

### 🧪 Teste visual

1. Abra o site em **janela anônima**
2. Banner de cookies deve aparecer
3. "Apenas essenciais" → Analytics **não** deve carregar (checar DevTools → Network)
4. Recarregar → banner não reaparece (consentimento salvo)
5. Limpar localStorage → banner reaparece

### 🧪 LGPD

1. `https://petvida.net.br/privacidade` → confirma dados coletados, finalidade, bases legais, direitos do titular, DPO, cookies, retenção
2. `https://petvida.net.br/termos` → confirma isenção de responsabilidade veterinária, reembolso (7 dias CDC), foro brasileiro

---

## ⚠️ Erros comuns a evitar

1. **Subir Analytics sem o banner de cookies** → viola LGPD, risco de notificação da ANPD
2. **Não linkar Política e Termos no rodapé** → usuário não acha
3. **Verificar o domínio errado no GSC** → usar propriedade de **domínio**, não URL prefix
4. **Publicar sem testar** → sempre `npm run build` antes do `firebase deploy`

---

## 🐾 Próximo passo: Semana 2

Blog de SEO — 8 artigos pilares com título, palavra-chave, intenção de busca e estrutura.
