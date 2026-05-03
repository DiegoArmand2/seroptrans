"""Agrega la ventana RBAC 'reportes' al rol Administrador."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models.rol import Rol, RolPermisoVentana

VENTANA = "reportes"


def main():
    db = SessionLocal()
    try:
        rol = db.query(Rol).filter(Rol.nombre == "Administrador").first()
        if not rol:
            print("Rol Administrador no encontrado.")
            return
        existing = {p.ventana for p in rol.permisos_ventana}
        if VENTANA in existing:
            print(f"La ventana '{VENTANA}' ya existe para Administrador.")
            return
        db.add(RolPermisoVentana(rol_id=rol.rol_id, ventana=VENTANA))
        db.commit()
        print(f"Permiso agregado: ventana '{VENTANA}' para rol Administrador.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
