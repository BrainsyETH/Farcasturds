// app/api/config/mint-price/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const mintPriceEth = process.env.MINT_PRICE_ETH || "0";

  return NextResponse.json({
    price: mintPriceEth,
    isFree: mintPriceEth === "0" || parseFloat(mintPriceEth) === 0.001,
  });
}
