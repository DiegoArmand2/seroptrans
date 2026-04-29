"""turno: codigo

Revision ID: 011
Revises: 010

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("turno", sa.Column("codigo", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("turno", "codigo")
