from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, usuarios, roles, permisos, proyectos, turnos, rutas, conductores, pasajeros, vehiculos
from app.core.config import settings

app = FastAPI(
    title="SeropTrans API",
    description="Plataforma de Gestión de Transporte Inteligente",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["usuarios"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(permisos.router, prefix="/api/permisos", tags=["permisos"])
app.include_router(proyectos.router, prefix="/api/proyectos", tags=["proyectos"])
app.include_router(turnos.router, prefix="/api/turnos", tags=["turnos"])
app.include_router(rutas.router, prefix="/api/rutas", tags=["rutas"])
app.include_router(conductores.router, prefix="/api/conductores", tags=["conductores"])
app.include_router(vehiculos.router, prefix="/api/vehiculos", tags=["vehiculos"])
app.include_router(pasajeros.router, prefix="/api/pasajeros", tags=["pasajeros"])


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "seroptrans"}
