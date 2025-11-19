// lib/farcasturdAi.ts
import { buildFarcasterdPrompt } from "./farcasturdPrompt";
import { extractColorsFromPfp } from "./colorExtractor";
import type { FarcasterProfile } from "./farcasterClient";
import { openai } from "./openaiClient";

export async function generateFarcasterdImage(
  fid: number,
  profile: FarcasterProfile
): Promise<{ imageBuffer: Buffer; prompt: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Extract colors from their profile picture
  let colors = null;
  if (profile.pfpUrl) {
    try {
      colors = await extractColorsFromPfp(profile.pfpUrl);
      console.log(`[AI] Extracted colors for FID ${fid}:`, colors);
    } catch (error: any) {
      console.warn(`[AI] Color extraction failed, continuing without colors:`, error.message);
    }
  }

  const prompt = buildFarcasterdPrompt(fid, profile, colors);

  console.log(`[AI] Generating Farcasturd for FID ${fid}`);
  console.log(`[AI] Prompt: ${prompt.substring(0, 150)}...`);

  const maxRetries = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI] Attempt ${attempt}/${maxRetries}`);

      const result = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
        response_format: "b64_json",
      });

      const first = result.data?.[0];
      if (!first?.b64_json) {
        throw new Error("DALL-E response missing b64_json image data");
      }

      const imageBuffer = Buffer.from(first.b64_json, "base64");
      console.log(
        `[AI] ✓ Generated image for FID ${fid} (${imageBuffer.length} bytes)`
      );

      return { imageBuffer, prompt };
    } catch (error: any) {
      lastError = error;
      console.error(`[AI] Attempt ${attempt} failed:`, error.message);

      if (error.code === "insufficient_quota") {
        throw new Error("OpenAI API quota exceeded. Please check your billing.");
      }
      if (error.code === "invalid_api_key") {
        throw new Error("Invalid OpenAI API key");
      }

      if (attempt < maxRetries) {
        const delay = attempt * 2000;
        console.log(`[AI] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Image generation failed after ${maxRetries} attempts: ${lastError?.message}`);
}