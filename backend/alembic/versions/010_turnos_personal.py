"""turnos_personal

Revision ID: 010
Revises: 009

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "turnos_personal",
        sa.Column("turno_personal_id", sa.String(32), primary_key=True),
        sa.Column(
            "horario_importacion_id",
            sa.String(32),
            sa.ForeignKey("horario_importacion.horario_importacion_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "pasajero_id",
            sa.String(32),
            sa.ForeignKey("pasajero.pasajero_id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("empresa", sa.String(100), nullable=True),
        sa.Column("proceso", sa.String(100), nullable=True),
        sa.Column("cargo", sa.String(100), nullable=True),
        sa.Column("rut", sa.String(20), nullable=True),
        sa.Column("apellidos", sa.String(100), nullable=True),
        sa.Column("funcionarios", sa.String(100), nullable=True),
        sa.Column("dia_09", sa.String(100), nullable=True),
        sa.Column("dia_10", sa.String(100), nullable=True),
        sa.Column("dia_11", sa.String(100), nullable=True),
        sa.Column("dia_12", sa.String(100), nullable=True),
        sa.Column("dia_13", sa.String(100), nullable=True),
        sa.Column("dia_14", sa.String(100), nullable=True),
        sa.Column("dia_15", sa.String(100), nullable=True),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )
    op.create_index(
        "ix_turnos_personal_horario_importacion_id",
        "turnos_personal",
        ["horario_importacion_id"],
    )
    op.create_index(
        "ix_turnos_personal_proyecto_id",
        "turnos_personal",
        ["proyecto_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_turnos_personal_proyecto_id", table_name="turnos_personal")
    op.drop_index("ix_turnos_personal_horario_importacion_id", table_name="turnos_personal")
    op.drop_table("turnos_personal")

