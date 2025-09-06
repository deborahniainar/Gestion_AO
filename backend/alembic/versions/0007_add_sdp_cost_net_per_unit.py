"""add cost_net_per_unit column to sdp articles

Revision ID: 0007_add_sdp_cost_net_per_unit
Revises: 0006_add_sdp_article_fields
Create Date: 2025-09-06 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0007_add_sdp_cost_net_per_unit'
down_revision = '0006_add_sdp_article_fields'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_articles')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'cost_net_per_unit' not in existing:
        op.add_column('dao_price_sdp_articles', sa.Column('cost_net_per_unit', sa.Numeric(19,2), nullable=True))


def downgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_articles')"))
        existing = [row[1] for row in res.fetchall()]
    except Exception:
        existing = []

    if 'cost_net_per_unit' in existing:
        op.drop_column('dao_price_sdp_articles', 'cost_net_per_unit')
