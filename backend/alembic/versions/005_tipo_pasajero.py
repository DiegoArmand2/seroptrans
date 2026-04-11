"""tipo_pasajero table and pasajero.tipo_pasajero_id

Revision ID: 005
Revises: 004

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "tipo_pasajero",
        sa.Column("tipo_pasajero_id", sa.String(32), primary_key=True),
        sa.Column(
            "proyecto_id",
            sa.String(32),
            sa.ForeignKey("proyecto.proyecto_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("codigo", sa.String(30), nullable=False),
        sa.Column("nombre", sa.String(60), nullable=False),
        sa.Column("descripcion", sa.String(200), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("fecha_creacion", sa.DateTime(), nullable=False),
        sa.Column("creado_por", sa.String(32), nullable=True),
        sa.Column("fecha_actualizacion", sa.DateTime(), nullable=True),
        sa.Column("actualizado_por", sa.String(32), nullable=True),
    )
    op.create_unique_constraint(
        "uq_tipo_pasajero_proyecto_codigo",
        "tipo_pasajero",
        ["proyecto_id", "codigo"],
    )
    op.add_column(
        "pasajero",
        sa.Column(
            "tipo_pasajero_id",
            sa.String(32),
            sa.ForeignKey("tipo_pasajero.tipo_pasajero_id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("pasajero", "tipo_pasajero_id")
    op.drop_constraint("uq_tipo_pasajero_proyecto_codigo", "tipo_pasajero", type_="unique")
    op.drop_table("tipo_pasajero")
