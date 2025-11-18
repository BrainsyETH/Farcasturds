// lib/farcasturdPrompt.ts
import type { FarcasterProfile } from "./farcasterClient";

/**
 * Build a single, consistent prompt used for ALL Farcasturd generations.
 * The personalization comes from analyzing the user's bio and profile.
 */
export function buildFarcasterdPrompt(
  fid: number,
  profile: FarcasterProfile
): string {
  const name = profile.displayName || profile.username || `FID ${fid}`;

  // Analyze bio for personality traits
  let personalityHints = "";
  if (profile.bio) {
    const bio = profile.bio.toLowerCase();

    if (bio.includes("build") || bio.includes("dev") || bio.includes("engineer")) {
      personalityHints = "wearing trendy glasses and giving off tech-savvy vibes";
    } else if (bio.includes("art") || bio.includes("design") || bio.includes("create")) {
      personalityHints = "with artistic flair, paint splatter effects, and creative energy";
    } else if (bio.includes("degen") || bio.includes("ape") || bio.includes("crypto")) {
      personalityHints = "with laser eyes and a mischievous, degen crypto energy";
    } else if (bio.includes("music") || bio.includes("dj")) {
      personalityHints = "wearing headphones and vibing to music";
    } else if (bio.includes("game") || bio.includes("gamer")) {
      personalityHints = "with gaming controller and excited gaming energy";
    } else if (bio.includes("coffee") || bio.includes("☕")) {
      personalityHints = "holding a steaming coffee cup with cozy vibes";
    }
  }

  // Build the prompt
  return `Create a cute, charming cartoon poop emoji character representing "${name}".

CHARACTER DESIGN:
- Adorable and friendly poop emoji (💩) style character
- Glossy, smooth brown/tan texture with a slight shine
- Big expressive eyes with personality and warmth
- Wide friendly smile that's inviting and fun
- ${personalityHints || "unique personality that stands out"}
- Sitting or standing in a dynamic, engaging pose

STYLE REQUIREMENTS:
- High-quality 3D render, Pixar/Disney animation quality
- Professional character design with clean silhouette
- Modern, contemporary aesthetic
- Well-lit with soft studio lighting
- Solid color gradient background (warm, inviting tones)
- NO text, logos, watermarks, or UI elements
- NO gross or offensive elements

MOOD:
- Fun, shareable, and meme-worthy
- Cute rather than crude
- Profile picture ready
- Instantly recognizable as a character

This is a digital collectible NFT avatar - make it special and unique while keeping the core poop emoji charm.`;
}