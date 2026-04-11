# SeropTrans - Plataforma de Gestión de Transporte Inteligente

Sistema web para automatizar la gestión de transporte de personal de Aerosan, reemplazando procesos manuales basados en Excel.

## Stack técnico

- **Frontend:** React 18 + Vite 5, Tailwind CSS, React Router, Axios, Lucide React
- **Backend:** FastAPI, SQLAlchemy 2.0, Pydantic 2, Alembic, JWT
- **Base de datos:** PostgreSQL 16

## Requisitos

- Node.js 18+
- Python 3.11+
- Docker y Docker Compose (para PostgreSQL)

## Inicio rápido

**Importante:** `docker-compose` solo levanta **PostgreSQL** (y opcionalmente pgAdmin). La aplicación web (**Vite + FastAPI**) hay que arrancarla con Python y Node; si no ejecutas el frontend, verás `ERR_CONNECTION_REFUSED` en el puerto 5173.

### Conexión a la base de datos (PostgreSQL)

- **Dentro de Docker (backend → db):** `postgresql://seroptrans:<POSTGRES_PASSWORD>@db:5432/seroptrans`
- **Desde el host/servidor (puerto publicado en compose):** `postgresql://seroptrans:<POSTGRES_PASSWORD>@127.0.0.1:5433/seroptrans`

### Opción A: un solo comando (recomendado)

Desde la raíz del repositorio (con venv del backend ya creado y `pip install` hecho al menos una vez):

```bash
./scripts/start-dev.sh
```

Dejar esa terminal abierta. Abre http://localhost:5173/login

### 1. Base de datos

```bash
docker-compose up -d db
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # Ajustar si es necesario
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/seed_admin.py   # Crea usuario admin / admin123
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Acceso

- **Frontend:** http://127.0.0.1:5173/login (si `localhost` falla, usa **127.0.0.1**)
- **API:** http://localhost:8000
- **Login:** admin / admin123

### Si ves `ERR_CONNECTION_REFUSED` en el puerto 5173

1. El frontend **no está corriendo**. Docker solo levanta la base de datos; hace falta **Vite** (o el contenedor del perfil `dev` abajo).
2. Ejecuta `./scripts/diagnose-dev.sh` y comprueba que alguien escuche en **5173**.
3. Arranca con `./scripts/start-dev.sh` y **no cierres** esa terminal.
4. **Alternativa con Docker** (Vite dentro de un contenedor; sirve el puerto 5173 aunque Node falle en el host):

   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d vite
   ```

   En otra terminal, API en el host: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

   Luego abre http://127.0.0.1:5173/login

## Estructura del proyecto

```
seroptrans/
├── backend/          # FastAPI
│   ├── app/
│   │   ├── api/      # Rutas
│   │   ├── core/     # Config, DB, security
│   │   ├── models/   # SQLAlchemy
│   │   ├── schemas/  # Pydantic
│   │   └── services/ # Lógica de negocio
│   └── alembic/      # Migraciones
├── frontend/         # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
└── docker-compose.yml
```

## Fase 1 (actual)

- CRUD Usuarios
- CRUD Roles
- Asignación de roles a usuarios
- Permisos por ventana y proceso
- Login/Logout con JWT
- Dashboard básico

## Fases futuras

- Solicitudes de transporte
- Asignación óptima de rutas (IA)
- Check-in de pasajeros
- Notificaciones en tiempo real
- Reportería de costos
