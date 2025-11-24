-- Create table for storing meme/gif responses
-- This table stores memes and gifs that are sent to NFT holders when they mention @farcasturd

CREATE TABLE IF NOT EXISTS meme_responses (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add index on is_active for faster queries when fetching active memes
CREATE INDEX IF NOT EXISTS idx_meme_responses_is_active ON meme_responses(is_active);

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_meme_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_meme_responses_updated_at
  BEFORE UPDATE ON meme_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_meme_responses_updated_at();

-- Add some example memes (you can replace these with your own)
-- Uncomment the lines below and add your own meme URLs and captions

-- INSERT INTO meme_responses (url, caption) VALUES
--   ('https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', 'Nice turd!'),
--   ('https://media.giphy.com/media/icUEIrjnUuFCWDxFpU/giphy.gif', 'Dropping bombs!'),
--   ('https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', null);

COMMENT ON TABLE meme_responses IS 'Stores meme and gif responses sent to NFT holders who mention @farcasturd';
COMMENT ON COLUMN meme_responses.url IS 'URL of the meme or gif image';
COMMENT ON COLUMN meme_responses.caption IS 'Optional caption text to include with the meme';
COMMENT ON COLUMN meme_responses.is_active IS 'Whether this meme is active and can be randomly selected';
