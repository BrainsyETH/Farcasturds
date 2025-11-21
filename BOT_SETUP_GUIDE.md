# Farcasturds Bot Setup Guide

This guide will help you set up the Farcaster bot for turd tracking.

## 📁 What's Been Created

### Backend Files
- **`lib/database.ts`** - All database functions
  - `recordTurd()` - Save turd to database
  - `getTurdCount()` - Count turds for a user
  - `getUserStats()` - Get sent/received stats
  - `getLeaderboard()` - Query top recipients
  - `getRecentActivity()` - Get latest turds
  - `checkRateLimit()` - Spam prevention (1min cooldown, 10/day max)
  - `checkIfCastProcessed()` - Prevent duplicates

- **`lib/bot.ts`** - Bot helper functions
  - `processTurdCommand()` - Parse "@farcasturds @username" mentions
  - `lookupUserByUsername()` - Find users via Neynar
  - `replyToCast()` - Send reply casts
  - `fetchUserByFid()` - Get user info

- **`app/api/webhook/mentions/route.ts`** - Webhook handler
  - Receives Neynar webhook notifications
  - Processes commands with rate limiting
  - Records turds and sends replies

### Frontend Files
- **`components/TabNavigation.tsx`** - Tab switcher
- **`components/Leaderboard.tsx`** - Leaderboard page with stats
- **`app/api/leaderboard/route.ts`** - API endpoint (ready for real data)

---

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Save your credentials:
   - Project URL
   - Anon/Public key

### 2. Run SQL Migrations

In Supabase SQL Editor, run these queries:

```sql
-- Main turds table
CREATE TABLE turds (
  id SERIAL PRIMARY KEY,
  from_fid INTEGER NOT NULL,
  from_username VARCHAR(255) NOT NULL,
  to_fid INTEGER NOT NULL,
  to_username VARCHAR(255) NOT NULL,
  cast_hash VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_to_fid ON turds(to_fid);
CREATE INDEX idx_from_fid ON turds(from_fid);
CREATE INDEX idx_created_at ON turds(created_at DESC);

-- Rate limiting table
CREATE TABLE turd_rate_limits (
  from_fid INTEGER PRIMARY KEY,
  last_turd_at TIMESTAMP DEFAULT NOW(),
  daily_count INTEGER DEFAULT 0,
  reset_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 day')
);

-- Leaderboard query function
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INT)
RETURNS TABLE (
  to_fid INTEGER,
  to_username VARCHAR,
  turd_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    turds.to_fid,
    turds.to_username,
    COUNT(*) as turd_count
  FROM turds
  GROUP BY turds.to_fid, turds.to_username
  ORDER BY turd_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 🤖 Farcaster Bot Setup

### 3. Create Bot Account

1. Create new Farcaster account (e.g., @farcasturds)
2. Pay registration fee (~$5-10)
3. Save your bot's FID

### 4. Get Neynar API Access

1. Sign up at [neynar.com](https://neynar.com)
2. Create API key
3. Create a signer for your bot account:
   - Go to Neynar dashboard → Signers
   - Create new signer
   - Link to your bot FID
   - Save `signer_uuid`

### 5. Configure Environment Variables

Add to `.env.local`:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Neynar
NEYNAR_API_KEY=your-neynar-api-key
BOT_SIGNER_UUID=your-signer-uuid
BOT_FID=your-bot-fid-number

# Webhook (generate a random secret)
WEBHOOK_SECRET=your-random-secret-string
```

Generate a random webhook secret:
```bash
openssl rand -hex 32
```

---

## 🔗 Webhook Setup (Option A - Recommended)

### 6. Deploy to Vercel

```bash
# Make sure all env vars are set in Vercel dashboard
git push origin main
```

### 7. Set Up Neynar Webhook

1. Go to Neynar dashboard → Webhooks
2. Create new webhook:
   - **URL**: `https://your-app.vercel.app/api/webhook/mentions`
   - **Event Type**: `cast.created`
   - **Filters**:
     - "mentioned_fids" → Your bot's FID
   - **Secret**: Same as WEBHOOK_SECRET in .env
