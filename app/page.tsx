'use client';

import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { MintModal } from '@/components/MintModal';
import { generateSiweMessage, generateNonce, verifySiweSignature } from '@/lib/auth';

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

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { signMessageAsync } = useSignMessage();

  // Initialize SDK + load Farcaster user
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log("[App] Initializing Farcaster SDK...");
        
        // Signal that the app is ready
        try {
          sdk.actions.ready();
        } catch (sdkError) {
          console.warn("[App] SDK ready() failed (expected in embed tool):", sdkError);
        }

        // Wait for context to potentially be available
        await new Promise(resolve => setTimeout(resolve, 300));

        let viewerFid: number | undefined;

        // Try to get context from SDK
        try {
          console.log("[App] Checking SDK context...");
          console.log("[App] SDK context available:", !!sdk.context);
          console.log("[App] SDK context.user:", sdk.context?.user);
          
          if (sdk.context?.user?.fid) {
            const rawFid = sdk.context.user.fid;
            console.log("[App] Raw FID value:", rawFid, "Type:", typeof rawFid);
            
            // Handle different FID types (number, BigInt, or object)
            if (typeof rawFid === 'number') {
              viewerFid = rawFid;
            } else if (typeof rawFid === 'bigint') {
              viewerFid = Number(rawFid);
            } else if (typeof rawFid === 'string') {
              viewerFid = parseInt(rawFid, 10);
            } else if (rawFid && typeof rawFid === 'object') {
              // Try to convert object to number
              viewerFid = Number(rawFid.toString());
            }
            
            if (viewerFid) {
              console.log("[App] ✓ Loaded viewer FID from SDK context:", viewerFid);
            }
          }
        } catch (contextError) {
          console.warn("[App] Error accessing SDK context:", contextError);
        }

        // Fallback: Check URL params (for testing in embed tool)
        if (!viewerFid) {
          const params = new URLSearchParams(window.location.search);
          const fidParam = params.get('fid');
          
          if (fidParam) {
            viewerFid = parseInt(fidParam, 10);
            console.log("[App] ✓ Using FID from URL param:", viewerFid);
          } else {
            // Check if we're in embed tool vs real Warpcast
            const isEmbedTool = window.location.hostname.includes('localhost') || 
                               window.self !== window.top;
            
            if (isEmbedTool) {
              console.log("[App] Detected embed tool environment - FID param required");
            }
          }
        }

        if (!viewerFid || isNaN(viewerFid)) {
          throw new Error("No FID available. Add ?fid=YOUR_FID to test in the embed tool.");
        }

        // Fetch user data from our API
        console.log("[App] Fetching user data for FID:", viewerFid);
        const res = await fetch(`/api/me?fid=${viewerFid}`);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("[App] API error:", res.status, errorText);
          throw new Error(`Failed to fetch user info: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("[App] ✓ User data loaded:", data);
        console.log("[App] PFP URL:", data.pfpUrl);
        setMe(data);
      } catch (err: any) {
        console.error("[App] Initialization error:", err);
        setStatus(err.message || "Unable to load user info.");
      } finally {
        setLoading(false);
      }
    }

    initializeApp();
  }, []);

  // Auto-connect to Farcaster wallet
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      const farcasterConnector = connectors[0]; // Farcaster miniapp connector
      connect({ connector: farcasterConnector });
    }
  }, [isConnected, connectors, connect]);

  // Handle authentication when wallet connects
  useEffect(() => {
    async function authenticateUser() {
      if (!address || !me?.fid || isAuthenticated) return;

      try {
        setStatus("Authenticating with Farcaster...");

        const nonce = generateNonce();
        setAuthNonce(nonce);

        // Generate SIWE message
        const message = generateSiweMessage({
          address,
          chainId: 84532, // Base Sepolia
          nonce,
          fid: me.fid
        });

        // Sign the message
        const signature = await signMessageAsync({ message });

        // Verify on backend
        const result = await verifySiweSignature({ message, signature, nonce });

        if (result.success) {
          setIsAuthenticated(true);
          setStatus("✓ Authenticated with Farcaster!");
          setTimeout(() => setStatus(null), 3000);
        } else {
          setStatus(`⚠️ Authentication failed: ${result.error}`);
        }
      } catch (error: any) {
        console.error('Authentication error:', error);
        if (error.message.includes('User rejected')) {
          setStatus("⚠️ Authentication cancelled");
        } else {
          setStatus("⚠️ Authentication failed. Please try again.");
        }
      }
    }

    authenticateUser();
  }, [address, me?.fid, isAuthenticated, signMessageAsync]);

  // Load metadata preview for this fid
  useEffect(() => {
    async function fetchMetadata(fid: number) {
      // Don't refetch if we're in the middle of a refresh
      if (isRefreshing) return;

      try {
        // FIXED: Bypass cache with cache-busting query param
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

      // FIXED: Bypass cache when refetching after generation
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

  // Combined Generate & Mint function (with auth check and modal)
  async function handleGenerateAndMint(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (me.hasMinted) {
      setStatus("This FID has already minted a Farcasturd.");
      return;
    }

    // Check authentication
    if (!isAuthenticated || !isConnected) {
      setStatus("⚠️ Please authenticate with your Farcaster wallet first");
      return;
    }

    // Step 1: Generate
    setGenerating(true);
    setStatus("Making a turd just for you...💩");

    try {
      // Generate the Farcasturd
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid: me.fid }),
      });

      if (!genRes.ok) {
        const error = await genRes.json();
        throw new Error(error.error || "Generation failed");
      }

      await genRes.json();
      setHasGenerated(true);

      // Fetch metadata to confirm generation
      setIsRefreshing(true);
      const metaRes = await fetch(`/api/metadata/${me.fid}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMeta(metaData);
      }
      setIsRefreshing(false);

      // Step 2: Open Mint Modal
      setStatus("✓ Farcasturd generated! Opening payment modal...");
      setTimeout(() => {
        setShowMintModal(true);
        setStatus(null);
      }, 1000);

    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      if (errorMsg.includes("quota")) {
        setStatus("⚠️ Generation service temporarily unavailable. Please try again later.");
      } else if (errorMsg.includes("rate limit")) {
        setStatus("⚠️ Too many requests. Please wait a moment and try again.");
      } else if (errorMsg.includes("Generation failed")) {
        setStatus(`⚠️ Generation failed: ${errorMsg}`);
      } else {
        setStatus(`⚠️ Generation failed. Please try again.`);
      }
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
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

    // Check authentication
    if (!isAuthenticated || !isConnected) {
      setStatus("⚠️ Please authenticate with your Farcaster wallet first");
      return;
    }

    // Open the mint modal
    setShowMintModal(true);
  }

  // Handle successful mint from modal
  function handleMintSuccess(txHash: string) {
    setLastTxHash(txHash);
    localStorage.setItem(`farcasturd_tx_${me?.fid}`, txHash);
    setMe((prev) => (prev ? { ...prev, hasMinted: true } : prev));
    setStatus(`✓ Success! Farcasturd minted for FID ${me?.fid}`);
  }

  if (loading) {
    return (
      <main className="fc-shell">
        <section className="fc-section">
          <div className="fc-card">
            <p className="fc-subtle">Loading your Farcasturd...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="fc-shell">
        <section className="fc-section">
          <div className="fc-card">
            <h1 className="fc-title">Farcasturd</h1>
            <p className="fc-status" style={{ marginBottom: 16 }}>
              {status || "Unable to load user info"}
            </p>
            
            <div style={{ 
              padding: "16px", 
              background: "rgba(255, 243, 205, 0.3)", 
              borderRadius: "12px",
              border: "1px solid rgba(255, 193, 7, 0.3)"
            }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>🧪 Testing in Embed Tool?</p>
              <p className="fc-subtle" style={{ fontSize: "0.9rem", marginBottom: 12 }}>
                The Farcaster SDK can't access your FID in the embed tool. Add your FID to the URL:
              </p>
              <div style={{ 
                background: "white", 
                padding: "10px", 
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "0.85rem",
                wordBreak: "break-all",
                marginBottom: 12
              }}>
                {window.location.origin}?fid=YOUR_FID
              </div>
              <p className="fc-subtle" style={{ fontSize: "0.85rem" }}>
                Replace YOUR_FID with your actual Farcaster ID number (e.g., ?fid=198116)
              </p>
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
      {/* Header / identity */}
      <section className="fc-section">
        <div className="fc-header-row">
          <img
            src="https://b4b0aaz7b39hhkor.public.blob.vercel-storage.com/Bold%20Purple%20and%20Brown%20Typography.png"
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
          {/* PFP in header */}
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
            Logged in as <strong>{me.displayName || me.username}</strong>
          </span>
          <span className="fc-pill">
            FID <strong>{me.fid}</strong>
          </span>
          <span className="fc-pill">
            Wallet{" "}
            <span className="fc-code">
              {truncateAddress(me.wallet) || "0x0000…0000"}
            </span>
          </span>
        </div>
      </section>

      {/* Generation & Mint section */}
      <section className="fc-section">
        <div className="fc-card">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 8px 0" }}>
              {alreadyMinted ? "Your Farcasturd" : hasGenerated ? "Ready to Mint!" : "Farcasturd"}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "var(--fc-text-soft)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
              {alreadyMinted
                ? "You've already claimed your unique Farcasturd!"
                : hasGenerated
                ? "Your Farcasturd is ready to mint on Base!"
                : "Generate your unique turd now."}
            </p>

            {!hasGenerated && !alreadyMinted && (
              <form onSubmit={handleGenerateAndMint} style={{ marginBottom: 8 }}>
                <button
                  type="submit"
                  disabled={generating || minting}
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
                  disabled={minting}
                  className="fc-button"
                >
                  {minting ? "Minting... 💩" : "Mint Now"}
                </button>
              </form>
            )}

            {alreadyMinted && (
              <button
                disabled
                className="fc-button"
                style={{ marginBottom: 8 }}
              >
                Already Minted ✓
              </button>
            )}

            <p className="fc-tagline">
              {mintPrice}
            </p>

            {status && <p className="fc-status">{status}</p>}
          </div>
        </div>
      </section>

      {/* Your Farcasturd preview */}
      <section className="fc-section">
        <div className="fc-card">
          <h2 className="fc-card-title">
            {meta ? meta.name : "Your Farcasturd"}
          </h2>

          <div className="fc-nft-preview-wrap">
            {meta?.image && !meta.image.includes("placeholder") ? (
              <div className="fc-nft-preview">
                <img src={meta.image} alt="Your Farcasturd" />
              </div>
            ) : (
              <div className="fc-avatar" style={{
                width: 260,
                height: 260,
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
                : "Generate your unique Farcasturd to get started!"}
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
              No activity yet.
            </p>
          )}
        </div>
      </section>

      {/* Mint Payment Modal */}
      {me && meta?.image && (
        <MintModal
          isOpen={showMintModal}
          onClose={() => setShowMintModal(false)}
          fid={me.fid}
          imageUrl={meta.image}
          onSuccess={handleMintSuccess}
        />
      )}
    </main>
  );
}