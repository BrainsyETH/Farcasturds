// lib/farcasturdStore.ts
import { getFarcasterProfile } from "./farcasterClient";
import { generateFarcasterdImage } from "./farcasturdAi";
import { getFarcasturdRow, insertFarcasturdRow, type FarcasturdRow } from "./db";

// Fallback to a relative URL if APP_BASE_URL is not set
const APP_BASE_URL = process.env.APP_BASE_URL || "";

export type FarcasturdRecord = {
  fid: number;
  imageUrl: string;
  prompt: string;
  createdAt: string;
};

function mapRowToRecord(row: FarcasturdRow): FarcasturdRecord {
  return {
    fid: row.fid,
    // Image is served by our image route
    imageUrl: `${APP_BASE_URL}/api/image/${row.fid}`,
    prompt: row.prompt ?? "",
    createdAt: row.created_at,
  };
}

// Get existing farcasturd WITHOUT generating
export async function getFarcasturd(fid: number): Promise<FarcasturdRecord | null> {
  const row = await getFarcasturdRow(fid);
  if (!row) return null;
  return mapRowToRecord(row);
}

// Generate OR fetch existing farcasturd (only call this from generate button!)
export async function ensureFarcasturd(fid: number): Promise<FarcasturdRecord> {
  const existing = await getFarcasturd(fid);
  if (existing) {
    console.log(`[Store] Farcasturd already exists for FID ${fid}`);
    return existing;
  }

  console.log(`[Store] Generating new Farcasturd for FID ${fid}`);

  // 1) Fetch Farcaster profile
  const profile = await getFarcasterProfile(fid);

  // 2) Generate the image via OpenAI
  const { imageBuffer, prompt } = await generateFarcasterdImage(fid, profile);

  // 3) Store base64 in Blob
  const imageBase64 = imageBuffer.toString("base64");
  const row = await insertFarcasturdRow({
    fid,
    imageBase64,
    prompt,
  });

  console.log(`[Store] ✓ Successfully generated Farcasturd for FID ${fid}`);

  return mapRowToRecord(row);
}

export function buildOnchainMetadata(record: FarcasturdRecord) {
  const externalUrl = APP_BASE_URL ? `${APP_BASE_URL}/u/${record.fid}` : `/u/${record.fid}`;

  return {
    name: `Farcasturd #${record.fid}`,
    description:
      "Your 1:1 Farcasturd. A unique turd tied to your Farcaster account.",
    image: record.imageUrl,
    external_url: externalUrl,
    attributes: [
      { trait_type: "FID", value: record.fid },
      { trait_type: "Genesis", value: "Phase 1" },
    ],
  };
}

// Helper to build placeholder metadata when farcasturd doesn't exist yet
export function buildPlaceholderMetadata(fid: number) {
  const externalUrl = APP_BASE_URL ? `${APP_BASE_URL}/u/${fid}` : `/u/${fid}`;

  return {
    name: `Farcasturd #${fid}`,
    description: "Generate your unique Farcasturd! Unique poop tied to your Farcaster.",
    image: "/placeholder.png", // Add a placeholder image to your public folder
    external_url: externalUrl,
    attributes: [
      { trait_type: "FID", value: fid },
      { trait_type: "Status", value: "Not Generated" },
    ],
  };
}