// app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { getFarcasterProfile } from '@/lib/farcasterClient'
import { JsonRpcProvider } from 'ethers'

// Shared provider for SIWE verification (supports EIP-1271 smart accounts)
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const baseProvider = new JsonRpcProvider(BASE_RPC_URL)

// Store used nonces to prevent replay attacks (in production, use Redis or DB)
const usedNonces = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const { message, signature, nonce } = await req.json()

    // Validate inputs
    if (!message || !signature || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields: message, signature, nonce' },
        { status: 400 }
      )
    }

    // Check for nonce reuse (prevent replay attacks)
    if (usedNonces.has(nonce)) {
      return NextResponse.json(
        { error: 'Nonce already used' },
        { status: 400 }
      )
    }

    // Parse and verify the SIWE message
    const siweMessage = new SiweMessage(message)
    const fields = await siweMessage.verify({
      signature,
      nonce,
      domain: siweMessage.domain,
      time: siweMessage.issuedAt,
      provider: baseProvider
    })

    if (!fields.success) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Extract FID from the statement
    const fidMatch = siweMessage.statement?.match(/FID: (\d+)/)
    if (!fidMatch) {
      return NextResponse.json(
        { error: 'FID not found in message' },
        { status: 400 }
      )
    }

    const fid = parseInt(fidMatch[1], 10)

    // Verify the FID belongs to the authenticated address
    // Fetch the user's Farcaster profile to verify ownership
    try {
      const profile = await getFarcasterProfile(fid)

      if (!profile) {
        return NextResponse.json(
          { error: 'Farcaster profile not found' },
          { status: 404 }
        )
      }

      // Verify the signing address matches the FID's verified addresses or custody address
      const signingAddress = siweMessage.address.toLowerCase()
      const verifiedAddresses = profile.verifiedAddresses || []
      const custodyAddress = profile.custodyAddress

      const isVerifiedAddress = verifiedAddresses.includes(signingAddress)
      const isCustodyAddress = custodyAddress && custodyAddress === signingAddress

      if (!isVerifiedAddress && !isCustodyAddress) {
        return NextResponse.json(
          {
            error: 'Wallet address does not match FID verified addresses',
            details: {
              fid,
              signingAddress,
              verifiedAddresses,
              custodyAddress
            }
          },
          { status: 403 }
        )
      }

      console.log(`[Auth] ✓ FID ${fid} ownership verified for address ${signingAddress}`)

    } catch (error) {
      console.error('Error fetching Farcaster profile:', error)
      return NextResponse.json(
        { error: 'Failed to verify Farcaster identity' },
        { status: 500 }
      )
    }

    // Mark nonce as used
    usedNonces.add(nonce)

    // Clean up old nonces after 10 minutes (prevent memory leak)
    setTimeout(() => usedNonces.delete(nonce), 10 * 60 * 1000)

    return NextResponse.json({
      success: true,
      fid,
      address: siweMessage.address,
      verified: true
    })

  } catch (error: any) {
    console.error('SIWE verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}
