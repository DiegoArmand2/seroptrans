"""horario_importacion: estado DR/CO

Revision ID: 013
Revises: 012

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "horario_importacion",
        sa.Column("estado", sa.String(2), nullable=False, server_default="DR"),
    )
    op.create_index(
        "ix_horario_importacion_proyecto_anio_semana_estado",
        "horario_importacion",
        ["proyecto_id", "anio", "numero_semana", "estado"],
        unique=False,
    )
    op.alter_column("horario_importacion", "estado", server_default=None)


def downgrade() -> None:
    op.drop_index("ix_horario_importacion_proyecto_anio_semana_estado", table_name="horario_importacion")
    op.drop_column("horario_importacion", "estado")
