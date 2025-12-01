"use client"; // <--- ADDED THIS DIRECTIVE

import { useEffect, useState } from 'react';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { BaseError, parseEther } from 'viem';
import { useSearchParams } from 'next/navigation';
import { FarcasturdsV3 as FarcasturdsContract } from '@/abi/FarcasturdsV3';
import { useFarcasturdStore } from '@/lib/farcasturdStore';
import { FarcasturdsAddress } from '@/lib/wagmi';

// Define the shape of the UI state for the mini-app
type UiState = 'initial' | 'generating' | 'generated' | 'minting' | 'minted' | 'error';

// This is the primary client component for the Farcaster mini-app.
export default function ShareMiniApp() {
  const params = useSearchParams();
  const fid = params.get('fid');
  const castHash = params.get('castHash');

  const { address } = useAccount();
  const { farcasturd, fetchFarcasturd, fetchMintPrice, mintPrice } = useFarcasturdStore();
  
  const [uiState, setUiState] = useState<UiState>('initial');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Wagmi hook for contract interaction (minting)
  const {
    data: hash,
    error: writeError,
    isPending,
    writeContract
  } = useWriteContract();

  // Wagmi hook for waiting for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  // --- Utility Functions ---

  const formatCastText = () => {
    if (!farcasturd) return '';
    
    // Construct the text content for the cast
    // The cast should include the text, the unique image URL, and a mention of the bot
    const frameUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/share-scores?fid=${fid}&_=${Date.now()}`;
    const urlEncoded = encodeURIComponent(frameUrl);
    
    // Use the official Farcaster short URL for the frame.
    // The text content should be short and engaging to encourage users to click the image.
    return `gm frens, check out my Farcasturd NFT score! @farcasturds.eth ${frameUrl}`;
  };

  const handleMint = async () => {
    if (!address || !mintPrice) {
      setErrorMsg('Wallet not connected or mint price not loaded.');
      return;
    }
    
    setUiState('minting');
    setErrorMsg(null);

    try {
      // Prepare call parameters
      const mintValue = parseEther(mintPrice.toString());

      writeContract({
        address: FarcasturdsAddress,
        abi: FarcasturdsContract.abi,
        functionName: 'mint',
        args: [
          address, // recipient
          fid ? BigInt(fid) : 0n // fid
        ],
        value: mintValue,
        gas: 500000n, // Set a fixed gas limit as a fallback
      });

    } catch (err) {
      console.error("Mint Error:", err);
      const error = err as BaseError;
      setErrorMsg(error.shortMessage || 'Failed to authorize transaction.');
      setUiState('generated');
    }
  };

  // --- Effects ---

  // Load Farcasturd NFT metadata on component load or fid change
  useEffect(() => {
    if (fid) {
      fetchFarcasturd(fid);
      fetchMintPrice();
    }
  }, [fid, fetchFarcasturd, fetchMintPrice]);

  // Handle errors from the wagmi writeContract hook
  useEffect(() => {
    if (writeError) {
      const error = writeError as BaseError;
      setErrorMsg(error.shortMessage || 'Transaction failed.');
      setUiState('generated');
    }
  }, [writeError]);

  // Handle successful transaction confirmation
  useEffect(() => {
    if (isConfirmed) {
      setUiState('minted');
    }
  }, [isConfirmed]);

  // Update UI state based on pending/confirming status
  useEffect(() => {
    if (isPending || isConfirming) {
      setUiState('minting');
    }
  }, [isPending, isConfirming]);

  // Determine what to display based on Farcasturd data availability
  useEffect(() => {
    if (farcasturd && farcasturd.fid.toString() === fid) {
      if (farcasturd.isMinted) {
        setUiState('minted');
      } else if (uiState === 'initial') {
        setUiState('generated');
      }
    }
  }, [farcasturd, fid, uiState]);


  const isGeneratingOrMinting = uiState === 'generating' || uiState === 'minting';
  const showComposer = uiState === 'generated';
  const isMinted = uiState === 'minted';
  
  // Dynamic image URL for the preview, ensuring it busts cache
  const previewImage = farcasturd ? `${process.env.NEXT_PUBLIC_APP_URL}/api/image/${farcasturd.fid}?_=${Date.now()}` : '/public/preview.png';

  // Cast action URL to initiate the Farcaster post
  const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(formatCastText())}`;


  // --- Render Logic ---

  return (
    <div className="flex flex-col items-center justify-start min-h-screen pt-4 bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-6 text-yellow-400">Share Your Farcasturd Score</h1>
      
      {/* FIX: Added an explicit max-w-lg and an aspect ratio wrapper to ensure the preview 
        image and composer space are always correctly sized and visible. The default 
        Next.js container behavior was likely hiding the content by relying on intrinsic 
        size which was missing. 
      */}
      <div className="w-full max-w-lg mb-8 bg-gray-800 rounded-xl shadow-2xl p-4 md:p-6 space-y-6">
        
        {/* Preview Image Section */}
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-3">Farcaster Preview</h2>
          <div className="relative w-full aspect-square bg-gray-700 rounded-lg overflow-hidden border-4 border-yellow-500">
            {farcasturd && (
              <img
                src={previewImage}
                alt="Farcaster Frame Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/public/preview.png';
                }}
              />
            )}
            {!farcasturd && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Loading Score...
              </div>
            )}
          </div>
        </div>

        {/* Composer/Action Section (This is the Farcaster Composer replacement) */}
        {showComposer && (
          <div className="flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold">Ready to Cast!</h2>
            <p className="text-gray-400 text-center">
              The preview above shows the image that will be shared. Click the button to cast!
            </p>
            <a 
              href={castUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full text-center px-6 py-3 bg-fuchsia-600 text-white font-bold rounded-lg shadow-lg hover:bg-fuchsia-700 transition duration-200"
            >
              Cast on Farcaster
            </a>
          </div>
        )}

        {/* Minting/Minted State Display */}
        {isGeneratingOrMinting && (
          <div className="text-center p-4 bg-yellow-900/50 rounded-lg">
            <p className="font-semibold animate-pulse">
              {uiState === 'generating' ? 'Generating NFT Score...' : 'Minting in progress... Please confirm transaction.'}
            </p>
          </div>
        )}

        {isMinted && (
          <div className="text-center p-4 bg-green-900/50 rounded-lg">
            <p className="font-semibold text-green-300">
              Your Farcasturd NFT has been minted and is ready to share!
            </p>
            <a 
              href={castUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-4 inline-block px-6 py-3 bg-fuchsia-600 text-white font-bold rounded-lg shadow-lg hover:bg-fuchsia-700 transition duration-200"
            >
              Cast Your Mint
            </a>
          </div>
        )}

        {/* Mint Button / Alternative Action */}
        {!isMinted && !showComposer && !isGeneratingOrMinting && (
           <div className="flex flex-col items-center space-y-4">
              <h2 className="text-xl font-semibold text-center">Mint Your Farcasturd</h2>
              <p className="text-gray-400 text-center">
                Mint Price: {mintPrice?.toString() || 'Loading...'} ETH
              </p>
              <button 
                onClick={handleMint}
                disabled={!address || isGeneratingOrMinting || !mintPrice}
                className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-lg hover:bg-green-600 disabled:bg-gray-500 transition duration-200"
              >
                {address ? (isPending ? 'Waiting for wallet confirmation...' : 'Mint Farcasturd NFT') : 'Connect Wallet to Mint'}
              </button>
            </div>
        )}
        
        {/* Error Message Display */}
        {errorMsg && (
          <div className="text-center p-3 bg-red-900/50 rounded-lg text-red-300">
            <p className="font-semibold">Error:</p>
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Adding a placeholder for visibility that mimics the app container */}
      <div className="w-full max-w-lg text-center text-gray-500 text-xs">
          This layout is optimized for the Farcaster mini-app view.
      </div>
    </div>
  );
}

// Ensure proper tree-shaking and component-level caching
ShareMiniApp.displayName = "ShareMiniApp";