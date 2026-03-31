#!/bin/bash
# Script para subir SeropTrans a GitHub
# Uso: ./push_to_github.sh [URL_DEL_REPO]
# Ejemplo: ./push_to_github.sh https://github.com/tu-usuario/seroptrans.git

set -e
cd "$(dirname "$0")"

REPO_URL="${1:-}"

if [ -z "$REPO_URL" ]; then
  echo "Crea el repositorio en: https://github.com/new?name=seroptrans"
  echo ""
  echo "Uso: ./push_to_github.sh <URL>"
  echo "  Ejemplo HTTPS: ./push_to_github.sh https://github.com/tu-usuario/seroptrans.git"
  echo "  Ejemplo SSH:   ./push_to_github.sh git@github.com:tu-usuario/seroptrans.git"
  exit 1
fi

# Quitar origin si existe
git remote remove origin 2>/dev/null || true

git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo "Proyecto subido correctamente a GitHub."
