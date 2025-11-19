// lib/colorExtractor.ts
import * as Vibrant from "node-vibrant/node"; // ← Changed this line

export type ColorPalette = {
  primary: string;      // Main color
  secondary: string;    // Accent color
  vibrant: string;      // Most vibrant color
  muted: string;        // Muted/background color
};

/**
 * Extract dominant colors from a profile picture URL
 */
export async function extractColorsFromPfp(
  pfpUrl: string
): Promise<ColorPalette | null> {
  try {
    console.log(`[Color] Extracting colors from: ${pfpUrl}`);
    
    const palette = await Vibrant.from(pfpUrl).getPalette();

    if (!palette) {
      console.warn("[Color] No palette extracted");
      return null;
    }

    return {
      primary: palette.Vibrant?.hex || "#8B4513",
      secondary: palette.LightVibrant?.hex || "#D2691E",
      vibrant: palette.DarkVibrant?.hex || "#654321",
      muted: palette.Muted?.hex || "#DEB887",
    };
  } catch (error: any) {
    console.error("[Color] Extraction failed:", error.message);
    return null;
  }
}