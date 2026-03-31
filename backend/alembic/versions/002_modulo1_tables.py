"""modulo1 tables

Revision ID: 002
Revises: 001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "proyecto",
        sa.Column("proyecto_id", sa.String(32), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("descripcion", sa.String(300), nullable=True),
        sa.Column("parametros_operativos", sa.Text(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )

    op.create_table(
        "turno",
        sa.Column("turno_id", sa.String(32), primary_key=True),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("nombre", sa.String(60), nullable=False),
        sa.Column("descripcion", sa.String(200), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )

    op.create_table(
        "ruta",
        sa.Column("ruta_id", sa.String(32), primary_key=True),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("sector", sa.String(100), nullable=True),
        sa.Column("geocerca", sa.Text(), nullable=True),
        sa.Column("costo_base", sa.Numeric(10, 2), nullable=True),
        sa.Column("tipo", sa.String(20), nullable=False, server_default="diurna"),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )

    op.create_table(
        "conductor",
        sa.Column("conductor_id", sa.String(32), primary_key=True),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("disponible", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )

    op.create_table(
        "proyecto_conductor",
        sa.Column("proyectocon_id", sa.String(32), primary_key=True),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "conductor_id",
            sa.String(32),
            sa.ForeignKey("conductor.conductor_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )

    op.create_table(
        "conductor_ruta",
        sa.Column("conductorruta_id", sa.String(32), primary_key=True),
        sa.Column(
            "conductor_id",
            sa.String(32),
            sa.ForeignKey("conductor.conductor_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "ruta_id",
            sa.String(32),
            sa.ForeignKey("ruta.ruta_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tipo", sa.String(20), nullable=False),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )

    op.create_table(
        "pasajero",
        sa.Column("pasajero_id", sa.String(32), primary_key=True),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("cedula", sa.String(20), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("direccion", sa.String(300), nullable=True),
        sa.Column("lat", sa.Numeric(10, 7), nullable=True),
        sa.Column("lng", sa.Numeric(10, 7), nullable=True),
        sa.Column("ruta_id", sa.String(32), sa.ForeignKey("ruta.ruta_id", ondelete="SET NULL"), nullable=True),
        sa.Column("horario_habitual", sa.String(50), nullable=True),
        sa.Column("placa_asignada", sa.String(20), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )

    op.create_table(
        "vehiculo",
        sa.Column("vehiculo_id", sa.String(32), primary_key=True),
        sa.Column("placa", sa.String(20), nullable=False),
        sa.Column("capacidad", sa.Integer(), nullable=False, server_default="16"),
        sa.Column("conductor_id", sa.String(32), sa.ForeignKey("conductor.conductor_id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "turno_id",
            sa.String(32),
            sa.ForeignKey("turno.turno_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("vehiculo")
    op.drop_table("pasajero")
    op.drop_table("conductor_ruta")
    op.drop_table("proyecto_conductor")
    op.drop_table("conductor")
    op.drop_table("ruta")
    op.drop_table("turno")
    op.drop_table("proyecto")
