'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSignMessage } from 'wagmi'
import { parseEther } from 'viem'
import { farcasturdsV2Abi } from '@/abi/FarcasturdsV2'
import { generateSiweMessage, generateNonce, verifySiweSignature } from '@/lib/auth'
import { base } from 'wagmi/chains'

interface MintModalProps {
  isOpen: boolean
  onClose: () => void
  fid: number
  imageUrl?: string
  onSuccess: (txHash: string) => void
}

export function MintModal({ isOpen, onClose, fid, imageUrl, onSuccess }: MintModalProps) {
  const { address } = useAccount()
  const [mintPrice, setMintPrice] = useState<string>('0')
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [authNonce, setAuthNonce] = useState<string | null>(null)
  const [siweMessage, setSiweMessage] = useState<string | null>(null)
  const [siweSignature, setSiweSignature] = useState<string | null>(null)
  const [mintAuthorization, setMintAuthorization] = useState<{
    deadline: number
    signature: string
  } | null>(null)

  const {
    data: hash,
    writeContract,
    isPending,
    isError: isWriteError,
    error: writeError
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const {
    data: signature,
    signMessage,
    isPending: isSignPending,
    isError: isSignError,
    error: signError
  } = useSignMessage()

  // Fetch mint price from contract
  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch('/api/config/mint-price')
        if (res.ok) {
          const data = await res.json()
          setMintPrice(data.price || '0')
        }
      } catch (err) {
        console.error('Failed to fetch mint price:', err)
      }
    }
    if (isOpen) {
      fetchPrice()
    }
  }, [isOpen])

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setStatus('✓ Farcasturd minted successfully!')
      onSuccess(hash)
      setTimeout(() => {
        onClose()
      }, 2000)
    }
  }, [isConfirmed, hash, onSuccess, onClose])

  // Handle transaction errors
  useEffect(() => {
    if (isWriteError && writeError) {
      const errorMessage = writeError.message || 'Transaction failed'
      setError(errorMessage)
      setStatus('')
    }
  }, [isWriteError, writeError])

  // Handle signature errors
  useEffect(() => {
    if (isSignError && signError) {
      const errorMessage = signError.message || 'Signature failed'
      setError(errorMessage)
      setStatus('')
    }
  }, [isSignError, signError])

  // Verify signature when received
  useEffect(() => {
    if (signature && siweMessage && authNonce) {
      handleVerifySignature(signature, siweMessage, authNonce)
    }
  }, [signature, siweMessage, authNonce])

  // Reset authentication when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsAuthenticated(false)
      setAuthNonce(null)
      setSiweMessage(null)
      setSiweSignature(null)
      setMintAuthorization(null)
      setStatus('')
      setError('')
    }
  }, [isOpen])

  const handleRequestSignature = useCallback(async () => {
    if (!address) {
      setError('No wallet connected')
      return
    }

    setStatus('Requesting signature to verify ownership...')
    setError('')

    try {
      // Generate nonce and SIWE message
      const nonce = generateNonce()
      const message = generateSiweMessage({
        address,
        chainId: base.id,
        nonce,
        fid
      })

      setAuthNonce(nonce)
      setSiweMessage(message)

      // Request signature from wallet
      signMessage({ message })
    } catch (err: any) {
      console.error('Signature request error:', err)
      setError(err.message || 'Failed to request signature')
      setStatus('')
    }
  }, [address, fid, signMessage])

  const handleVerifySignature = useCallback(async (
    sig: string,
    msg: string,
    nonce: string
  ) => {
    setStatus('Verifying signature...')

    try {
      const result = await verifySiweSignature({
        message: msg,
        signature: sig,
        nonce
      })

      if (result.success) {
        // Store SIWE signature for authorization request
        setSiweSignature(sig)
        setIsAuthenticated(true)

        // Fetch mint authorization from backend
        setStatus('Getting mint authorization...')

        if (!address) {
          throw new Error('No wallet address')
        }

        const authResponse = await fetch('/api/mint/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            to: address,
            siweSignature: sig,
            siweMessage: msg,
            nonce
          })
        })

        if (!authResponse.ok) {
          const authError = await authResponse.json()
          throw new Error(authError.error || 'Failed to get mint authorization')
        }

        const authData = await authResponse.json()
        setMintAuthorization({
          deadline: authData.deadline,
          signature: authData.signature
        })

        setStatus('✓ Authorized! You can now mint.')
        setError('')
      } else {
        setError(result.error || 'Signature verification failed')
        setStatus('')
        setIsAuthenticated(false)
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Failed to verify signature')
      setStatus('')
      setIsAuthenticated(false)
      setSiweSignature(null)
      setMintAuthorization(null)
    }
  }, [address, fid])

  const handleMint = useCallback(async () => {
    if (!address) {
      setError('No wallet connected')
      return
    }

    if (!isAuthenticated) {
      setError('Please verify your signature first')
      return
    }

    if (!mintAuthorization) {
      setError('Missing mint authorization. Please try verifying again.')
      return
    }

    setStatus('Preparing transaction...')
    setError('')

    try {
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`

      if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured')
      }

      // TODO: Update to use farcasturdsV3Abi once generated
      // For now, using V2 ABI as placeholder - MUST UPDATE BEFORE DEPLOYMENT
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: farcasturdsV2Abi, // TODO: Change to farcasturdsV3Abi
        functionName: 'mintFor',
        args: [
          address,
          BigInt(fid),
          BigInt(mintAuthorization.deadline),
          mintAuthorization.signature as `0x${string}`
        ],
        value: parseEther(mintPrice || '0'),
      })

      setStatus('Please confirm the transaction in your wallet...')
    } catch (err: any) {
      console.error('Mint error:', err)
      setError(err.message || 'Failed to initiate transaction')
      setStatus('')
    }
  }, [address, fid, mintPrice, writeContract, isAuthenticated, mintAuthorization])

  useEffect(() => {
    if (isConfirming) {
      setStatus('Transaction submitted! Waiting for confirmation...')
    }
  }, [isConfirming])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-purple-900 to-purple-950 rounded-2xl max-w-md w-full p-6 border-2 border-purple-500 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">💩 Mint Your Turd</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            disabled={isPending || isConfirming}
          >
            ×
          </button>
        </div>

        {/* Note: Image generates AFTER mint confirms */}

        {/* Price Display */}
        <div className="mb-4 bg-purple-800 bg-opacity-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Mint Price:</span>
            <span className="text-xl font-bold text-white">
              {mintPrice === '0' ? 'Free' : `${mintPrice} ETH`}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-gray-300">FID:</span>
            <span className="text-white font-mono">#{fid}</span>
          </div>
          {address && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-300">To:</span>
              <span className="text-white font-mono text-sm">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {status && (
          <div className="mb-4 p-3 bg-blue-600 bg-opacity-30 border border-blue-400 rounded-lg text-blue-200 text-sm">
            {status}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-600 bg-opacity-30 border border-red-400 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Transaction Hash */}
        {hash && (
          <div className="mb-4 p-3 bg-green-600 bg-opacity-30 border border-green-400 rounded-lg">
            <p className="text-green-200 text-sm mb-2">Transaction Hash:</p>
            <a
              href={`https://basescan.org/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 hover:text-green-100 text-xs font-mono break-all underline"
            >
              {hash}
            </a>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending || isConfirming || isSignPending}
          >
            {isConfirmed ? 'Close' : 'Cancel'}
          </button>

          {!isAuthenticated ? (
            <button
              onClick={handleRequestSignature}
              disabled={isSignPending || !address}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105"
            >
              {isSignPending ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing...
                </span>
              ) : (
                '🔏 Verify Signature'
              )}
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={isPending || isConfirming || isConfirmed || !address || !isAuthenticated}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105"
            >
              {isPending || isConfirming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isPending ? 'Confirming...' : 'Processing...'}
                </span>
              ) : isConfirmed ? (
                '✓ Minted!'
              ) : (
                `💩 Mint ${mintPrice === '0' ? 'Free' : `for ${mintPrice} ETH`}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
