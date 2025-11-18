"use client";

import { useEffect, useState } from "react";

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
  const [minting, setMinting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Load Farcaster user (mock identity for now, real hasMinted from API)
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();
        setMe(data);
      } catch (err) {
        console.error(err);
        setStatus("Failed to load user info (/api/me).");
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
        const data = await res.json();
        setMeta(data);
      } catch (err) {
        console.error(err);
      }
    }

    if (me?.fid) {
      fetchMetadata(me.fid);
    }
  }, [me?.fid]);

  async function handleMint(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (me.hasMinted) {
      setStatus("Farcasturd already minted for this FID.");
      return;
    }

    setMinting(true);
    setStatus("Minting Farcasturd on Base…");
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
        setStatus(`Error: ${data.error || "unknown"}`);
        return;
      }

      setLastTxHash(data.txHash);
      setStatus(
  `Success! Minted Farcasturd for fid ${data.fid} to ${data.to}.`
);
setLastTxHash(data.txHash);


      // Update local state so UI reflects minted status immediately
      setMe((prev) =>
        prev ? { ...prev, hasMinted: true } : prev
      );
    } catch (err: any) {
      setStatus(`Error: ${String(err)}`);
    } finally {
      setMinting(false);
    }
  }

  if (loading) {
    return (
      <main className="fc-shell">
        <section className="fc-section">
          <div className="fc-card">
            <p className="fc-subtle">Loading Farcasturd mini app…</p>
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
              Could not load user info. This will use real Farcaster auth later.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const fidAttr = meta?.attributes.find((a) => a.trait_type === "FID");
  const alreadyMinted = !!me.hasMinted;
  const hasActivity = alreadyMinted || !!lastTxHash;

  return (
    <main className="fc-shell">
      {/* Header / identity */}
      <section className="fc-section">
        <div className="fc-header-row">
          <div>
            <div className="fc-kicker">Farcaster mini app</div>
            <h1 className="fc-title fc-gradient-text">Farcasturd</h1>
            <p className="fc-subtle">
              Mint your 1:1 Farcasturd on Base — a non-transferable badge tied
              to your Farcaster ID.
            </p>
          </div>
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
          <span className="fc-pill fc-pill-soft">Soulbound on Base</span>
        </div>
      </section>

      {/* Mint section */}
      <section className="fc-section">
        <div className="fc-card fc-card-row">
          <div className="fc-card-col">
            <h2 className="fc-card-title">Farcasturd Minting</h2>
            <p className="fc-subtle">
              One non-transferable Farcasturd per FID. This will submit a
              transaction on <strong>Base</strong> to mint your soulbound badge.
            </p>
            <form onSubmit={handleMint} style={{ marginTop: 12 }}>
              <button
                type="submit"
                disabled={minting || alreadyMinted}
                className="fc-button"
              >
                {alreadyMinted
                  ? "Already minted"
                  : minting
                  ? "Minting..."
                  : "Mint Soulbound Turd"}
              </button>
            </form>

            <p className="fc-tagline">
              Soulbound · Unique PFP-Generated · Built on Base
            </p>

            {status && <p className="fc-status">{status}</p>}
          </div>
          {me.pfpUrl && (
            <div className="fc-card-col" style={{ alignItems: "flex-end" }}>
              <div className="fc-pfp-wrapper">
                <img
                  src={me.pfpUrl}
                  alt={`${me.displayName || me.username} Farcaster avatar`}
                  className="fc-pfp"
                />
              </div>
              <span className="fc-subtle">From your Farcaster profile</span>
            </div>
          )}
        </div>
      </section>

      {/* Your Farcasturd preview */}
      <section className="fc-section">
        <div className="fc-card fc-card-row">
          <div className="fc-avatar">💩</div>
          <div className="fc-card-col">
            <h2 className="fc-card-title">Farcasturd</h2>
            {meta ? (
              <>
                <p className="fc-subtle">{meta.name}</p>
                <p className="fc-subtle">{meta.description}</p>

                <div className="fc-meta-block">
                  <div>
                    <strong>Image URL:</strong>{" "}
                    <span className="fc-code">{meta.image}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <strong>External URL:</strong>{" "}
                    <span className="fc-code">{meta.external_url}</span>
                  </div>
                </div>

                {meta.attributes && meta.attributes.length > 0 && (
                  <div className="fc-attr-row">
                    {meta.attributes.map((attr) => (
                      <div
                        key={`${attr.trait_type}-${attr.value}`}
                        className="fc-attr-pill"
                      >
                        <span className="fc-attr-label">
                          {attr.trait_type}
                        </span>
                        <span className="fc-attr-value">
                          {String(attr.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="fc-subtle">Metadata preview loading…</p>
            )}
          </div>
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
      <span className="fc-code">
        {truncateAddress(me.wallet)}
      </span>
    </div>

    <div className="fc-activity-time">
      {lastTxHash ? (
        <a
          href={getBaseScanTxUrl(lastTxHash)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#8a663d",
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          View on BaseScan
        </a>
      ) : (
        "on-chain · existing"
      )}
    </div>
  </div>
      </section>
    </main>
  );
}
