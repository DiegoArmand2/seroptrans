"""horario_importacion

Revision ID: 003
Revises: 002

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "horario_importacion",
        sa.Column("horario_importacion_id", sa.String(32), primary_key=True),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("fecha_referencia", sa.Date(), nullable=False),
        sa.Column("url_archivo", sa.Text(), nullable=False),
        sa.Column("respuesta_msg", sa.Text(), nullable=True),
        sa.Column("respuesta_code", sa.Integer(), nullable=True),
        sa.Column("respuesta_title", sa.String(300), nullable=True),
        sa.Column("respuesta_raw", sa.Text(), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("horario_importacion")

