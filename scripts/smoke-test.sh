#!/usr/bin/env bash
# PetVida Care - Smoke Test da Semana 1
# Uso: bash scripts/smoke-test.sh

set -e
SITE="https://petvida.net.br"
ok()  { printf "  \033[32m✓\033[0m %s\n" "$1"; }
bad() { printf "  \033[31m✗\033[0m %s\n" "$1"; FAIL=1; }

FAIL=0
echo ""
echo "🐾 PetVida Care - Smoke Test"
echo "=============================="
echo ""

# 1. Site principal
echo "[1] Site principal"
code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/")
[ "$code" = "200" ] && ok "GET / -> 200" || bad "GET / -> $code"

# 2. robots.txt
echo "[2] robots.txt"
code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/robots.txt")
[ "$code" = "200" ] && ok "GET /robots.txt -> 200" || bad "GET /robots.txt -> $code"
robots=$(curl -s "$SITE/robots.txt")
echo "$robots" | grep -q "Sitemap:" && ok "robots.txt contém Sitemap" || bad "robots.txt sem Sitemap"

# 3. sitemap.xml
echo "[3] sitemap.xml"
code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/sitemap.xml")
[ "$code" = "200" ] && ok "GET /sitemap.xml -> 200" || bad "GET /sitemap.xml -> $code"
sitemap=$(curl -s "$SITE/sitemap.xml")
echo "$sitemap" | grep -q "<loc>" && ok "sitemap.xml contém URLs" || bad "sitemap.xml vazio"

# 4. Páginas legais
echo "[4] Páginas legais"
for path in privacidade termos; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$SITE/$path")
  [ "$code" = "200" ] && ok "GET /$path -> 200" || bad "GET /$path -> $code"
done

# 5. Meta tags SEO da home
echo "[5] SEO meta tags"
home=$(curl -s "$SITE/")
echo "$home" | grep -qi '<title>' && ok "Home tem <title>" || bad "Home sem <title>"
echo "$home" | grep -qi 'name="description"' && ok "Home tem meta description" || bad "Home sem meta description"
echo "$home" | grep -qi 'rel="canonical"' && ok "Home tem canonical" || bad "Home sem canonical"
echo "$home" | grep -qi 'og:title' && ok "Home tem Open Graph" || bad "Home sem Open Graph"

# 6. Detecção do GA4
echo "[6] Google Analytics"
home=$(curl -s "$SITE/")
if echo "$home" | grep -qE 'G-[A-Z0-9]{10}|gtag\('; then
  ok "GA4 detectado no HTML"
else
  printf "  \033[33mi\033[0m GA4 não detectado (pode estar só via cookie-banner.js - ok)\n"
fi

# 7. Schema.org FAQ
echo "[7] Schema.org"
echo "$home" | grep -qi 'FAQPage' && ok "Schema FAQPage detectado" || bad "Schema FAQPage ausente"

# 8. Performance - tamanho do JS bundle
echo "[8] Performance"
echo "  i Bundle JS em produção: verifique no Chrome DevTools -> Network"

echo ""
echo "=============================="
if [ "$FAIL" = "0" ]; then
  printf "\033[32m✓ Todos os testes passaram\033[0m\n"
else
  printf "\033[31m✗ Alguns testes falharam\033[0m\n"
fi
echo ""