3. Save webhook

### 8. Test the Bot

Mention your bot on Farcaster:
```
@farcasturds send turd to @testuser
```

Check your logs in Vercel dashboard to see:
- ✅ Webhook received
- ✅ Command parsed
- ✅ Rate limit checked
- ✅ User looked up
- ✅ Turd recorded
- ✅ Reply sent

---

## 🔄 Polling Setup (Option B - Alternative)

If you prefer polling over webhooks:

### 6. Create Cron Job

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-mentions",
    "schedule": "*/2 * * * *"
  }]
}
```

This runs every 2 minutes. You'll need to create `/app/api/cron/check-mentions/route.ts` (see step-by-step guide).

---

## 🧪 Testing Locally

### With ngrok:

```bash
# Terminal 1
npm run dev

# Terminal 2
npx ngrok http 3000

# Update webhook URL to ngrok URL
# Test by mentioning bot
```

### Test Commands:

All these formats work:
```
@farcasturds send turd to @username
@farcasturds turd @username
@farcasturds @username
```

---

## 📊 Update Frontend to Use Real Data

The leaderboard currently uses mock data. Once your database has some turds:

1. The API at `/api/leaderboard` is already set up
2. The frontend will automatically fetch real data
3. No code changes needed!

---

## ⚙️ Configuration

### Rate Limits

Edit in `lib/database.ts`:

```typescript
const DAILY_LIMIT = 10;        // Max turds per day
const COOLDOWN_MS = 60000;     // 1 minute between turds
```

### Leaderboard Size

Edit in your API calls:

```typescript
await getLeaderboard(20);  // Show top 20 instead of 10
```

---

## 🔍 Monitoring

### Check Logs

**Vercel:**
- Go to your project → Functions
- Click on `/api/webhook/mentions`
- View real-time logs

**Local:**
- Watch terminal output for emoji indicators:
  - 📩 Mention received
  - 🎯 Target identified
  - ✓ Success steps
  - ❌ Errors

### Database Queries

**Check turd count:**
```sql
SELECT COUNT(*) FROM turds;
```

**View recent activity:**
```sql
SELECT * FROM turds ORDER BY created_at DESC LIMIT 10;
```

**Check rate limits:**
```sql
SELECT * FROM turd_rate_limits;
```

---

## 🐛 Troubleshooting

### Bot not responding?

1. Check webhook is active in Neynar
2. Verify webhook URL is correct
3. Check Vercel function logs for errors
4. Ensure all env vars are set

### Rate limit errors?

```sql
-- Reset a user's rate limit
DELETE FROM turd_rate_limits WHERE from_fid = 12345;
```

### Webhook signature failing?

The signature verification is commented out in `route.ts`. Uncomment and implement if needed for production security.

---

## 📦 What's Next?

### Optional Enhancements

1. **Profile Pictures**: Fetch from Neynar API
2. **Real-time Updates**: Use Supabase Realtime
3. **Analytics Dashboard**: Track trends
4. **Notifications**: Alert users when they receive turds
5. **Reactions**: Let users react to turds with emojis
6. **Turd NFTs**: Mint special turds as NFTs

---

## 🚀 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run SQL migrations
- [ ] Create bot Farcaster account
- [ ] Get Neynar API key
- [ ] Create signer for bot
- [ ] Set environment variables
- [ ] Deploy to Vercel
- [ ] Set up Neynar webhook
- [ ] Test with a mention
- [ ] Monitor logs
- [ ] Send first turd! 💩

---

## 📝 File Reference

```
/lib/
  ├── database.ts          ← Database functions + rate limiting
  └── bot.ts               ← Neynar API helpers

/app/api/
  ├── webhook/mentions/
  │   └── route.ts         ← Webhook handler (main bot logic)
  └── leaderboard/
      └── route.ts         ← Leaderboard API

/components/
  ├── TabNavigation.tsx    ← Tab switcher
  └── Leaderboard.tsx      ← Leaderboard UI
```

---

Need help? Check the comments in each file for detailed explanations!
