-- Function to get all users with their received turd counts
-- Used for calculating Turd Score percentiles

CREATE OR REPLACE FUNCTION get_all_received_counts()
RETURNS TABLE (
  to_fid INTEGER,
  turd_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    turds.to_fid,
    COUNT(*) as turd_count
  FROM turds
  GROUP BY turds.to_fid
  ORDER BY turd_count DESC;
END;
$$ LANGUAGE plpgsql;
