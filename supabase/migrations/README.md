# Database Migrations

## Applying Migrations

To apply the migrations to your Supabase database:

### Option 1: Using Supabase CLI
```bash
supabase db push
```

### Option 2: Manual SQL Execution
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL from the migration file
4. Execute the query

## Migration: add_turd_score_function.sql

This migration adds the `get_all_received_counts()` function used to calculate Turd Score percentiles.

**What it does:**
- Creates a database function that returns all users with their received turd counts
- Used by the `/api/leaderboard` endpoint to calculate percentile rankings
- Enables the Turd Score feature in the user profile

**Required for:** Turd Score percentile calculation
