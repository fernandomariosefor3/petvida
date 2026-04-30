@echo off
chcp 65001 >nul
echo.
echo ============================================
echo    PetVida Care - Deploy Automatico
echo ============================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: Node.js nao encontrado!
    echo Baixe e instale em: https://nodejs.org
    echo Depois execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)
echo OK - Node.js encontrado!
echo.

echo [2/5] Instalando dependencias do projeto...
echo (isso pode demorar 1-2 minutos)
call npm install
if errorlevel 1 (
    echo ERRO na instalacao. Tente novamente.
    pause
    exit /b 1
)
echo OK!
echo.

echo [3/5] Gerando site de producao...
call npm run build
if errorlevel 1 (
    echo ERRO no build. Tente novamente.
    pause
    exit /b 1
)
echo OK!
echo.

echo [4/5] Instalando Firebase CLI...
call npm install -g firebase-tools
echo OK!
echo.

echo [5/5] Fazendo login e publicando...
echo.
echo >>> O navegador vai abrir para voce fazer login <<<
echo >>> Use a MESMA conta Google do Firebase Console <<<
echo.
call firebase login
echo.
echo Publicando o site...
call firebase deploy
echo.

if errorlevel 1 (
    echo Houve um problema no deploy. Tente rodar novamente.
) else (
    echo ============================================
    echo    PRONTO! Site publicado com sucesso!
    echo    Acesse: https://petvid-82a98.web.app
    echo ============================================
)
echo.
pause
