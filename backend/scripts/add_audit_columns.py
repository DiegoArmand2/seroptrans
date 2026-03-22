"""Agrega columnas de auditoría a las tablas existentes."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.core.database import engine

TABLES = ["usuario", "rol", "rol_usuario", "rol_permiso_ventana", "rol_permiso_proceso"]
COLUMNS = [
    ("fecha_creacion", "DATETIME"),
    ("creado_por", "VARCHAR(32)"),
    ("fecha_actualizacion", "DATETIME"),
    ("actualizado_por", "VARCHAR(32)"),
]


def add_columns_sqlite(conn, table):
    for col_name, col_def in COLUMNS:
        try:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
            print(f"  + {table}.{col_name}")
        except Exception as e:
            if "duplicate column" in str(e).lower():
                print(f"  - {table}.{col_name} (ya existe)")
            else:
                raise


def main():
    with engine.connect() as conn:
        for table in TABLES:
            try:
                conn.execute(text(f"SELECT 1 FROM {table} LIMIT 1"))
            except Exception:
                print(f"Tabla {table} no existe, omitiendo")
                continue
            print(f"Procesando {table}:")
            add_columns_sqlite(conn, table)
            conn.commit()
    print("Auditoría aplicada.")


if __name__ == "__main__":
    main()
