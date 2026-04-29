"""demanda_viajes: pasajero_id FK pasajero

Revision ID: 015
Revises: 014

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "015"
down_revision: Union[str, None] = "014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "demanda_viajes",
        sa.Column(
            "pasajero_id",
            sa.String(32),
            sa.ForeignKey("pasajero.pasajero_id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index("ix_demanda_viajes_pasajero_id", "demanda_viajes", ["pasajero_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_demanda_viajes_pasajero_id", table_name="demanda_viajes")
    op.drop_column("demanda_viajes", "pasajero_id")
