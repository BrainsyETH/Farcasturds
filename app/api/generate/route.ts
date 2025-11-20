// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ensureFarcasturd } from "@/lib/farcasturdStore";

export async function POST(req: NextRequest) {
  try {
    const { fid } = await req.json();

    // Input validation: Check type
    if (!fid || typeof fid !== "number") {
      return NextResponse.json(
        { error: "Valid FID required" },
        { status: 400 }
      );
    }

    // Security: Validate FID is a positive integer
    if (fid <= 0 || !Number.isInteger(fid)) {
      return NextResponse.json(
        { error: "FID must be a positive integer" },
        { status: 400 }
      );
    }

    // Security Note: In production, implement:
    // 1. FID ownership verification (Farcaster Auth/signature)
    // 2. Rate limiting per FID/IP to prevent API quota abuse
    // 3. Check that user hasn't already generated (before calling ensureFarcasturd)
    // Current implementation allows anyone to generate for any FID - NOT SECURE

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