// lib/db.ts
import { sql } from "@vercel/postgres";

export type FarcasturdRow = {
  fid: number;
  image_base64: string;
  mime_type: string;
  prompt: string | null;
  created_at: string;
};

export async function getFarcasturdRow(fid: number): Promise<FarcasturdRow | null> {
  const result = await sql<FarcasturdRow>`
    SELECT fid, image_base64, mime_type, prompt, created_at
    FROM farcasturds
    WHERE fid = ${fid}
    LIMIT 1;
  `;

  return result.rows[0] ?? null;
}

export async function insertFarcasturdRow(params: {
  fid: number;
  imageBase64: string;
  mimeType?: string;
  prompt: string;
}): Promise<FarcasturdRow> {
  const { fid, imageBase64, mimeType = "image/png", prompt } = params;

  const result = await sql<FarcasturdRow>`
    INSERT INTO farcasturds (fid, image_base64, mime_type, prompt)
    VALUES (${fid}, ${imageBase64}, ${mimeType}, ${prompt})
    ON CONFLICT (fid) DO UPDATE
      SET image_base64 = EXCLUDED.image_base64,
          mime_type = EXCLUDED.mime_type,
          prompt = EXCLUDED.prompt
    RETURNING fid, image_base64, mime_type, prompt, created_at;
  `;

  return result.rows[0];
}
