# PetVida Care- 🐾

Aplicativo web para tutores de animais de estimação gerenciarem a saúde e rotina dos seus pets.

**Domínio:** [petvida.net.br](https://petvida.net.br)

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Firebase (Authentication + Firestore + Storage)
- **Hosting:** Firebase Hosting
- **Domínio:** petvida.net.br (Registro.br)

## Funcionalidades

- ✅ Landing page institucional com CTAs, depoimentos e FAQ
- ✅ Cadastro e login com Firebase Auth (e-mail/senha)
- ✅ Recuperação de senha por e-mail
- ✅ Dashboard com resumo: pets, próximos lembretes, alertas de atrasados
- ✅ Cadastro completo de pets (foto com upload, raça, peso, microchip, castração, tipo sanguíneo, alergias)
- ✅ Criação e gerenciamento de lembretes por pet (vacina, consulta, medicamento, banho/tosa)
- ✅ Toggle de conclusão de lembretes com filtros (pendentes, atrasados, concluídos)
- ✅ Registro de histórico de saúde (consultas, vacinas, peso, exames, cirurgias)
- ✅ Evolução do peso com mini gráfico de barras
- ✅ Página de detalhes individual do pet (hero card + aba saúde + aba lembretes)
- ✅ Badge de lembretes atrasados na sidebar
- ✅ Proteção de rotas — usuário não autenticado redireciona para /register
- ✅ Delete em cascata (remover pet → remove lembretes + registros de saúde)
- ✅ Upload de foto do pet via Firebase Storage
- ✅ SEO completo (meta tags, Open Graph, JSON-LD structured data)
- ✅ Segurança com Firestore Rules + Storage Rules por usuário

---

## 1. Configuração do Firebase

### 1.1 Criar projeto no Firebase Console

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto** → nomeie como `petvida-care`
3. Ative ou desative o Google Analytics conforme preferir

### 1.2 Ativar Authentication

1. No menu lateral: **Build → Authentication → Sign-in method**
2. Ative o provedor **Email/Password**

### 1.3 Criar banco Firestore

1. No menu lateral: **Build → Firestore Database**
2. Clique em **Create database**
3. Selecione a região `southamerica-east1` (São Paulo)
4. Comece em **production mode**

### 1.4 Ativar Storage

1. No menu lateral: **Build → Storage**
2. Clique em **Get started**
3. Selecione a mesma região do Firestore

### 1.5 Registrar app Web

1. Na página principal do projeto, clique no ícone **</>** (Web)
2. Nomeie como `petvida-web`
3. Copie as credenciais geradas

### 1.6 Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto com as credenciais copiadas:

```env
VITE_FIREBASE_API_KEY="sua-api-key"
VITE_FIREBASE_AUTH_DOMAIN="petvida-care.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="petvida-care"
VITE_FIREBASE_STORAGE_BUCKET="petvida-care.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu-sender-id"
VITE_FIREBASE_APP_ID="seu-app-id"
VITE_SITE_URL="https://petvida.net.br"
```

---

## 2. Desenvolvimento Local

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 3. Deploy no Firebase Hosting

```bash
# Instalar Firebase CLI (uma vez)
npm install -g firebase-tools

# Login
firebase login

# Deploy regras + índices + site
firebase deploy

# Ou só o site:
npm run deploy
```

---

## 4. Conectar domínio petvida.net.br ao Firebase

### 4.1 No Firebase Console

1. Acesse: **Hosting → Adicionar domínio personalizado**
2. Digite: `petvida.net.br`
3. Clique em **Continuar**
4. O Firebase vai mostrar **2 registros TXT e/ou A** para verificação
5. Anote os valores (ex: `A → 199.36.158.100` e TXT de verificação)
6. Adicione também `www.petvida.net.br` como domínio

### 4.2 No Registro.br

1. Acesse [registro.br](https://registro.br) e faça login
2. Clique no domínio **petvida.net.br**
3. Vá em **DNS → Editar zona**

Se a zona DNS ainda não existir, clique em **"Utilizar os servidores DNS do Registro.br"** para criar.

4. Adicione os registros que o Firebase forneceu:

**Para o domínio raiz (petvida.net.br):**

| Tipo | Nome | Valor |
|------|------|-------|
| A | petvida.net.br | 199.36.158.100 |
| A | petvida.net.br | 199.36.158.101 |
| TXT | petvida.net.br | (valor de verificação do Firebase) |

**Para www (redirecionamento):**

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | www.petvida.net.br | petvida-care.web.app |

5. Salve as alterações

### 4.3 Verificar no Firebase

1. Volte ao Firebase Console → Hosting
2. Clique em **Verificar** no domínio adicionado
3. Aguarde a propagação DNS (pode levar de 15 min a 24h)
4. O Firebase provisiona o certificado SSL automaticamente

### 4.4 Atualizar Auth Domain (importante!)

Após o domínio estar ativo, atualize o `.env`:

```env
VITE_FIREBASE_AUTH_DOMAIN="petvida.net.br"
```

E no Firebase Console → Authentication → Settings → Authorized domains, adicione `petvida.net.br`.

---

## 5. Deploy no GitHub

```bash
git init
git add .
git commit -m "PetVida Care v1.0 - Firebase + domínio petvida.net.br"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/SEU_USUARIO/petvida-care.git
git branch -M main
git push -u origin main
```

### Dica: CI/CD automático (opcional)

Crie `.github/workflows/deploy.yml` para deploy automático a cada push:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_SITE_URL: https://petvida.net.br
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

---

## Estrutura de Dados (Firestore)

### Collection: `users`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome do tutor |
| email | string | E-mail |
| phone | string | Telefone |
| createdAt | timestamp | Data de criação |

### Collection: `pets`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| userId | string | ID do dono |
| name | string | Nome do pet |
| species | string | Espécie |
| breed | string | Raça |
| birthDate | string | Data de nascimento |
| weight | number | Peso (kg) |
| color | string | Cor/pelagem |
| gender | string | male/female |
| photo | string | URL da foto |
| microchip | string | Nº do microchip |
| neutered | boolean | Castrado |
| bloodType | string | Tipo sanguíneo |
| allergies | string | Alergias |
| notes | string | Observações |
| createdAt | timestamp | Data de criação |

### Collection: `reminders`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| userId | string | ID do usuário |
| petId | string | ID do pet |
| title | string | Título |
| type | string | vaccine/appointment/medication/grooming/other |
| date | string | Data (YYYY-MM-DD) |
| time | string | Hora (HH:MM) |
| notes | string | Observações |
| completed | boolean | Concluído |
| createdAt | timestamp | Data de criação |

### Collection: `healthRecords`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| userId | string | ID do usuário |
| petId | string | ID do pet |
| type | string | appointment/vaccine/weight/exam/surgery/other |
| date | string | Data (YYYY-MM-DD) |
| weight | number | Peso registrado |
| notes | string | Observações |
| vet | string | Veterinário |
| clinic | string | Clínica |
| attachmentUrl | string | URL de anexo |
| createdAt | timestamp | Data de criação |

---

© 2026 PetVida Care. Todos os direitos reservados.
