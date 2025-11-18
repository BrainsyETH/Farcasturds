// lib/db.ts
import { put, head } from "@vercel/blob";

export type FarcasturdRow = {
  fid: number;
  image_base64: string;
  mime_type: string;
  prompt: string | null;
  created_at: string;
};

export async function getFarcasturdRow(fid: number): Promise<FarcasturdRow | null> {
  try {
    // Use Vercel Blob head() to check if it exists
    const blobPath = `farcasturds/${fid}.png`;
    const metadata = await head(blobPath);
    
    if (!metadata) {
      return null;
    }

    // Fetch the actual blob
    const response = await fetch(metadata.url);
    if (!response.ok) {
      console.error(`[DB] Failed to fetch blob: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return {
      fid,
      image_base64: base64,
      mime_type: "image/png",
      prompt: null, // No metadata storage without KV
      created_at: metadata.uploadedAt?.toISOString() || new Date().toISOString(),
    };
  } catch (error) {
    console.error(`[DB] Error fetching farcasturd for FID ${fid}:`, error);
    return null;
  }
}

export async function insertFarcasturdRow(params: {
  fid: number;
  imageBase64: string;
  mimeType?: string;
  prompt: string;
}): Promise<FarcasturdRow> {
  const { fid, imageBase64, mimeType = "image/png", prompt } = params;

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(imageBase64, "base64");

    // Upload to Vercel Blob
    const blob = await put(`farcasturds/${fid}.png`, buffer, {
      access: 'public',
      allowOverwrite: true, 
    });

    const created_at = new Date().toISOString();

    console.log(`[DB] ✓ Uploaded farcasturd to ${blob.url}`);

    return {
      fid,
      image_base64: imageBase64,
      mime_type: mimeType,
      prompt,
      created_at,
    };
  } catch (error) {
    console.error("[DB] Error inserting farcasturd:", error);
    throw error;
  }
}

// Helper function to check if farcasturd exists
export async function farcasturdExists(fid: number): Promise<boolean> {
  try {
    const metadata = await head(`farcasturds/${fid}.png`);
    return !!metadata;
  } catch (error) {
    // head() throws if blob doesn't exist
    return false;
  }
}