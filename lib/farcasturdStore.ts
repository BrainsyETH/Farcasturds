// lib/farcasturdStore.ts
import { getFarcasterProfile } from "./farcasterClient";
import { generateFarcasterdImage } from "./farcasturdAi";
import { getFarcasturdRow, insertFarcasturdRow, type FarcasturdRow } from "./db";

const APP_BASE_URL = process.env.APP_BASE_URL!;

export type FarcasturdRecord = {
  fid: number;
  imageUrl: string;
  prompt: string;
  createdAt: string;
};

function mapRowToRecord(row: FarcasturdRow): FarcasturdRecord {
  return {
    fid: row.fid,
    // Image is served by our image route (see below)
    imageUrl: `${APP_BASE_URL}/api/image/${row.fid}`,
    prompt: row.prompt ?? "",
    createdAt: row.created_at,
  };
}

export async function getFarcasturd(fid: number): Promise<FarcasturdRecord | null> {
  const row = await getFarcasturdRow(fid);
  if (!row) return null;
  return mapRowToRecord(row);
}

export async function ensureFarcasturd(fid: number): Promise<FarcasturdRecord> {
  const existing = await getFarcasturd(fid);
  if (existing) return existing;

  // 1) Fetch Farcaster profile
  const profile = await getFarcasterProfile(fid);

  // 2) Generate the image via OpenAI
  const { imageBuffer, prompt } = await generateFarcasterdImage(fid, profile);

  // 3) Store base64 in Postgres
  const imageBase64 = imageBuffer.toString("base64");
  const row = await insertFarcasturdRow({
    fid,
    imageBase64,
    prompt,
  });

  return mapRowToRecord(row);
}

export function buildOnchainMetadata(record: FarcasturdRecord) {
  const externalUrl = `${APP_BASE_URL}/u/${record.fid}`;

  return {
    name: `Farcasturd #${record.fid}`,
    description:
      "Your 1:1 Farcasturd on Base — a non-transferable badge tied to your Farcaster ID. Generated once from a single Farcasturd prompt using the holder's Farcaster profile.",
    image: record.imageUrl,        // <- stable, persisted URL
    external_url: externalUrl,
    attributes: [
      { trait_type: "FID", value: record.fid },
      { trait_type: "Generation", value: "gpt-image-1 + Farcaster PFP context" },
    ],
  };
}
