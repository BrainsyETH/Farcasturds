// app/api/metadata/[fid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ensureFarcasturd, buildOnchainMetadata } from "@/lib/farcasturdStore";

type Params = { params: { fid: string } };

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: Params) {
  const fidNum = Number(params.fid);

  if (!fidNum || Number.isNaN(fidNum) || fidNum <= 0) {
    return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
  }

  try {
    const record = await ensureFarcasturd(fidNum);
    const metadata = buildOnchainMetadata(record);

    return NextResponse.json(metadata, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: any) {
    console.error("Metadata error for fid", fidNum, err);
    return NextResponse.json(
      { error: "Failed to generate metadata", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
