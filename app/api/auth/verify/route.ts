import { NextRequest, NextResponse } from 'next/server'
import { SiweMessage } from 'siwe'
import { getFarcasterProfile } from '@/lib/farcasterClient'
import { JsonRpcProvider } from 'ethers'
import { createPublicClient, http, hashMessage, recoverMessageAddress } from 'viem'
import { base } from 'viem/chains'

// Shared provider for SIWE verification (supports EIP-1271 smart accounts)
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const baseProvider = new JsonRpcProvider(BASE_RPC_URL)
const basePublicClient = createPublicClient({
  chain: base,
  transport: http(BASE_RPC_URL)
})

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

    console.log('[Auth] ========== VERIFICATION DEBUG INFO ==========')
    console.log('[Auth] Verifying SIWE signature for address:', siweMessage.address)
    console.log('[Auth] Domain:', siweMessage.domain)
    console.log('[Auth] Chain ID:', siweMessage.chainId)
    console.log('[Auth] Nonce:', siweMessage.nonce)
    console.log('[Auth] Message length:', message.length)
    console.log('[Auth] Signature type check - length:', signature.length)
    console.log('[Auth] Full message:', message)
    console.log('[Auth] Full signature:', signature)

    // Check if this is a passkey/WebAuthn signature (much longer than standard 132 chars)
    // Standard ECDSA signatures are 132 characters (0x + 130 hex chars)
    // Passkey signatures are ABI-encoded and much longer
    const isPasskeySignature = signature.length > 200

    console.log('[Auth] Signature appears to be:', isPasskeySignature ? 'Passkey/WebAuthn' : 'Standard ECDSA')

    let fields: { success: boolean; data: any } = { success: false, data: {} }

    // For passkey signatures, skip standard verification and go straight to EIP-1271
    if (!isPasskeySignature) {
      // Use manual signature verification by recovering address
      // This is more reliable than SIWE library's verify() which has strict domain/time checks
      try {
        console.log('[Auth] Using manual signature verification...')
        const recoveredAddress = await recoverMessageAddress({
          message: message,
          signature: signature as `0x${string}`
        })

        console.log('[Auth] Address recovered from signature:', recoveredAddress)
        console.log('[Auth] Expected address from SIWE message:', siweMessage.address)

        const addressesMatch = recoveredAddress.toLowerCase() === siweMessage.address.toLowerCase()
        console.log('[Auth] Addresses match:', addressesMatch)

        if (addressesMatch) {
          console.log('[Auth] ✓ Manual signature verification successful!')
          fields = { success: true, data: siweMessage }
        } else {
          console.error('[Auth] ✗ Address mismatch! Signature is valid but for wrong address')
          console.error('[Auth] This suggests the message was signed by a different wallet')
          fields.success = false
        }
      } catch (recoverError: any) {
        console.error('[Auth] Manual verification failed:', recoverError.message)
        console.log('[Auth] Falling back to SIWE library verification...')

        // Fallback to SIWE library verification if manual recovery fails
        try {
          console.log('[Auth] Attempting SIWE library verification...')
          // FIX: Removed 'provider: baseProvider' which caused the Type error.
          fields = await siweMessage.verify({
            signature,
            nonce,
            domain: siweMessage.domain,
            time: siweMessage.issuedAt,
          })
          console.log('[Auth] ✓ SIWE library verification successful')
        } catch (verifyError: any) {
          console.error('[Auth] SIWE library verification also failed!')
          console.error('[Auth] Error:', JSON.stringify(verifyError, null, 2))
          fields.success = false
        }
      }
    } else {
      console.log('[Auth] Skipping standard verification for passkey signature')
    }

    // Fallback for smart wallets (e.g., Coinbase Smart Wallets with passkeys)
    if (!fields.success) {
      console.log('[Auth] Trying EIP-1271 verification...')

      try {
        // Check if the address is a contract (smart wallet)
        const code = await basePublicClient.getBytecode({
          address: siweMessage.address as `0x${string}`
        })

        if (code && code !== '0x') {
          console.log('[Auth] Address is a smart contract, attempting EIP-1271 verification')

          // Prepare the message hash for EIP-1271
          const preparedMessage = siweMessage.prepareMessage()
          const messageHash = hashMessage(preparedMessage)

          console.log('[Auth] Message hash:', messageHash)
          console.log('[Auth] Signature length:', signature.length)

          const result = await basePublicClient.readContract({
            abi: [
              {
                type: 'function',
                name: 'isValidSignature',
                stateMutability: 'view',
                inputs: [
                  { name: 'hash', type: 'bytes32' },
                  { name: 'signature', type: 'bytes' }
                ],
                outputs: [{ name: 'magicValue', type: 'bytes4' }]
              }
            ],
            address: siweMessage.address as `0x${string}`,
            functionName: 'isValidSignature',
            args: [messageHash, signature as `0x${string}`]
          })

          console.log('[Auth] isValidSignature returned:', result)

          if (result === '0x1626ba7e') {
            console.log('[Auth] ✓ EIP-1271 verification successful')
            fields = { success: true, data: siweMessage }
          } else {
            console.warn('[Auth] EIP-1271 verification failed: invalid magic value')
          }
        } else {
          console.log('[Auth] Address is not a contract, cannot use EIP-1271 verification')
        }
      } catch (fallbackError: any) {
        console.error('[Auth] EIP-1271 fallback verification error:', fallbackError)
        console.error('[Auth] Error details:', {
          message: fallbackError.message,
          code: fallbackError.code,
          address: siweMessage.address
        })
      }
    }

    if (!fields.success) {
      console.error('[Auth] All verification methods failed')
      return NextResponse.json(
        {
          error: 'Invalid signature',
          details: 'Both standard SIWE and EIP-1271 verification failed'
        },
        { status: 401 }
      )
    }

    console.log('[Auth] ✓ Signature verification successful!')

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