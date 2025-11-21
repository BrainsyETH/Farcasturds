'use client';

import React, { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { MintModal } from '@/components/MintModal';
import { farcasturdsV2Abi } from '@/abi/FarcasturdsV2';
import { generateSiweMessage, generateNonce, verifySiweSignature } from '@/lib/auth';
import TabNavigation, { TabId } from '@/components/TabNavigation';
import Leaderboard from '@/components/Leaderboard';

type MeResponse = {
  fid: number;
  username: string;
  displayName?: string;
  wallet: string;
  pfpUrl?: string;
  hasMinted?: boolean;
};

type Metadata = {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: { trait_type: string; value: string | number | boolean }[];
};

function truncateAddress(addr: string, chars = 4) {
  if (!addr) return "";
  if (addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, chars + 2)}…${addr.slice(-chars)}`;
}

function getBaseScanTxUrl(txHash: string) {
  return `https://basescan.org/tx/${txHash}`;
}

export default function HomePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [minting, setMinting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [mintPrice, setMintPrice] = useState<string>("Free");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const [authNonce, setAuthNonce] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('mint');

  // Track processed transaction hashes to prevent duplicate generation
  const processedTxHashes = useRef<Set<string>>(new Set());

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // Contract interaction hooks for direct minting
  const {
    data: mintTxHash,
    writeContract,
    isPending: isMintPending,
    isError: isMintError,
    error: mintError
  } = useWriteContract();

  const { isLoading: isMintConfirming, isSuccess: isMintConfirmed } =
    useWaitForTransactionReceipt({
      hash: mintTxHash,
    });

  // Initialize SDK + load Farcaster user with retry logic
  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 5; // Increased retries

    // Helper to add timeout to any promise
    function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
        )
      ]);
    }

    async function initializeApp() {
      try {
        console.log("[App] Initializing Farcaster SDK...");

        let viewerFid: number | undefined;

        // PRIORITY 1: Check URL params first (for testing and direct access)
        const params = new URLSearchParams(window.location.search);
        const fidParam = params.get('fid');

        if (fidParam) {
          viewerFid = parseInt(fidParam, 10);
          if (!isNaN(viewerFid)) {
            console.log("[App] ✓ Using FID from URL param:", viewerFid);
          } else {
            viewerFid = undefined;
          }
        }

        // PRIORITY 2: If no URL param, try SDK context with retry logic
        if (!viewerFid) {
          while (!viewerFid && retryCount < maxRetries && mounted) {
            // Progressive wait times: 400ms, 600ms, 1000ms, 1600ms, 2400ms
            const waitTime = 400 + (retryCount * 400) + (retryCount * retryCount * 100);
            console.log(`[App] Waiting ${waitTime}ms before attempt ${retryCount + 1}...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));

            try {
              console.log(`[App] Attempt ${retryCount + 1}/${maxRetries}: Fetching SDK context...`);

              // CRITICAL: sdk.context is a Promise that must be awaited with timeout!
              // Add 3 second timeout to prevent infinite hanging
              const context = await withTimeout(
                sdk.context,
                3000,
                `SDK context timeout after 3s (attempt ${retryCount + 1})`
              );
              console.log("[App] ✓ Context loaded:", context);

              if (context?.user?.fid) {
                viewerFid = context.user.fid;
                console.log("[App] ✓ FID from SDK context:", viewerFid);

                if (viewerFid && !isNaN(viewerFid) && viewerFid > 0) {
                  console.log("[App] ✓ Successfully loaded FID:", viewerFid);
                  break;
                }
              } else {
                console.warn("[App] No user.fid in context:", context);
              }
            } catch (contextError) {
              console.warn(`[App] Attempt ${retryCount + 1} error:`, contextError);
            }

            retryCount++;
          }
        }

        // Check environment for better error messages
        // Exclude production domain (farcasturds.vercel.app) from development check
        const isDevelopment =
          window.location.hostname.includes('localhost') ||
          window.location.hostname.includes('127.0.0.1') ||
          (window.location.hostname.includes('vercel.app') && window.location.hostname !== 'farcasturds.vercel.app') ||
          process.env.NODE_ENV === 'development';

        // Final validation
        if (!viewerFid || isNaN(viewerFid)) {
          if (isDevelopment) {
            console.error("[App] Development mode: No FID available");
            throw new Error(
              "Testing mode: Add ?fid=YOUR_FID to the URL\n\n" +
              "Example: " + window.location.origin + "?fid=198116"
            );
          } else {
            console.error("[App] Production: No FID after", retryCount, "retries");
            throw new Error(
              "Unable to connect to Farcaster.\n\n" +
              "Please try:\n" +
              "1. Refreshing the frame\n" +
              "2. Reopening the app\n" +
              "3. Checking your Farcaster connection"
            );
          }
        }

        if (!mounted) return;

        // Fetch user data from API with timeout
        console.log("[App] Fetching user data for FID:", viewerFid);
        const res = await withTimeout(
          fetch(`/api/me?fid=${viewerFid}`),
          10000,
          "API request timeout after 10s"
        );

        if (!res.ok) {
          const errorText = await res.text();
          console.error("[App] API error:", res.status, errorText);
          throw new Error(`Failed to fetch user info (${res.status})`);
        }

        const data = await res.json();
        console.log("[App] ✓ User data loaded:", data);

        if (mounted) {
          setMe(data);
        }
      } catch (err: any) {
        console.error("[App] Initialization error:", err);
        if (mounted) {
          setStatus(err.message || "Unable to load user info.");
        }
      } finally {
        if (mounted) {
          setLoading(false);

          // Signal to Farcaster that app is ready and hide native splash screen
          try {
            sdk.actions.ready();
            console.log("[App] ✓ SDK ready signal sent - splash screen should hide");
          } catch (sdkError) {
            console.warn("[App] SDK ready() failed (expected in embed tool):", sdkError);
          }
        }
      }
    }

    // Start initialization
    initializeApp();

    // Emergency timeout: ensure ready() is called even if initialization hangs
    const emergencyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn("[App] ⚠️  Emergency timeout - forcing ready() call after 20s");
        try {
          sdk.actions.ready();
          setLoading(false);
          setStatus("Loading took longer than expected. Please try refreshing.");
        } catch (err) {
          console.error("[App] Emergency ready() failed:", err);
        }
      }
    }, 20000); // 20 second emergency timeout

    return () => {
      mounted = false;
      clearTimeout(emergencyTimeout);
    };
  }, []);

  // Wallet connection is now handled on-demand when user clicks mint
  // This prevents the approve screen from showing on page load

  // Auto-authenticate when we have FID from Farcaster
  // In a Farcaster Mini App, the FID itself is proof of authentication
  useEffect(() => {
    if (me?.fid && !isAuthenticated) {
      console.log("[Auth] ✓ Authenticated via Farcaster FID:", me.fid);
      setIsAuthenticated(true);
      setStatus("✓ Connected as " + (me.displayName || me.username));
      setTimeout(() => setStatus(null), 2000);
    }
  }, [me?.fid, isAuthenticated]);

  // Load metadata preview for this fid
  useEffect(() => {
    async function fetchMetadata(fid: number) {
      if (isRefreshing) return;

      try {
        const res = await fetch(`/api/metadata/${fid}?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (!res.ok) return;

        const data = await res.json();

        if (data.image && !data.image.includes("placeholder")) {
          setMeta(data);
          setHasGenerated(true);
        }
      } catch (err) {
        console.log("No metadata yet - user needs to generate");
      }
    }

    if (me?.fid && !isRefreshing) {
      fetchMetadata(me.fid);

      // Load transaction hash from localStorage
      const storedTxHash = localStorage.getItem(`farcasturd_tx_${me.fid}`);
      if (storedTxHash) {
        setLastTxHash(storedTxHash);
      }
    }
  }, [me?.fid, isRefreshing]);

  // Fetch mint price configuration
  useEffect(() => {
    async function fetchMintPrice() {
      try {
        const res = await fetch('/api/config/mint-price');
        if (res.ok) {
          const data = await res.json();
          setMintPrice(data.price === "0" || data.price === 0 ? "Free" : `${data.price} ETH`);
        }
      } catch (err) {
        console.log("Could not fetch mint price, defaulting to Free");
      }
    }
    fetchMintPrice();
  }, []);

  // Handle mint transaction status updates
  useEffect(() => {
    if (isMintPending) {
      console.log('[Mint] Transaction pending - waiting for wallet confirmation');
      setMinting(true);
      setStatus("Please confirm the transaction in your wallet...");
    }
  }, [isMintPending]);

  useEffect(() => {
    if (isMintConfirming) {
      console.log('[Mint] Transaction confirmed by wallet - waiting for blockchain confirmation');
      setStatus("Transaction submitted! Waiting for confirmation...");
    }
  }, [isMintConfirming]);

  // Handle successful mint from direct wagmi flow (Generate & Mint button)
  useEffect(() => {
    if (isMintConfirmed && mintTxHash && me) {
      // Prevent duplicate generation for the same transaction
      if (processedTxHashes.current.has(mintTxHash)) {
        console.log('[Mint] Transaction already processed, skipping generation:', mintTxHash);
        return;
      }

      console.log('[Mint] ✅ Transaction confirmed on-chain!', mintTxHash);

      // Mark this transaction as processed FIRST to prevent any race conditions
      processedTxHashes.current.add(mintTxHash);

      // Update state
      setLastTxHash(mintTxHash);
      localStorage.setItem(`farcasturd_tx_${me.fid}`, mintTxHash);
      setMe((prev) => (prev ? { ...prev, hasMinted: true } : prev));

      // Trigger generation after mint
      generateImageAfterMint(me.fid);
    }
  }, [isMintConfirmed, mintTxHash, me]);

  // Handle mint errors
  useEffect(() => {
    if (isMintError && mintError) {
      console.error('[Mint] ❌ Transaction error:', mintError);
      const errorMessage = mintError.message || 'Transaction failed';

      // Check for common errors
      if (errorMessage.includes('user rejected') || errorMessage.includes('User denied')) {
        setStatus('⚠️ Transaction cancelled');
      } else if (errorMessage.includes('insufficient funds')) {
        setStatus('⚠️ Insufficient funds for transaction');
      } else {
        setStatus(`⚠️ Mint failed: ${errorMessage}`);
      }

      setMinting(false);
      setTimeout(() => setStatus(null), 5000);
    }
  }, [isMintError, mintError]);

  // Consolidated function to generate image after successful mint
  // This prevents duplicate API calls by centralizing the generation logic
  async function generateImageAfterMint(fid: number) {
    setStatus("✓ Mint successful! Generating your Farcasturd...💩");
    setGenerating(true);
    setMinting(false);

    try {
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid }),
      });

      if (!genRes.ok) {
        const error = await genRes.json();
        throw new Error(error.error || "Generation failed");
      }

      await genRes.json();
      setHasGenerated(true);

      // Fetch metadata to show the generated image
      setIsRefreshing(true);
      const metaRes = await fetch(`/api/metadata/${fid}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMeta(metaData);
      }
      setIsRefreshing(false);

      setStatus(`✓ Farcasturd minted and generated for FID ${fid}! 💩`);
      setTimeout(() => setStatus(null), 3000);
    } catch (err: any) {
      console.error("Generation after mint failed:", err);
      setStatus("✓ Minted! But generation failed. Refresh to try again.");
      setTimeout(() => setStatus(null), 5000);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateFarcasturd() {
    if (!me?.fid) return;

    setGenerating(true);
    setStatus("Making a turd just for you...💩");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: me.fid }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Generation failed");
      }

      const data = await res.json();
      setStatus(`✓ Farcasturd generated! Ready to mint on Base.`);
      setHasGenerated(true);

      const metaRes = await fetch(`/api/metadata/${me.fid}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMeta(metaData);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      if (errorMsg.includes("quota")) {
        setStatus("⚠️ Generation service temporarily unavailable. Please try again later.");
      } else if (errorMsg.includes("rate limit")) {
        setStatus("⚠️ Too many requests. Please wait a moment and try again.");
      } else {
        setStatus(`⚠️ Generation failed: ${errorMsg}`);
      }
      console.error("Generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateAndMint(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (me.hasMinted) {
      setStatus("This FID has already minted a Farcasturd.");
      return;
    }

    // Connect wallet if not already connected
    if (!isConnected && connectors.length > 0) {
      try {
        setStatus("Connecting wallet...");
        const farcasterConnector = connectors[0];
        await connect({ connector: farcasterConnector });
        console.log("[Wallet] ✓ Connected successfully");
      } catch (error) {
        console.error('[Wallet] Connection failed:', error);
        setStatus("⚠️ Failed to connect wallet");
        setTimeout(() => setStatus(null), 3000);
        return;
      }
    }

    if (!address) {
      setStatus("⚠️ No wallet address available");
      return;
    }

    // Trigger mint transaction directly - generation happens AFTER mint confirms
    try {
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FARCASTURDS_ADDRESS as `0x${string}`;

      if (!CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured');
      }

      // Get the actual mint price value (strip "Free" or "ETH" text)
      let priceInEth = '0';
      if (mintPrice !== "Free") {
        priceInEth = mintPrice.replace(' ETH', '').trim();
      }

      console.log('[Mint] Price string:', mintPrice);
      console.log('[Mint] Parsed price:', priceInEth);
      console.log('[Mint] Wei value:', parseEther(priceInEth).toString());

      setStatus("Preparing transaction...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: farcasturdsV2Abi,
        functionName: 'mintFor',
        args: [address, BigInt(me.fid)],
        value: parseEther(priceInEth),
      });
    } catch (err: any) {
      console.error('Mint error:', err);
      setStatus(`⚠️ Failed to initiate transaction: ${err.message}`);
      setTimeout(() => setStatus(null), 5000);
    }
  }

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (me.hasMinted) {
      setStatus("This FID has already minted a Farcasturd.");
      return;
    }
    if (!hasGenerated) {
      setStatus("Please generate your Farcasturd first!");
      return;
    }

    // Connect wallet if not already connected
    if (!isConnected && connectors.length > 0) {
      try {
        setStatus("Connecting wallet...");
        const farcasterConnector = connectors[0];
        await connect({ connector: farcasterConnector });
        console.log("[Wallet] ✓ Connected successfully");
      } catch (error) {
        console.error('[Wallet] Connection failed:', error);
        setStatus("⚠️ Failed to connect wallet");
        setTimeout(() => setStatus(null), 3000);
        return;
      }
    }

    // Open the mint modal
    setShowMintModal(true);
  }

  async function handleMintSuccess(txHash: string) {
    if (!me) return;

    // Prevent duplicate generation - check if this tx was already processed
    if (processedTxHashes.current.has(txHash)) {
      console.log('[MintModal] Transaction already processed by main flow, skipping:', txHash);
      return;
    }

    console.log('[MintModal] Processing mint success:', txHash);

    // Mark this transaction as processed FIRST to prevent race conditions
    processedTxHashes.current.add(txHash);

    // Update state
    setLastTxHash(txHash);
    localStorage.setItem(`farcasturd_tx_${me.fid}`, txHash);
    setMe((prev) => (prev ? { ...prev, hasMinted: true } : prev));

    // Use consolidated generation function
    await generateImageAfterMint(me.fid);
  }

  async function handleShareToFarcaster() {
    if (!me || !meta) return;

    try {
      setSharing(true);
      setStatus("Opening Farcaster composer...");

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://farcasturds.vercel.app";
      const shareText = `Just paid for poop 💩\n\n${meta.name}\n${baseUrl}`;

      await sdk.actions.composeCast({
        text: shareText,
        embeds: [meta.image],
      });

      setStatus("✓ Cast composer opened!");
      setTimeout(() => setStatus(null), 3000);
    } catch (error: any) {
      console.error('Share error:', error);
      setStatus("⚠️ Failed to open cast composer");
      setTimeout(() => setStatus(null), 3000);
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    // Farcaster's native splash screen shows during loading
    // sdk.actions.ready() is called when loading completes
    return null;
  }

  if (!me) {
    return (
      <main className="fc-shell">
        <section className="fc-section">
          <div className="fc-card">
            <h1 className="fc-title">Farcasturd</h1>
            <p className="fc-status" style={{ marginBottom: 16, whiteSpace: "pre-wrap" }}>
              {status || "Unable to load user info"}
            </p>
            
            <div style={{ 
              padding: "16px", 
              background: "rgba(255, 243, 205, 0.3)", 
              borderRadius: "12px",
              border: "1px solid rgba(255, 193, 7, 0.3)"
            }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>🔍 Troubleshooting</p>
              <p className="fc-subtle" style={{ fontSize: "0.9rem", marginBottom: 12 }}>
                If you see this error:
              </p>
              <ul style={{ fontSize: "0.85rem", marginLeft: 20, marginBottom: 12 }}>
                <li>In Warpcast: Try refreshing the frame or reopening the app</li>
                <li>For testing: Add ?fid=YOUR_FID to the URL</li>
              </ul>
              <div style={{ 
                background: "white", 
                padding: "10px", 
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                wordBreak: "break-all"
              }}>
                {window.location.origin}?fid=YOUR_FID
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const alreadyMinted = !!me.hasMinted;
  const hasActivity = alreadyMinted || !!lastTxHash;

  return (
    <main className="fc-shell">
      {/* Header / identity - shown on all tabs */}
      <section className="fc-section">
        <div className="fc-header-row">
          <img
            src="https://b4b0aaz7b39hhkor.public.blob.vercel-storage.com/farcasturdsv4.png"
            alt="Farcasturd"
            style={{
              maxWidth: "280px",
              width: "100%",
              height: "auto",
              display: "block",
              margin: "0 auto"
            }}
          />
        </div>
        <div className="fc-pill-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {me.pfpUrl ? (
            <img
              src={me.pfpUrl}
              alt={`${me.displayName || me.username} profile`}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                objectFit: "cover",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "inline-block",
                verticalAlign: "middle"
              }}
              onError={(e) => {
                console.log("[PFP] Image failed to load:", me.pfpUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                verticalAlign: "middle"
              }}
            >
              {me.displayName?.[0] || me.username?.[0] || "👤"}
            </div>
          )}
          <span className="fc-pill">
          <strong>{me.displayName || me.username}</strong>
          </span>
          <span className="fc-pill">
            FID <strong>{me.fid}</strong>
          </span>
          {isAuthenticated && (
            <span className="fc-pill" style={{ background: "rgba(76, 175, 80, 0.2)", color: "#2e7d32" }}>
              ✓ Eligible
            </span>
          )}
        </div>
      </section>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mint Tab Content */}
      {activeTab === 'mint' && (
        <>

      {/* Generation & Mint section */}
      <section className="fc-section">
        <div className="fc-card">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 8px 0" }}>
              {alreadyMinted ? "" : hasGenerated ? "Secure your Turd!" : ""}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--fc-text-soft)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
              {alreadyMinted
                ? "Share your Farcasturd with frens"
                : hasGenerated
                ? "Your Farcasturd is ready to mint on Base!"
                : ""}
            </p>

            {!hasGenerated && !alreadyMinted && (
              <form onSubmit={handleGenerateAndMint} style={{ marginBottom: 8 }}>
                <button
                  type="submit"
                  disabled={generating || minting || !isAuthenticated}
                  className="fc-button"
                >
                  {generating
                    ? "Generating...💩"
                    : minting
                    ? "Minting...💩"
                    : "Generate & Mint"}
                </button>
              </form>
            )}

            {hasGenerated && !alreadyMinted && (
              <form onSubmit={handleMint} style={{ marginBottom: 8 }}>
                <button
                  type="submit"
                  disabled={minting || !isAuthenticated}
                  className="fc-button"
                >
                  {minting ? "Minting... 💩" : "Mint Now"}
                </button>
              </form>
            )}

            {alreadyMinted && (
              <button
                onClick={handleShareToFarcaster}
                disabled={sharing}
                className="fc-button"
                style={{ marginBottom: 8 }}
              >
                {sharing ? "Sharing... 💩" : "Share Your Turd 💩"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Your Farcasturd preview */}
      <section className="fc-section">
        <div className="fc-card">
          <h2 className={meta ? "fc-card-title" : "fc-card-title-reveal"}>
            {meta ? meta.name : "Reveal your Farcasturd"}
          </h2>

          <div className="fc-nft-preview-wrap">
            {meta?.image && !meta.image.includes("placeholder") ? (
              <div className="fc-nft-preview">
                <img src={meta.image} alt="Mint to Reveal" />
              </div>
            ) : (
              <div className="fc-avatar" style={{
                width: 300,
                height: 300,
                borderRadius: 24,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}>
                <img
                  src="https://b4b0aaz7b39hhkor.public.blob.vercel-storage.com/poop_questionv2.png"
                  alt="Generate your Farcasturd"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block"
                  }}
                />
              </div>
            )}
          </div>

          {meta && !meta.image.includes("placeholder") ? (
            <>
              <p className="fc-subtle">{meta.description}</p>

              <div className="fc-meta-block">
                <div style={{ textAlign: "center" }}>
                  <strong style={{ color: "var(--fc-text)" }}>Image URL:</strong>{" "}
                  <a
                    href={meta.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fc-code"
                    style={{
                      color: "var(--fc-text)",
                      opacity: 0.8,
                      textDecoration: "underline",
                      cursor: "pointer"
                    }}
                  >
                    {meta.image}
                  </a>
                </div>
              </div>

              {meta.attributes && meta.attributes.length > 0 && (
                <div className="fc-attr-row">
                  {meta.attributes.map((attr) => (
                    <div
                      key={`${attr.trait_type}-${attr.value}`}
                      className="fc-attr-pill"
                    >
                      <span className="fc-attr-label">{attr.trait_type}</span>
                      <span className="fc-attr-value">
                        {String(attr.value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="fc-subtle">
              {hasGenerated
                ? "Checking on your turd..."
                : "A turd is waiting for you 💩"}
            </p>
          )}
        </div>
      </section>

      {/* Recent activity */}
      <section className="fc-section">
        <div className="fc-card fc-activity">
          <div className="fc-activity-header">
            <span className="fc-activity-dot" />
            <span>Recent activity</span>
          </div>

          {hasActivity ? (
            <div className="fc-activity-item">
              <p style={{
                fontSize: "0.88rem",
                color: "var(--fc-text-soft)",
                margin: "0 auto 8px",
                textAlign: "center",
                maxWidth: "100%"
              }}>
                <span className="fc-activity-label"></span>
                {" "}FID {me.fid}
                {" "}→{" "}
                <span className="fc-code">{truncateAddress(me.wallet)}</span>
              </p>

              <div style={{ textAlign: "center", width: "100%" }}>
                {lastTxHash ? (
                  <a
                    href={getBaseScanTxUrl(lastTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fc-basescan-link"
                  >
                    View on BaseScan
                  </a>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "var(--fc-text-muted)" }}>
                    on-chain · existing
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="fc-subtle" style={{ fontSize: "0.85rem" }}>
              You haven't minted yet.
            </p>
          )}
        </div>
      </section>

          {/* Mint Payment Modal */}
          {me && (
            <MintModal
              isOpen={showMintModal}
              onClose={() => setShowMintModal(false)}
              fid={me.fid}
              imageUrl={meta?.image || ''}
              onSuccess={handleMintSuccess}
            />
          )}
        </>
      )}

      {/* Leaderboard Tab Content */}
      {activeTab === 'leaderboard' && (
        <Leaderboard userFid={me?.fid} />
      )}
    </main>
  );
}