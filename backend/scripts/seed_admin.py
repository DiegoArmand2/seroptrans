"""Script para crear usuario administrador inicial."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.models.usuario import Usuario
from app.models.rol import Rol, RolUsuario, RolPermisoVentana, RolPermisoProceso
from app.models.horario_importacion import HorarioImportacion  # noqa: F401 — metadata create_all
from app.models.demanda_viaje import DemandaViaje  # noqa: F401 — metadata create_all
from app.models.tipo_pasajero import TipoPasajero  # noqa: F401 — metadata create_all
from app.models.tipo_vehiculo import TipoVehiculo  # noqa: F401 — metadata create_all
from app.core.security import get_password_hash


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.login == "admin").first():
            print("Usuario admin ya existe.")
            return
        admin = Usuario(
            login="admin",
            password=get_password_hash("admin123"),
            nombre_usuario="Administrador",
            email="admin@seroptrans.local",
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        rol_admin = Rol(
            nombre="Administrador",
            descripcion="Acceso total al sistema",
        )
        db.add(rol_admin)
        db.commit()
        db.refresh(rol_admin)

        db.add(RolUsuario(usuario_id=admin.usuario_id, rol_id=rol_admin.rol_id))
        db.commit()

        ventanas = [
            "reportes", "usuarios", "roles", "permisos",
            "proyecto", "turno", "tipo_pasajero", "tipo_vehiculo", "pasajero", "conductor", "vehiculo", "ruta", "horarios",
            "turnos_personal",
            "demanda_viajes",
        ]
        for v in ventanas:
            db.add(RolPermisoVentana(rol_id=rol_admin.rol_id, ventana=v))
        procesos = ["crear", "editar", "eliminar", "asignar", "confirmar_horario", "procesar_horario"]
        for p in procesos:
            db.add(RolPermisoProceso(rol_id=rol_admin.rol_id, proceso=p))
        db.commit()
        print("Usuario admin creado: login=admin, password=admin123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
