"""add numero/unite/coefficient/production fields to sdp articles and post

Revision ID: 0006_add_sdp_article_fields
Revises: 0005_add_sdp_elements
Create Date: 2025-09-05 00:00:00.000001
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0006_add_sdp_article_fields'
down_revision = '0005_add_sdp_elements'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    # sqlite: inspect existing columns via PRAGMA
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_articles')"))
        existing_articles = [row[1] for row in res.fetchall()]
    except Exception:
        existing_articles = []

    if 'numero' not in existing_articles:
        op.add_column('dao_price_sdp_articles', sa.Column('numero', sa.String(length=64), nullable=True))
    if 'unite' not in existing_articles:
        op.add_column('dao_price_sdp_articles', sa.Column('unite', sa.String(length=64), nullable=True))
    if 'coefficient_k' not in existing_articles:
        op.add_column('dao_price_sdp_articles', sa.Column('coefficient_k', sa.Numeric(19,4), nullable=True))
    if 'production_per_day' not in existing_articles:
        op.add_column('dao_price_sdp_articles', sa.Column('production_per_day', sa.Numeric(19,4), nullable=True))

    # posts table
    try:
        res2 = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_posts')"))
        existing_posts = [row[1] for row in res2.fetchall()]
    except Exception:
        existing_posts = []

    if 'numero' not in existing_posts:
        op.add_column('dao_price_sdp_posts', sa.Column('numero', sa.String(length=64), nullable=True))


def downgrade():
    conn = op.get_bind()
    try:
        res = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_articles')"))
        existing_articles = [row[1] for row in res.fetchall()]
    except Exception:
        existing_articles = []

    if 'production_per_day' in existing_articles:
        op.drop_column('dao_price_sdp_articles', 'production_per_day')
    if 'coefficient_k' in existing_articles:
        op.drop_column('dao_price_sdp_articles', 'coefficient_k')
    if 'unite' in existing_articles:
        op.drop_column('dao_price_sdp_articles', 'unite')
    if 'numero' in existing_articles:
        op.drop_column('dao_price_sdp_articles', 'numero')

    try:
        res2 = conn.execute(sa.text("PRAGMA table_info('dao_price_sdp_posts')"))
        existing_posts = [row[1] for row in res2.fetchall()]
    except Exception:
        existing_posts = []

    if 'numero' in existing_posts:
        op.drop_column('dao_price_sdp_posts', 'numero')
