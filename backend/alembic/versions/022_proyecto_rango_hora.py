"""proyecto: rango_hora_desde, rango_hora_hasta

Revision ID: 022
Revises: 021

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "022"
down_revision: Union[str, None] = "021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("proyecto", sa.Column("rango_hora_desde", sa.Time(), nullable=True))
    op.add_column("proyecto", sa.Column("rango_hora_hasta", sa.Time(), nullable=True))


def downgrade() -> None:
    op.drop_column("proyecto", "rango_hora_hasta")
    op.drop_column("proyecto", "rango_hora_desde")
