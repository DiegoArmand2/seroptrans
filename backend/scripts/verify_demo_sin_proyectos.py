"""
Script para verificar que el usuario demo no tenga permisos de proyecto asignados.
Si los tiene, los elimina para cumplir: usuario demo -> Sin proyectos -> listas vacías.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.usuario import Usuario
from app.models.rol import RolUsuario, RolPermisoProyecto
from app.services.permisos_service import get_user_proyectos


def main():
    db: Session = SessionLocal()
    try:
        demo = db.query(Usuario).filter(Usuario.login == "demo").first()
        if not demo:
            print("Usuario 'demo' no encontrado. No hay acción que realizar.")
            return

        allowed = get_user_proyectos(db, demo.usuario_id)
        if allowed is None:
            print("El usuario demo tiene rol Administrador. Debe tener un rol que NO sea Administrador para restringir por proyectos.")
            return

        rol_ids = [ru.rol_id for ru in db.query(RolUsuario).filter(RolUsuario.usuario_id == demo.usuario_id).all()]
        if not rol_ids:
            print("El usuario demo no tiene roles asignados. get_user_proyectos ya retorna [] - no verá registros.")
            return

        permisos = db.query(RolPermisoProyecto).filter(RolPermisoProyecto.rol_id.in_(rol_ids)).all()
        if not permisos:
            print("OK: El usuario demo no tiene permisos de proyecto. Las listas estarán vacías.")
            return

        print(f"El usuario demo tiene {len(permisos)} permiso(s) de proyecto asignado(s) en rol_permiso_proyecto.")
        print("Eliminando para que demo vea listas vacías en Proyecto, Turno, Pasajero, Conductor, Vehículo, Ruta...")
        for p in permisos:
            db.delete(p)
        db.commit()
        print("Permisos de proyecto eliminados. Demo ya no verá registros.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
