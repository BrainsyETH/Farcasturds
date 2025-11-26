import { headers } from 'next/headers';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const DEFAULT_BASE_URL = 'https://farcasturds.vercel.app';

const getBaseUrl = () => {
  const hdrs = headers();
  const forwardedProto = hdrs.get('x-forwarded-proto');
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host');

  if (forwardedProto && host) return `${forwardedProto}://${host}`;
  if (host) return `https://${host}`;
  return process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL;
};

const normalizeParam = (param?: string | null) => {
  if (!param) return undefined;
  const normalized = param.trim();
  if (!normalized || normalized === 'undefined' || normalized === 'null') return undefined;
  return normalized;
};

const asAbsoluteUrl = (value?: string) => {
  if (!value) return undefined;
  try {
    return new URL(value).toString();
  } catch {
    const base = getBaseUrl();
    try {
      return new URL(value, base).toString();
    } catch {
      return undefined;
    }
  }
};

export function generateMetadata({ searchParams }: Props): Metadata {
  const BASE_URL = getBaseUrl();
  const imageParam = Array.isArray(searchParams?.image) ? searchParams?.image[0] : searchParams?.image;
  const previewParam = Array.isArray(searchParams?.preview) ? searchParams?.preview[0] : searchParams?.preview;
  const image = asAbsoluteUrl(normalizeParam(imageParam));
  const previewImage = asAbsoluteUrl(normalizeParam(previewParam));

  const splashImageUrl = image || `${BASE_URL}/splash.png`;
  const previewImageUrl = previewImage || `${BASE_URL}/api/share-scores-preview`;

  const openGraphImage = {
    url: previewImageUrl,
    width: 1000,
    height: 1000,
    alt: 'Farcasturds reputation preview',
    type: 'image/png',
  } as const;

  const fcMiniAppMetadata = {
    version: '1',
    imageUrl: previewImageUrl,
    button: {
      title: '💩 Mint a Turd',
      action: {
        type: 'launch_frame',
        name: 'Farcasturds',
        url: BASE_URL,
        splashImageUrl,
        splashBackgroundColor: '#6938c7',
      },
    },
  };

  const fcFrameMetadata = {
    version: '1',
    imageUrl: previewImageUrl,
    button: {
      title: '💩 Mint a Turd',
      action: {
        type: 'launch_frame',
        name: 'Farcasturds',
        url: BASE_URL,
        splashImageUrl,
        splashBackgroundColor: '#6938c7',
      },
    },
  };

  return {
    metadataBase: new URL(BASE_URL),
    title: 'Farcasturds Share',
    description: 'Share your Farcasturds reputation scores.',
    openGraph: {
      title: 'Farcasturds',
      description: 'Your Number Two on Base',
      type: 'website',
      url: BASE_URL,
      images: [openGraphImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Farcasturds',
      description: 'Your Number Two on Base',
      images: [openGraphImage],
    },
    other: {
      'fc:miniapp': JSON.stringify(fcMiniAppMetadata),
      'fc:frame': JSON.stringify(fcFrameMetadata),
    },
  };
}

export default function ShareMiniAppPage() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Farcasturds</h1>
      <p>Get ready to share your Farcasturds reputation scores.</p>
    </main>
  );
}
