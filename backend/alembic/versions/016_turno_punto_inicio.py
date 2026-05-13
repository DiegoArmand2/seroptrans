"""turno: punto_inicio, unique (proyecto, codigo, punto_inicio)

Revision ID: 016
Revises: 015

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "turno",
        sa.Column(
            "punto_inicio",
            sa.String(30),
            nullable=False,
            server_default="domicilio",
        ),
    )
    # Evitar fallo al crear el índice si ya había códigos repetidos en un proyecto (se dejan en blanco los duplicados).
    op.execute(
        """
        UPDATE turno SET codigo = NULL WHERE turno_id IN (
          SELECT turno_id FROM (
            SELECT turno_id,
              ROW_NUMBER() OVER (
                PARTITION BY proyecto_id, lower(trim(codigo))
                ORDER BY turno_id
              ) AS rn
            FROM turno
            WHERE codigo IS NOT NULL AND length(trim(codigo)) > 0
          ) AS x WHERE rn > 1
        );
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_turno_proyecto_codigo_punto_inicio
        ON turno (proyecto_id, codigo, punto_inicio)
        WHERE codigo IS NOT NULL AND length(trim(codigo)) > 0;
        """
    )
    op.alter_column("turno", "punto_inicio", server_default=None)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_turno_proyecto_codigo_punto_inicio;")
    op.drop_column("turno", "punto_inicio")
