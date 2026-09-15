-- Enable pgvector extension (needed for post-MVP, uncomment when pgvector is installed)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Cats table
CREATE TABLE IF NOT EXISTS cats (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    keywords        TEXT[] NOT NULL DEFAULT '{}',
    adoption_url    TEXT NOT NULL,
    image_url       TEXT,
    -- Post-MVP: embedding column
    -- embedding    vector(1536),
    scraped_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for keyword matching (GIN index on array)
CREATE INDEX IF NOT EXISTS idx_cats_keywords ON cats USING GIN (keywords);

-- Unique constraint to avoid duplicate cats
CREATE UNIQUE INDEX IF NOT EXISTS idx_cats_name ON cats (name);
