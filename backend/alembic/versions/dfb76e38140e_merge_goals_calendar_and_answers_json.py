"""merge goals_calendar and answers_json

Revision ID: dfb76e38140e
Revises: b7bc88b1a907
Create Date: 2025-11-05 14:43:30.294925

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dfb76e38140e'
down_revision: Union[str, Sequence[str], None] = ('b7bc88b1a907')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
