"""turno: hora_entrada, hora_salida, tipo_turno, tipo_horario, cambio_dia

Revision ID: 007
Revises: 006

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("turno", sa.Column("hora_entrada", sa.Time(), nullable=True))
    op.add_column("turno", sa.Column("hora_salida", sa.Time(), nullable=True))
    op.add_column(
        "turno",
        sa.Column("tipo_turno", sa.String(20), nullable=False, server_default="matutino"),
    )
    op.add_column(
        "turno",
        sa.Column("tipo_horario", sa.String(20), nullable=False, server_default="entrada"),
    )
    op.add_column(
        "turno",
        sa.Column("cambio_dia", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.alter_column("turno", "tipo_turno", server_default=None)
    op.alter_column("turno", "tipo_horario", server_default=None)
    op.alter_column("turno", "cambio_dia", server_default=None)


def downgrade() -> None:
    op.drop_column("turno", "cambio_dia")
    op.drop_column("turno", "tipo_horario")
    op.drop_column("turno", "tipo_turno")
    op.drop_column("turno", "hora_salida")
    op.drop_column("turno", "hora_entrada")
