// lib/farcasturdPrompt.ts
import type { FarcasterProfile } from "./farcasterClient";
import type { ColorPalette } from "./colorExtractor";

export function buildFarcasterdPrompt(
  fid: number,
  profile: FarcasterProfile,
  colors?: ColorPalette | null
): string {
  const name = profile.displayName || profile.username || `FID ${fid}`;
  
  // Build color scheme from their PFP or use defaults
  let colorScheme = "";
  if (colors) {
    colorScheme = `COLOR PALETTE (extracted from user's profile picture):
- Primary color: ${colors.primary}
- Secondary/accent color: ${colors.secondary}
- Vibrant highlights: ${colors.vibrant}
- Background/muted tones: ${colors.muted}

Use these colors creatively throughout the character design, accessories, and background to match their existing identity.`;
  } else {
    colorScheme = "Use warm, inviting colors with brown/tan base tones.";
  }

  // Analyze bio for personality traits
  let personalityHints = "";
  if (profile.bio) {
    const bio = profile.bio.toLowerCase();
    
    if (bio.includes("build") || bio.includes("dev") || bio.includes("engineer")) {
      personalityHints = "tech genius with oversized glasses, surrounded by floating code symbols and circuit patterns";
    } else if (bio.includes("art") || bio.includes("design") || bio.includes("create")) {
      personalityHints = "creative artist covered in paint splatters, holding a brush, with abstract colorful shapes floating around";
    } else if (bio.includes("degen") || bio.includes("ape") || bio.includes("crypto")) {
      personalityHints = "crypto degen with glowing laser eyes, wearing a gold chain, diamond hands gesture, surrounded by crypto symbols";
    } else if (bio.includes("music") || bio.includes("dj")) {
      personalityHints = "music lover with large DJ headphones, surrounded by floating musical notes and sound waves";
    } else if (bio.includes("game") || bio.includes("gamer")) {
      personalityHints = "gamer with gaming headset, holding a glowing controller, with pixel effects and game UI elements";
    } else {
      personalityHints = "unique character with distinctive personality and style";
    }
  }

  return `Create a cute, charming cartoon poop emoji character representing "${name}".

${colorScheme}

CHARACTER CONCEPT:
${personalityHints || "Friendly and approachable with unique flair"}

DESIGN REQUIREMENTS:
- Adorable poop emoji (💩) base with personality
- Big expressive eyes and friendly smile
- Dynamic, engaging pose
- Single character only
- Modern 3D render, Pudgy Penguin quality
- Clean silhouette, well-lit with soft studio lighting
- Gradient background using the muted tones
- NO text, logos, or watermarks

IMPORTANT: Integrate the extracted colors naturally into the character design - use them for accessories, effects, background gradients, and highlights. Make the colors feel cohesive with their existing brand.

This is a digital collectible NFT avatar - make it special and personalized.`;
}