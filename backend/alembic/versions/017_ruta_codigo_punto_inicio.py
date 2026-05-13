"""ruta: codigo, punto_inicio, unique (proyecto, codigo, punto_inicio)

Revision ID: 017
Revises: 016

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("ruta", sa.Column("codigo", sa.String(50), nullable=True))
    op.add_column(
        "ruta",
        sa.Column(
            "punto_inicio",
            sa.String(30),
            nullable=False,
            server_default="domicilio",
        ),
    )
    op.execute(
        """
        UPDATE ruta SET codigo = NULL WHERE ruta_id IN (
          SELECT ruta_id FROM (
            SELECT ruta_id,
              ROW_NUMBER() OVER (
                PARTITION BY proyecto_id, lower(trim(codigo))
                ORDER BY ruta_id
              ) AS rn
            FROM ruta
            WHERE codigo IS NOT NULL AND length(trim(codigo)) > 0
          ) AS x WHERE rn > 1
        );
        """
    )
    op.execute(
        """
        CREATE UNIQUE INDEX uq_ruta_proyecto_codigo_punto_inicio
        ON ruta (proyecto_id, codigo, punto_inicio)
        WHERE codigo IS NOT NULL AND length(trim(codigo)) > 0;
        """
    )
    op.alter_column("ruta", "punto_inicio", server_default=None)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS uq_ruta_proyecto_codigo_punto_inicio;")
    op.drop_column("ruta", "punto_inicio")
    op.drop_column("ruta", "codigo")
