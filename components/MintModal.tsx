'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { farcasturdsAbi } from '@/abi/Farcasturds'

interface MintModalProps {
  isOpen: boolean
  onClose: () => void
  fid: number
  imageUrl: string
  onSuccess: (txHash: string) => void
}

export function MintModal({ isOpen, onClose, fid, imageUrl, onSuccess }: MintModalProps) {
  const { address } = useAccount()
  const [mintPrice, setMintPrice] = useState<string>('0')
  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')

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

  const handleMint = async () => {
    if (!address) {
      setError('No wallet connected')
      return
    }

    setStatus('Preparing transaction...')
    setError('')

    try {
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`

      if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured')
      }

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: farcasturdsAbi,
        functionName: 'mintFor',
        args: [address, BigInt(fid)],
        value: parseEther(mintPrice || '0'),
      })

      setStatus('Please confirm the transaction in your wallet...')
    } catch (err: any) {
      console.error('Mint error:', err)
      setError(err.message || 'Failed to initiate transaction')
      setStatus('')
    }
  }

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

        {/* Image Preview */}
        {imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border-2 border-purple-400">
            <img
              src={imageUrl}
              alt="Your Farcasturd"
              className="w-full h-auto"
            />
          </div>
        )}

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
              href={`https://sepolia.basescan.org/tx/${hash}`}
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
            disabled={isPending || isConfirming}
          >
            {isConfirmed ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleMint}
            disabled={isPending || isConfirming || isConfirmed || !address}
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
              `Mint ${mintPrice === '0' ? 'Free' : `for ${mintPrice} ETH`}`
            )}
          </button>
        </div>

        {/* Info Note */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>🔒 One mint per FID • Transaction on Base Sepolia</p>
        </div>
      </div>
    </div>
  )
}
