'use client';

import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

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

  // Load metadata preview for this fid
  useEffect(() => {
    async function fetchMetadata(fid: number) {
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

    if (me?.fid) {
      fetchMetadata(me.fid);
    }
  }, [me?.fid]);

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

  // Combined Generate & Mint function
  async function handleGenerateAndMint(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (me.hasMinted) {
      setStatus("This FID has already minted a Farcasturd.");
      return;
    }

    // Step 1: Generate
    setGenerating(true);
    setMinting(false);
    setStatus("Making a turd just for you...💩");
    setLastTxHash(null);

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
      const metaRes = await fetch(`/api/metadata/${me.fid}?t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        setMeta(metaData);
      }

      // Step 2: Mint
      setGenerating(false);
      setMinting(true);
      setStatus("Farcasturd created! Now minting on Base...💩");

      const mintRes = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: me.fid,
          to: me.wallet,
        }),
      });

      const mintData = await mintRes.json();

      if (!mintRes.ok) {
        const errorMsg = mintData.error || "Unknown error";
        if (errorMsg.includes("already minted")) {
          setStatus("This FID has already minted a Farcasturd.");
        } else if (errorMsg.includes("configuration") || errorMsg.includes("Missing")) {
          setStatus("⚠️ Minting service not configured. Please contact support.");
        } else {
          setStatus(`⚠️ Minting failed: ${errorMsg}`);
        }
        return;
      }

      setLastTxHash(mintData.txHash);
      setStatus(`✓ Success! Farcasturd minted for FID ${mintData.fid}`);
      setMe((prev) => (prev ? { ...prev, hasMinted: true } : prev));
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      if (errorMsg.includes("quota")) {
        setStatus("⚠️ Generation service temporarily unavailable. Please try again later.");
      } else if (errorMsg.includes("rate limit")) {
        setStatus("⚠️ Too many requests. Please wait a moment and try again.");
      } else if (errorMsg.includes("Generation failed")) {
        setStatus(`⚠️ Generation failed: ${errorMsg}`);
      } else {
        setStatus(`⚠️ Process failed. Please try again.`);
      }
      console.error("Generate & Mint error:", err);
    } finally {
      setGenerating(false);
      setMinting(false);
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

    setMinting(true);
    setStatus("Minting Farcasturd on Base...💩");
    setLastTxHash(null);

    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: me.fid,
          to: me.wallet,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || "Unknown error";
        if (errorMsg.includes("already minted")) {
          setStatus("This FID has already minted a Farcasturd.");
        } else if (errorMsg.includes("configuration") || errorMsg.includes("Missing")) {
          setStatus("⚠️ Minting service not configured. Please contact support.");
        } else {
          setStatus(`⚠️ Minting failed: ${errorMsg}`);
        }
        return;
      }

      setLastTxHash(data.txHash);
      setStatus(`✓ Success! Farcasturd minted for FID ${data.fid}`);
      setMe((prev) => (prev ? { ...prev, hasMinted: true } : prev));
    } catch (err: any) {
      setStatus(`⚠️ Minting failed. Please try again.`);
      console.error("Mint error:", err);
    } finally {
      setMinting(false);
    }
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
            <h1 className="fc-title fc-gradient-text">Farcasturd</h1>
        </div>
        <div className="fc-pill-row">
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
        <div className="fc-card" style={{ padding: "16px" }}>
          <div className="fc-mint-card-layout" style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {/* PFP on the left */}
            {me.pfpUrl && (
              <div
                style={{
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 80, height: 80, minWidth: 80 }}>
                  <img
                    src={me.pfpUrl}
                    alt={`${me.displayName || me.username} profile`}
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(143, 91, 255, 0.3)" }}
                  />
                </div>
              </div>
            )}

            {/* Content on the right */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, textAlign: "left" }}>
                {alreadyMinted ? "Your Farcasturd" : hasGenerated ? "Ready to Mint!" : "Generate Your 1:1 Farcasturd"}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--fc-text-soft)", margin: 0, textAlign: "left", lineHeight: 1.3 }}>
                {alreadyMinted
                  ? "You've already claimed your unique Farcasturd!"
                  : hasGenerated
                  ? "Your Farcasturd is ready to mint on Base!"
                  : "Generate your unique turd now."}
              </p>

              <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!hasGenerated && !alreadyMinted && (
                  <form onSubmit={handleGenerateAndMint}>
                    <button
                      type="submit"
                      disabled={generating || minting}
                      className="fc-button"
                      style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
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
                  <form onSubmit={handleMint}>
                    <button
                      type="submit"
                      disabled={minting}
                      className="fc-button"
                      style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                    >
                      {minting ? "Minting... 💩" : "Mint Now"}
                    </button>
                  </form>
                )}

                {alreadyMinted && (
                  <button
                    disabled
                    className="fc-button"
                    style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                  >
                    Already Minted ✓
                  </button>
                )}
              </div>

              <p style={{ fontSize: "0.72rem", color: "var(--fc-text-muted)", margin: "4px 0 0 0", letterSpacing: "0.02em" }}>
                Unique · Soulbound · No Dumping
              </p>

              {status && <p style={{ fontSize: "0.8rem", color: "var(--fc-text-muted)", margin: "4px 0 0 0" }}>{status}</p>}
            </div>
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
              <div className="fc-avatar">💩</div>
            )}
          </div>

          {meta && !meta.image.includes("placeholder") ? (
            <>
              <p className="fc-subtle">{meta.description}</p>

              <div className="fc-meta-block">
                <div>
                  <strong>Image URL:</strong>{" "}
                  <span className="fc-code">{meta.image}</span>
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
                ? "Dumping your Farcasturd..."
                : "Generate your Farcasturd to see it here!"}
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
              <div className="fc-activity-main">
                <span className="fc-activity-label">Farcasturd minted</span>
                <span>for FID {me.fid}</span>
                <span>→</span>
                <span className="fc-code">{truncateAddress(me.wallet)}</span>
              </div>

              <div className="fc-activity-time">
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
                  "on-chain · existing"
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
    </main>
  );
}