// lib/farcasterClient.ts
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

if (!NEYNAR_API_KEY) {
  console.warn("NEYNAR_API_KEY is not set – Farcaster lookups will fail.");
}

export type FarcasterProfile = {
  fid: number;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  pfpUrl: string | null;
};

export async function getFarcasterProfile(fid: number): Promise<FarcasterProfile> {
  if (!NEYNAR_API_KEY) {
    throw new Error("NEYNAR_API_KEY missing");
  }

  const url = new URL("https://api.neynar.com/v2/farcaster/user/bulk");
  url.searchParams.set("fids", String(fid));

  const res = await fetch(url.toString(), {
    headers: {
      accept: "application/json",
      api_key: NEYNAR_API_KEY,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Farcaster profile for fid ${fid}: ${res.status}`);
  }

  const json = await res.json();
  const user = json.users?.[0];

  return {
    fid,
    username: user?.username ?? null,
    displayName: user?.display_name ?? null,
    bio: user?.profile?.bio?.text ?? null,
    pfpUrl: user?.pfp_url ?? null,
  };
}
