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

- **Frontend:** http://localhost:5173
- **API:** http://localhost:8000
- **Login:** admin / admin123

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
