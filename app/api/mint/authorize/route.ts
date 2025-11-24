// app/api/mint/authorize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'
import { keccak256, toBytes, toHex } from 'viem'

/**
 * POST /api/mint/authorize
 *
 * Generates a backend signature authorizing a mint after verifying:
 * 1. SIWE signature is valid (from /api/auth/verify)
 * 2. FID ownership is confirmed
 * 3. User hasn't already minted
 *
 * Returns signature that user includes in contract call.
 */
export async function POST(req: NextRequest) {
  try {
    const { fid, to, siweSignature, siweMessage, nonce } = await req.json()

    // Validate inputs
    if (!fid || !to || !siweSignature || !siweMessage || !nonce) {
      return NextResponse.json(
        { error: 'Missing required fields: fid, to, siweSignature, siweMessage, nonce' },
        { status: 400 }
      )
    }

    // Verify SIWE signature and FID ownership
    const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: siweMessage,
        signature: siweSignature,
        nonce
      })
    })

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json()
      return NextResponse.json(
        { error: `FID ownership verification failed: ${error.error}` },
        { status: 403 }
      )
    }

    const verifyData = await verifyResponse.json()

    // Ensure the verified FID matches the requested FID
    if (verifyData.fid !== fid) {
      return NextResponse.json(
        { error: 'FID mismatch: verified FID does not match requested FID' },
        { status: 403 }
      )
    }

    // Ensure the verified address matches the recipient address
    if (verifyData.address.toLowerCase() !== to.toLowerCase()) {
      return NextResponse.json(
        { error: 'Address mismatch: verified address does not match recipient' },
        { status: 403 }
      )
    }

    // Check if FID already minted (optional - contract will also check)
    // This saves gas if user already minted
    const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`
    if (!CONTRACT_ADDRESS) {
      return NextResponse.json(
        { error: 'Contract address not configured' },
        { status: 500 }
      )
    }

    // TODO: Add contract check for hasMinted[fid]
    // For now, let the contract handle it

    // Generate authorization signature
    const BACKEND_PRIVATE_KEY = process.env.FARCASTURDS_BACKEND_PRIVATE_KEY as `0x${string}`
    if (!BACKEND_PRIVATE_KEY) {
      console.error('[Authorize] FARCASTURDS_BACKEND_PRIVATE_KEY not configured')
      return NextResponse.json(
        { error: 'Backend signing not configured' },
        { status: 500 }
      )
    }

    const account = privateKeyToAccount(BACKEND_PRIVATE_KEY)

    // Set deadline to 5 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + (5 * 60)

    // Create message hash matching contract's keccak256(abi.encodePacked(to, fid, deadline))
    const messageHash = keccak256(
      toBytes(
        `0x${to.slice(2).padStart(64, '0')}${fid.toString(16).padStart(64, '0')}${deadline.toString(16).padStart(64, '0')}`
      )
    )

    // Sign the message hash
    const signature = await account.signMessage({
      message: { raw: messageHash }
    })

    console.log(`[Authorize] ✓ Signed mint authorization for FID ${fid} to ${to}`)
    console.log(`[Authorize] Deadline: ${new Date(deadline * 1000).toISOString()}`)

    return NextResponse.json({
      success: true,
      fid,
      to,
      deadline,
      signature,
      expiresAt: new Date(deadline * 1000).toISOString()
    })

  } catch (error: any) {
    console.error('[Authorize] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Authorization failed' },
      { status: 500 }
    )
  }
}
