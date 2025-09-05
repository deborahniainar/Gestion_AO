"""add elements column to dao_price_sdp_articles

Revision ID: 0005_add_sdp_elements
Revises: 0004_add_equ_fields
Create Date: 2025-09-05 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0005_add_sdp_elements'
down_revision = '0004_add_equ_fields'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_articles')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'elements' not in existing:
        op.add_column('dao_price_sdp_articles', sa.Column('elements', sa.Text(), nullable=True))


def downgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_articles')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'elements' in existing:
        op.drop_column('dao_price_sdp_articles', 'elements')
