// lib/farcasturdAi.ts
import { buildFarcasterdPrompt } from "./farcasturdPrompt";
import type { FarcasterProfile } from "./farcasterClient";
import { openai } from "./openaiClient";

/**
 * Generate a 1024x1024 Farcasturd avatar using gpt-image-1.
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

  // Call OpenAI images API directly
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    n: 1,
    response_format: "b64_json",
  });

  const first = result.data?.[0];
  if (!first?.b64_json) {
    throw new Error("gpt-image-1 response missing b64_json image data");
  }

  const imageBuffer = Buffer.from(first.b64_json, "base64");
  return { imageBuffer, prompt };
}
