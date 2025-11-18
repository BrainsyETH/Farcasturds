// lib/farcasturdAi.ts
import { buildFarcasterdPrompt } from "./farcasturdPrompt";
import type { FarcasterProfile } from "./farcasterClient";
import { openai } from "./openaiClient";

/**
 * Generate a 1024x1024 Farcasturd avatar using DALL-E 3.
 * Returns the raw image Buffer and the text prompt used.
 */
export async function generateFarcasterdImage(
  fid: number,
  profile: FarcasterProfile
): Promise<{ imageBuffer: Buffer; prompt: string }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const prompt = buildFarcasterdPrompt(fid, profile);

  console.log(`[AI] Generating Farcasturd for FID ${fid}`);
  console.log(`[AI] Prompt: ${prompt.substring(0, 100)}...`);

  const maxRetries = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[AI] Attempt ${attempt}/${maxRetries}`);

      // Call OpenAI DALL-E 3 API
      const result = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        size: "1024x1024",
        quality: "standard", // or "hd" for better quality (costs more)
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

      // Don't retry on certain errors
      if (error.code === "insufficient_quota") {
        throw new Error("OpenAI API quota exceeded. Please check your billing.");
      }
      if (error.code === "invalid_api_key") {
        throw new Error("Invalid OpenAI API key");
      }

      // Retry on rate limits or timeouts
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s
        console.log(`[AI] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  throw new Error(`Image generation failed after ${maxRetries} attempts: ${lastError?.message}`);
}