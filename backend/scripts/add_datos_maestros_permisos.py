"""Agrega permisos de Datos Maestros al rol Administrador."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import SessionLocal
from app.models.rol import Rol, RolPermisoVentana

VENTANAS = ["proyecto", "turno", "tipo_pasajero", "tipo_vehiculo", "pasajero", "conductor", "vehiculo", "ruta", "horarios"]


def main():
    db = SessionLocal()
    try:
        rol = db.query(Rol).filter(Rol.nombre == "Administrador").first()
        if not rol:
            print("Rol Administrador no encontrado.")
            return
        existing = {p.ventana for p in rol.permisos_ventana}
        added = 0
        for v in VENTANAS:
            if v not in existing:
                db.add(RolPermisoVentana(rol_id=rol.rol_id, ventana=v))
                added += 1
        db.commit()
        print(f"Permisos agregados: {added}. Ventanas: {VENTANAS}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
