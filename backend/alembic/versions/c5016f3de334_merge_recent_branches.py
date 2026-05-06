"""merge recent branches

Revision ID: c5016f3de334
Revises: 6d2d2f2afd47, c3a9f2c8b0e1
Create Date: 2026-05-06 14:33:38.295196

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5016f3de334'
down_revision: Union[str, None] = ('6d2d2f2afd47', 'c3a9f2c8b0e1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
