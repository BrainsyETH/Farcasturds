export function buildFarcasterdPrompt(
  fid: number,
  profile: FarcasterProfile,
  colors?: ColorPalette | null
): string {
  const name = profile.displayName || profile.username || `FID ${fid}`;

  let colorScheme = "";
  if (colors) {
    colorScheme = `
Color mood: match the user's profile picture.
- Use ${colors.primary} as the main body tone.
- Use ${colors.secondary} as accent details (eyes, accessories, shoes, etc.).
- Use ${colors.vibrant} for subtle highlights or glow effects.
- Use ${colors.muted} for a simple gradient background.

IMPORTANT: Do NOT draw separate color palettes, swatches, charts, or UI elements. Just apply these colors naturally to the character and background.`;
  } else {
    colorScheme = `
Color mood: warm, inviting colors with brown/tan base tones and a simple soft gradient background.`;
  }

  let personalityHints = "";
  if (profile.bio) {
    const bio = profile.bio.toLowerCase();

    if (bio.includes("build") || bio.includes("dev") || bio.includes("engineer")) {
      personalityHints = "tech genius vibe with subtle code-inspired details";
    } else if (bio.includes("art") || bio.includes("design") || bio.includes("create")) {
      personalityHints = "creative artist vibe with playful, paint-like accents";
    } else if (bio.includes("degen") || bio.includes("ape") || bio.includes("crypto")) {
      personalityHints = "crypto degen vibe with a confident stance and subtle crypto references";
    } else if (bio.includes("music") || bio.includes("dj")) {
      personalityHints = "music lover vibe with rhythm and motion in the pose";
    } else if (bio.includes("game") || bio.includes("gamer")) {
      personalityHints = "gamer vibe with energetic, competitive posture";
    } else {
      personalityHints = "a unique, expressive personality";
    }
  }

return `
Create a single premium 3D character portrait. IMPORTANT: exactly one character, centered, front-facing.

CHARACTER DETAILS for the "Farcasturd Purple Poop PFP" collection:
- Full-body purple poop emoji character (three-tier swirl with rounded base)
- Front-facing and centered in frame
- Large expressive eyes on upper section, friendly smile below
- The character is purple - this is the main body color
- Small arms/hands in expressive pose, slight tilt (no more than 15 degrees)

PERSONALITY:
- Represents "${name}"
- ${personalityHints || "friendly, approachable personality"}
- Dynamic pose with expressive gestures while maintaining poop emoji shape

STYLE & QUALITY:
- High-end 3D rendered style like premium digital avatars (Azuki, Doodles, Pudgy Penguins quality)
- 1:1 square aspect ratio
- Character fills most of the frame (60-80% of height)
- Soft studio lighting from upper left with gentle rim lighting
- Simple, clean gradient background

${colorScheme}

MUST AVOID:
- No multiple characters or duplicate views
- No text, logos, watermarks, or UI elements anywhere
- No side angles - front view only
- Character must be purple, not other colors

This is a collectible digital avatar - make it polished, charming, and special.
`;
}
