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
Create a single, clean 3D character portrait of a cute, charming cartoon poop emoji representing "${name}".

The image must show:
- One full-body poop emoji character, centered in the frame.
- Big or small expressive eyes and a friendly smile.
- A dynamic, engaging pose that reflects ${personalityHints || "a friendly, approachable personality"}.
- Modern 3D render quality, similar to high-end NFT/PFP characters.
- Soft studio-style lighting and a simple gradient background.
- The color of the character can be versatile.

${colorScheme}

Framing and composition:
- 1:1 aspect ratio.
- Character fills most of the frame.
- No borders, no UI elements, no icons.

Strictly exclude:
- No additional characters, no exploded views, no side angles or overlays.
- No color palettes, paint swatches, charts, labels, or design notes.
- No text, logos, watermarks, or interface elements of any kind.

This is a digital collectible NFT avatar. Make it feel special, polished, and unique while keeping the poop emoji charm.`;
}
