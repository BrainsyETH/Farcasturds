-- Create table for tracking all processed casts (including rejected ones)
-- This prevents the bot from reprocessing the same cast multiple times

CREATE TABLE IF NOT EXISTS processed_casts (
  cast_hash VARCHAR(255) PRIMARY KEY,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'success', 'nft_required', 'rate_limited', 'invalid_command', etc.
  from_fid INTEGER,
  from_username VARCHAR(255)
);

-- Add index on processed_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_processed_casts_processed_at ON processed_casts(processed_at DESC);

-- Add index on status for analytics
CREATE INDEX IF NOT EXISTS idx_processed_casts_status ON processed_casts(status);

COMMENT ON TABLE processed_casts IS 'Tracks all processed casts to prevent duplicate responses';
COMMENT ON COLUMN processed_casts.cast_hash IS 'Unique hash of the cast';
COMMENT ON COLUMN processed_casts.status IS 'Result of processing: success, nft_required, rate_limited, invalid_command, etc.';
COMMENT ON COLUMN processed_casts.processed_at IS 'When the cast was processed';
