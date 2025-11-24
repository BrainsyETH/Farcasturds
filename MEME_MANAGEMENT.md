# Meme Response Management

This document explains how to manage the memes and gifs that are sent to NFT holders when they mention @farcasturd.

## Overview

When a user with a Farcasturd NFT mentions @farcasturd to send a turd, the bot will:
1. Send the normal turd confirmation message
2. Send an additional reply with a random meme/gif from the database

## Database Setup

### 1. Run the Migration

First, you need to create the `meme_responses` table in your Supabase database:

```sql
-- Run the SQL in supabase/migrations/001_create_meme_responses.sql
-- You can do this via the Supabase dashboard SQL editor or using the Supabase CLI
```

### 2. Table Schema

The `meme_responses` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `url` | TEXT | URL of the meme or gif image (required) |
| `caption` | TEXT | Optional caption text to display with the meme |
| `is_active` | BOOLEAN | Whether this meme can be randomly selected (default: true) |
| `created_at` | TIMESTAMP | When the meme was added |
| `updated_at` | TIMESTAMP | Last update time (auto-updated) |

## Managing Memes

### Adding Memes via SQL

You can add memes directly in the Supabase SQL editor:

```sql
-- Add a meme with a caption
INSERT INTO meme_responses (url, caption)
VALUES ('https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', 'Nice turd!');

-- Add a meme without a caption
INSERT INTO meme_responses (url)
VALUES ('https://media.giphy.com/media/icUEIrjnUuFCWDxFpU/giphy.gif');

-- Add multiple memes at once
INSERT INTO meme_responses (url, caption) VALUES
  ('https://example.com/meme1.gif', 'Dropping bombs!'),
  ('https://example.com/meme2.gif', 'Turd delivered!'),
  ('https://example.com/meme3.gif', null);
```

### Using the Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the Table Editor
3. Select the `meme_responses` table
4. Click "Insert" → "Insert row"
5. Fill in:
   - **url**: The full URL to your meme/gif image
   - **caption**: (Optional) Text to display with the meme
   - **is_active**: Check to enable, uncheck to disable

### Programmatic Management (Future Enhancement)

The database functions in `lib/database.ts` provide the following methods:

```typescript
// Add a new meme
await addMeme('https://example.com/meme.gif', 'Optional caption');

// List all memes
const allMemes = await listMemes();

// List only active memes
const activeMemes = await listMemes(true);

// Disable a meme (won't be randomly selected)
await toggleMeme(memeId, false);

// Re-enable a meme
await toggleMeme(memeId, true);

// Delete a meme permanently
await deleteMeme(memeId);
```

## How Random Selection Works

When an NFT holder sends a turd:
1. The bot fetches all memes where `is_active = true`
2. Randomly selects one from the list
3. Sends it as a reply to the cast
4. If a caption exists, it's included above the URL

## Tips

### Finding Memes and GIFs

- **Giphy**: https://giphy.com - Use the share button to get direct GIF URLs
- **Tenor**: https://tenor.com - Popular GIF platform
- **Imgur**: https://imgur.com - Image hosting with direct links

Make sure to use direct image URLs (ending in .gif, .jpg, .png, etc.) for best compatibility.

### Best Practices

1. **Test URLs**: Make sure your meme URLs are accessible and work before adding them
2. **Keep it Active**: Regularly review and update your meme collection
3. **Variety**: Add a diverse set of memes to keep responses fresh
4. **Captions**: Use captions to add personality, but they're optional
5. **Disable, Don't Delete**: Use `is_active = false` instead of deleting memes you might want to use later

### Example Meme Collection

Here's a starter collection you can add:

```sql
INSERT INTO meme_responses (url, caption) VALUES
  ('https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', 'Direct hit!'),
  ('https://media.giphy.com/media/icUEIrjnUuFCWDxFpU/giphy.gif', 'Boom!'),
  ('https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', 'Turd incoming!'),
  ('https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif', null),
  ('https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif', 'Another one!');
```

## Troubleshooting

### No Memes Being Sent

Check these things:
1. Verify the `meme_responses` table exists in Supabase
2. Ensure there's at least one meme with `is_active = true`
3. Check the application logs for any errors related to `[Meme]`

### Memes Not Displaying

- Verify the URL is a direct link to an image file
- Make sure the URL is publicly accessible (not behind authentication)
- Test the URL in a browser to ensure it loads

### Want to Temporarily Disable Meme Responses?

Set all memes to inactive:

```sql
UPDATE meme_responses SET is_active = false;
```

Re-enable them later:

```sql
UPDATE meme_responses SET is_active = true;
```

## Future Enhancements

Potential features to add:
- Admin UI for managing memes
- Analytics on which memes are sent most often
- User preferences for meme categories
- Seasonal or themed meme collections
- Meme reactions tracking
