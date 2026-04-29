"""vehiculo: ruta_id en lugar de turno_id

Revision ID: 012
Revises: 011

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "012"
down_revision: Union[str, None] = "011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vehiculo", sa.Column("ruta_id", sa.String(32), nullable=True))
    op.create_foreign_key(
        "vehiculo_ruta_id_fkey",
        "vehiculo",
        "ruta",
        ["ruta_id"],
        ["ruta_id"],
        ondelete="SET NULL",
    )
    op.drop_constraint("vehiculo_turno_id_fkey", "vehiculo", type_="foreignkey")
    op.drop_column("vehiculo", "turno_id")


def downgrade() -> None:
    op.add_column(
        "vehiculo",
        sa.Column(
            "turno_id",
            sa.String(32),
            sa.ForeignKey("turno.turno_id", ondelete="CASCADE"),
            nullable=True,
        ),
    )
    op.drop_constraint("vehiculo_ruta_id_fkey", "vehiculo", type_="foreignkey")
    op.drop_column("vehiculo", "ruta_id")
