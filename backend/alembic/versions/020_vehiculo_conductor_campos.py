"""vehiculo: passwd, rating, model, color; conductor: license_number

Revision ID: 020
Revises: 019

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "020"
down_revision: Union[str, None] = "019"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("vehiculo", sa.Column("passwd", sa.String(255), nullable=True))
    op.add_column("vehiculo", sa.Column("rating", sa.Numeric(4, 2), nullable=True))
    op.add_column("vehiculo", sa.Column("model", sa.String(100), nullable=True))
    op.add_column("vehiculo", sa.Column("color", sa.String(50), nullable=True))
    op.add_column("conductor", sa.Column("license_number", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("conductor", "license_number")
    op.drop_column("vehiculo", "color")
    op.drop_column("vehiculo", "model")
    op.drop_column("vehiculo", "rating")
    op.drop_column("vehiculo", "passwd")
