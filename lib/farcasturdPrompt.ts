// lib/farcasturdPrompt.ts
import type { FarcasterProfile } from "./farcasterClient";

/**
 * Build a single, consistent prompt used for ALL Farcasturd generations.
 * The only personalization is through the user's PFP + a bit of text context.
 */
export function buildFarcasterdPrompt(fid: number, profile: FarcasterProfile): string {
  const namePart = profile.displayName || profile.username || `FID ${fid}`;
  const bioSnippet = profile.bio
    ? `Use this short description as loose inspiration for personality and mood: "${profile.bio.slice(
        0,
        200
      )}". `
    : "";

  return (
    `Create a 1024x1024 profile picture of a cute, stylized poop character called a "Farcasturd". ` +
    `This Farcasturd should visually represent the Farcaster user "${namePart}". ` +
    `Use the provided Farcaster profile image as the main reference for colors, vibe, and personality. ` +
    `Transfer key elements like general color palette, hair/hat shape, and mood from the face into the Farcasturd character.` +
    ` The Farcasturd must clearly read as a poop/turd, but still fun, charming, and shareable, not gross or offensive. ` +
    `Style: clean, modern, semi-3D illustration with soft lighting and clear silhouette, designed to look great at small avatar sizes. ` +
    `Background: simple but interesting, with subtle bathroom/chain/onchain hints that fit the Farcasturd brand, avoid clutter. ` +
    bioSnippet +
    `High detail, crisp edges, no text, no logos, and no UI elements in the image.`
  );
}
