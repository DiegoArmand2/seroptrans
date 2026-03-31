#!/usr/bin/env bash
# Diagnóstico rápido cuando el navegador muestra ERR_CONNECTION_REFUSED
echo "=== ¿Quién escucha en 5173 (Vite)? ==="
ss -tlnp 2>/dev/null | grep 5173 || lsof -iTCP:5173 -sTCP:LISTEN 2>/dev/null || echo "(nadie — por eso el navegador dice conexión rechazada)"
echo ""
echo "=== ¿Quién escucha en 8000 (API)? ==="
ss -tlnp 2>/dev/null | grep 8000 || lsof -iTCP:8000 -sTCP:LISTEN 2>/dev/null || echo "(nadie)"
echo ""
echo "=== Prueba HTTP ==="
curl -s -o /dev/null -w "127.0.0.1:5173 -> HTTP %{http_code}\n" --connect-timeout 2 http://127.0.0.1:5173/ || echo "127.0.0.1:5173 -> sin respuesta"
curl -s -o /dev/null -w "127.0.0.1:8000/api/health -> HTTP %{http_code}\n" --connect-timeout 2 http://127.0.0.1:8000/api/health || echo "127.0.0.1:8000 -> sin respuesta"
echo ""
echo "=== Contenedor Vite (perfil dev) ==="
docker ps -a --filter name=seroptrans_vite --format "{{.Names}} {{.Status}}" 2>/dev/null || true
