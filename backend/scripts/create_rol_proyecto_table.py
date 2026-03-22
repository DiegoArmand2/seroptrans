"""Crea la tabla rol_permiso_proyecto."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import engine, Base
from app.models.rol import RolPermisoProyecto

if __name__ == "__main__":
    RolPermisoProyecto.__table__.create(bind=engine, checkfirst=True)
    print("Tabla rol_permiso_proyecto creada.")
