"""Agrega columna activo a tablas turno y pasajero."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.core.database import engine


def main():
    with engine.connect() as conn:
        for table in ["turno", "pasajero"]:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN activo INTEGER DEFAULT 1 NOT NULL"))
                conn.commit()
                print(f"+ {table}.activo agregado")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"- {table}.activo (ya existe)")
                else:
                    raise
    print("Migración completada.")


if __name__ == "__main__":
    main()
