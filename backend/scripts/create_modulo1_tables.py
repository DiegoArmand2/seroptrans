"""Crea las tablas del Módulo 1 (Proyecto, Turno, Ruta, Conductor, Pasajero)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import engine, Base
from app.models import (
    Proyecto, Turno, Ruta, Conductor, ConductorRuta, ProyectoConductor, Vehiculo, Pasajero,
)

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    print("Tablas del Módulo 1 creadas.")
