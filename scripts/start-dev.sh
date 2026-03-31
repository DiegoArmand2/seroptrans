#!/usr/bin/env bash
# Arranca backend (8000) y frontend (5173). Deja esta ventana ABIERTA.
set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

port_busy() {
  local p="$1"
  ss -tln 2>/dev/null | grep -qE ":${p}\\s" && return 0
  command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$p" -sTCP:LISTEN -q >/dev/null 2>&1
}

echo "[SeropTrans] Comprobando puertos..."
if port_busy 5173; then
  echo "ERROR: Ya hay algo usando el puerto 5173. Cierra Vite u otra app o ejecuta:"
  echo "  docker-compose --profile dev stop vite"
  ss -tlnp 2>/dev/null | grep 5173 || lsof -i :5173 2>/dev/null || true
  exit 1
fi
if port_busy 8000; then
  echo "AVISO: El puerto 8000 está en uso. Si no es tu API, detén el otro proceso."
  ss -tlnp 2>/dev/null | grep 8000 || true
fi

cd "$ROOT/backend"
if [ -f venv/bin/activate ]; then
  # shellcheck source=/dev/null
  source venv/bin/activate
fi
if ! command -v uvicorn >/dev/null 2>&1; then
  echo "ERROR: uvicorn no encontrado. Crea el venv e instala dependencias:"
  echo "  cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

echo "[SeropTrans] Iniciando API en http://127.0.0.1:8000 ..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!
sleep 1
if ! kill -0 "$UVICORN_PID" 2>/dev/null; then
  echo "ERROR: uvicorn no arrancó. Revisa errores arriba o la base de datos (.env)."
  exit 1
fi

cleanup() {
  kill "$UVICORN_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT/frontend"
if [ ! -d node_modules ]; then
  echo "[SeropTrans] Instalando dependencias del frontend..."
  npm install
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm no está instalado (necesitas Node.js 18+)."
  exit 1
fi

echo ""
echo "[SeropTrans] Iniciando Vite. NO cierres esta terminal."
echo "  Abre en el navegador:  http://127.0.0.1:5173/login"
echo "  (Si localhost falla, usa siempre 127.0.0.1)"
echo ""
exec npm run dev
