#!/bin/sh
set -e

if [ -z "${PGHOST:-}" ] || [ -z "${PGPORT:-}" ] || [ -z "${PGUSER:-}" ] || [ -z "${PGDATABASE:-}" ]; then
  echo "ERROR: faltan variables PGHOST/PGPORT/PGUSER/PGDATABASE para esperar a Postgres."
  exit 1
fi

echo "[SeropTrans] Esperando PostgreSQL en ${PGHOST}:${PGPORT}..."
until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" >/dev/null 2>&1; do
  sleep 2
done
echo "[SeropTrans] PostgreSQL listo."

cd /app
echo "[SeropTrans] Ejecutando migraciones Alembic..."
alembic upgrade head

echo "[SeropTrans] Iniciando API (8000)..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
