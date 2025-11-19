// app/api/metadata/[fid]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFarcasturd, buildOnchainMetadata } from "@/lib/farcasturdStore";
import { farcasturdExists } from "@/lib/db";

type Params = { params: { fid: string } };

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: Params) {
  const fidNum = Number(params.fid);

  if (!fidNum || Number.isNaN(fidNum) || fidNum <= 0) {
    return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
  }

  try {
    // Check if farcasturd exists WITHOUT generating
    const exists = await farcasturdExists(fidNum);
    
    if (!exists) {
      // Return default/placeholder metadata
      return NextResponse.json({
        name: `Farcasturds #${fidNum}`,
        description: "Generate your unique Farcasturd!",
        image: "/placeholder.png",
        attributes: []
      }, {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate", // FIXED: Don't cache placeholder
        },
      });
    }

    // Only fetch existing farcasturd, don't generate
    const record = await getFarcasturd(fidNum);
    if (!record) {
      throw new Error("Farcasturd exists but couldn't be fetched");
    }
    
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