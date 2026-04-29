"""tabla demanda_viajes

Revision ID: 014
Revises: 013

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "014"
down_revision: Union[str, None] = "013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "demanda_viajes",
        sa.Column("demanda_viaje_id", sa.String(32), primary_key=True),
        sa.Column("turno_id", sa.String(32), sa.ForeignKey("turno.turno_id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "horario_importacion_id",
            sa.String(32),
            sa.ForeignKey("horario_importacion.horario_importacion_id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("dia", sa.String(15), nullable=False),
        sa.Column("sector", sa.String(100), nullable=False),
        sa.Column("hora_ini", sa.SmallInteger(), nullable=False),
        sa.Column("min_ini", sa.SmallInteger(), nullable=False),
        sa.Column("hora_fin", sa.SmallInteger(), nullable=False),
        sa.Column("min_fin", sa.SmallInteger(), nullable=False),
        sa.Column("dia_fin", sa.String(15), nullable=False),
        sa.Column("cedula", sa.String(20), nullable=False),
        sa.Column("nombre", sa.String(150), nullable=False),
        sa.Column("fecha", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("anio", sa.Integer(), nullable=True),
        sa.Column("numero_semana", sa.Integer(), nullable=True),
        sa.Column("tipo", sa.String(50), nullable=True),
        sa.Column("dia_numero", sa.Integer(), nullable=True),
    )
    op.create_index("ix_demanda_viajes_turno_id", "demanda_viajes", ["turno_id"], unique=False)
    op.create_index(
        "ix_demanda_viajes_horario_importacion_id",
        "demanda_viajes",
        ["horario_importacion_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_demanda_viajes_horario_importacion_id", table_name="demanda_viajes")
    op.drop_index("ix_demanda_viajes_turno_id", table_name="demanda_viajes")
    op.drop_table("demanda_viajes")
