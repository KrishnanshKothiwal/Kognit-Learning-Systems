"""Add composite index for calendar events

Revision ID: add_calendar_index
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers
revision = 'add_calendar_index'
down_revision = None  # Update this with your latest revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add composite index for faster queries on (user_id, start_time)
    op.create_index(
        'ix_calendar_events_user_start',
        'calendar_events',
        ['user_id', 'start_time'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index('ix_calendar_events_user_start', table_name='calendar_events')

