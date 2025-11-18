// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ensureFarcasturd } from "@/lib/farcasturdStore";

export async function POST(req: NextRequest) {
  try {
    const { fid } = await req.json();

    if (!fid || typeof fid !== "number") {
      return NextResponse.json(
        { error: "Valid FID required" },
        { status: 400 }
      );
    }

    console.log(`[Generate] Starting generation for FID ${fid}`);

    // This will:
    // 1. Fetch Farcaster profile from Neynar
    // 2. Generate AI image via OpenAI
    // 3. Store base64 image in Postgres
    const record = await ensureFarcasturd(fid);

    console.log(`[Generate] Successfully generated for FID ${fid}`);

    return NextResponse.json({
      success: true,
      fid: record.fid,
      imageUrl: record.imageUrl,
      prompt: record.prompt,
    });
  } catch (err: any) {
    console.error("[Generate] Error:", err);
    return NextResponse.json(
      { error: err.message || "Generation failed" },
      { status: 500 }
    );
  }
}