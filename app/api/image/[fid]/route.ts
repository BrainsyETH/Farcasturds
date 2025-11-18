// app/api/image/[fid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFarcasturdRow } from "@/lib/db";

type Params = { params: { fid: string } };

export const runtime = "nodejs"; // ensure Node, not edge (for Buffer, Postgres)

export async function GET(_req: NextRequest, { params }: Params) {
  const fidNum = Number(params.fid);

  if (!fidNum || Number.isNaN(fidNum) || fidNum <= 0) {
    return new NextResponse("Invalid FID", { status: 400 });
  }

  const row = await getFarcasturdRow(fidNum);
  if (!row) {
    return new NextResponse("Farcasturd not found", { status: 404 });
  }

  const buffer = Buffer.from(row.image_base64, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": row.mime_type || "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
