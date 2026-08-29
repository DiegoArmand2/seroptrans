"""ruta: origen y destino (nombre, lat, lng)

Revision ID: 019
Revises: 018

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "019"
down_revision: Union[str, None] = "018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("ruta", sa.Column("origen_nombre", sa.String(255), nullable=True))
    op.add_column("ruta", sa.Column("origen_lat", sa.Numeric(10, 7), nullable=True))
    op.add_column("ruta", sa.Column("origen_lng", sa.Numeric(10, 7), nullable=True))
    op.add_column("ruta", sa.Column("destino_nombre", sa.String(255), nullable=True))
    op.add_column("ruta", sa.Column("destino_lat", sa.Numeric(10, 7), nullable=True))
    op.add_column("ruta", sa.Column("destino_lng", sa.Numeric(10, 7), nullable=True))


def downgrade() -> None:
    op.drop_column("ruta", "destino_lng")
    op.drop_column("ruta", "destino_lat")
    op.drop_column("ruta", "destino_nombre")
    op.drop_column("ruta", "origen_lng")
    op.drop_column("ruta", "origen_lat")
    op.drop_column("ruta", "origen_nombre")
