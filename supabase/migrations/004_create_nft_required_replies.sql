-- Create table to track NFT-required reply rate limiting
CREATE TABLE IF NOT EXISTS nft_required_replies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fid BIGINT NOT NULL UNIQUE,
  last_reply_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reply_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nft_required_replies_fid ON nft_required_replies(fid);
CREATE INDEX IF NOT EXISTS idx_nft_required_replies_last_reply_at ON nft_required_replies(last_reply_at);

-- Add comment
COMMENT ON TABLE nft_required_replies IS 'Tracks when users without NFTs were last notified about the NFT requirement (rate limited to 1 reply per 24 hours)';
