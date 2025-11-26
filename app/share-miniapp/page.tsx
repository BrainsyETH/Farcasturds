import { Metadata } from 'next';

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://farcasturds.vercel.app';

export function generateMetadata({ searchParams }: Props): Metadata {
  const imageParam = searchParams?.image;
  const image = Array.isArray(imageParam) ? imageParam[0] : imageParam;
  const previewParam = searchParams?.preview;
  const previewImage = Array.isArray(previewParam) ? previewParam[0] : previewParam;
  const splashImageUrl = image || `${BASE_URL}/splash.png`;
  const previewImageUrl =
    previewImage ||
    image ||
    `${BASE_URL}/api/share-scores-preview`;

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
    title: 'Farcasturds Share',
    description: 'Share your Farcasturds reputation scores.',
    openGraph: {
      title: 'Farcasturds',
      description: 'Your Number Two on Base',
      images: [previewImageUrl],
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
