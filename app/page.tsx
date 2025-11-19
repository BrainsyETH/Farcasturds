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
    // Make sure we only touch the SDK in the browser
    sdk.actions.ready();

    async function fetchMe() {
      try {
        const viewerFid = 198116; // TEMP: replace with real viewer FID
        const res = await fetch(`/api/me?fid=${viewerFid}`);
        if (!res.ok) throw new Error("Failed to fetch user info");
        const data = await res.json();
        setMe(data);
      } catch (err) {
        console.error(err);
        setStatus("Unable to load user info. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    fetchMe();
  }, []);

  // Load metadata preview for this fid
  useEffect(() => {
    async function fetchMetadata(fid: number) {
      try {
        const res = await fetch(`/api/metadata/${fid}`);
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
    setStatus("💩 Generating your unique Farcasturd...");

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
      setStatus(`✓ Farcasturd generated! Ready to mint on-chain.`);
      setHasGenerated(true);

      const metaRes = await fetch(`/api/metadata/${me.fid}`);
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
        setStatus(`⚠️ Generation failed. Please try again.`);
      }
      console.error("Generation failed:", err);
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

    setMinting(true);
    setStatus("💩 Minting Farcasturd on Base...");
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
            <p className="fc-subtle">Turds loading...</p>
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
            <p className="fc-status">
              Unable to load user info. Please refresh the page.
            </p>
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
        <div className="fc-card">
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <h2 className="fc-card-title">
                {hasGenerated ? "" : "Generate Your 1:1 Farcasturd"}
              </h2>
              <p className="fc-subtle">
                {hasGenerated
                  ? "Your Farcasturd is ready is ready to dump!"
                  : "First, generate your unique Farcasturd, loosely based on your Farcaster profile."}
              </p>

              <div style={{ marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!hasGenerated && !alreadyMinted && (
                  <button
                    onClick={handleGenerateFarcasturd}
                    disabled={generating}
                    className="fc-button"
                    type="button"
                  >
                    {generating ? "Generating...💩" : "Generate Farcasturd"}
                  </button>
                )}

                {(hasGenerated || alreadyMinted) && (
                  <form onSubmit={handleMint}>
                    <button
                      type="submit"
                      disabled={minting || alreadyMinted || !hasGenerated}
                      className="fc-button"
                    >
                      {alreadyMinted
                        ? "Already minted ✓"
                        : minting
                        ? "Minting... 💩"
                        : "Mint"}
                    </button>
                  </form>
                )}
              </div>

              <p className="fc-tagline">
                Unique · Soulbound · No Dumping
              </p>

              {status && <p className="fc-status">{status}</p>}
            </div>

            {me.pfpUrl && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  paddingTop: 8,
                }}
              >
                <div className="fc-pfp-wrapper" style={{ width: 80, height: 80, minWidth: 80 }}>
                  <img
                    src={me.pfpUrl}
                    alt={`${me.displayName || me.username} profile`}
                    className="fc-pfp"
                  />
                </div>
              </div>
            )}
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
              No activity yet. Generate and mint your Farcasturd to get started!
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
