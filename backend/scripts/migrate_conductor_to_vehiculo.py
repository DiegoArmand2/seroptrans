"""Migra Conductor (vehículo+chofer) a Conductor (persona) + Vehículo.
- Conductor: solo nombre, disponible, activo
- Vehiculo: placa, capacidad, conductor_id, turno_id
Ejecutar: python3 -m scripts.migrate_conductor_to_vehiculo
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text, inspect
from app.core.database import engine, Base
from app.models.vehiculo import Vehiculo
from app.models.conductor import Conductor


def migrate():
    with engine.connect() as conn:
        Base.metadata.tables["vehiculo"].create(conn, checkfirst=True)
        conn.commit()

        insp = inspect(engine)
        if "conductor" not in insp.get_table_names():
            return
        cols = {c["name"] for c in insp.get_columns("conductor")}
        if "placa" not in cols and "capacidad" not in cols:
            return

        # SQLite no soporta DROP COLUMN en versiones antiguas - recrear tabla
        conn.execute(text("""
            CREATE TABLE conductor_new (
                conductor_id TEXT NOT NULL PRIMARY KEY,
                nombre TEXT NOT NULL,
                disponible INTEGER NOT NULL DEFAULT 1,
                activo INTEGER NOT NULL DEFAULT 1,
                fecha_creacion TEXT,
                creado_por TEXT,
                fecha_actualizacion TEXT,
                actualizado_por TEXT
            )
        """))
        conn.execute(text("""
            INSERT INTO conductor_new (conductor_id, nombre, disponible, activo, fecha_creacion, creado_por, fecha_actualizacion, actualizado_por)
            SELECT conductor_id, nombre, COALESCE(disponible, 1), COALESCE(activo, 1), fecha_creacion, creado_por, fecha_actualizacion, actualizado_por
            FROM conductor
        """))
        conn.execute(text("DROP TABLE conductor"))
        conn.execute(text("ALTER TABLE conductor_new RENAME TO conductor"))
        conn.commit()
    print("Migración completada.")


if __name__ == "__main__":
    migrate()
