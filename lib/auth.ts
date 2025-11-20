// lib/auth.ts
import { SiweMessage } from 'siwe'

export interface AuthState {
  isAuthenticated: boolean
  fid: number | null
  address: string | null
  signature: string | null
  message: string | null
}

/**
 * Generate a SIWE message for Farcaster authentication
 */
export function generateSiweMessage(params: {
  address: string
  chainId: number
  nonce: string
  fid: number
}): string {
  const message = new SiweMessage({
    domain: typeof window !== 'undefined' ? window.location.host : '',
    address: params.address,
    statement: `Sign in to Farcasturds with Farcaster\n\nFarcaster ID: ${params.fid}`,
    uri: typeof window !== 'undefined' ? window.location.origin : '',
    version: '1',
    chainId: params.chainId,
    nonce: params.nonce,
    issuedAt: new Date().toISOString(),
  })

  return message.prepareMessage()
}

/**
 * Generate a random nonce for SIWE
 */
export function generateNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify a SIWE signature on the backend
 */
export async function verifySiweSignature(params: {
  message: string
  signature: string
  nonce: string
}): Promise<{ success: boolean; fid?: number; address?: string; error?: string }> {
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.error || 'Verification failed' }
    }

    return {
      success: true,
      fid: data.fid,
      address: data.address
    }
  } catch (error) {
    console.error('Verification error:', error)
    return { success: false, error: 'Network error during verification' }
  }
}
