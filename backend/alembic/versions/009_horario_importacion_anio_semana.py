"""horario_importacion: anio, numero_semana; drop fecha_referencia

Revision ID: 009
Revises: 008

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("horario_importacion", sa.Column("anio", sa.Integer(), nullable=True))
    op.add_column("horario_importacion", sa.Column("numero_semana", sa.Integer(), nullable=True))

    op.execute(
        """
        UPDATE horario_importacion
        SET
            anio = CAST(to_char(fecha_referencia, 'IYYY') AS INTEGER),
            numero_semana = CAST(to_char(fecha_referencia, 'IW') AS INTEGER)
        WHERE fecha_referencia IS NOT NULL
        """
    )

    op.alter_column("horario_importacion", "anio", nullable=False)
    op.alter_column("horario_importacion", "numero_semana", nullable=False)
    op.drop_column("horario_importacion", "fecha_referencia")


def downgrade() -> None:
    op.add_column("horario_importacion", sa.Column("fecha_referencia", sa.Date(), nullable=True))

    # Lunes ISO: plantilla IYYY IW ID (PostgreSQL)
    op.execute(
        """
        UPDATE horario_importacion
        SET fecha_referencia = to_date(
            anio::text || ' ' || lpad(numero_semana::text, 2, '0') || ' 1',
            'IYYY IW ID'
        )
        """
    )

    op.alter_column("horario_importacion", "fecha_referencia", nullable=False)
    op.drop_column("horario_importacion", "numero_semana")
    op.drop_column("horario_importacion", "anio")
