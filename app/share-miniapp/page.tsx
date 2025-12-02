import { Metadata } from 'next';
import ShareMiniAppClient from './ShareMiniAppClient';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // Get the preview image URL from search params
  const preview = typeof searchParams.preview === 'string' ? searchParams.preview : null;
  const username = typeof searchParams.username === 'string' ? searchParams.username : 'User';
  const fid = typeof searchParams.fid === 'string' ? searchParams.fid : '';

  // Use preview for OG image or fallback to default
  const ogImage = preview || `${process.env.NEXT_PUBLIC_APP_URL}/splash.png`;

  return {
    title: `${username}'s Reputation Scores | Farcasturds`,
    description: `Check out ${username}'s reputation scores on Farcasturds! View Turd Score, Neynar, Base, and Ethos scores.`,
    openGraph: {
      title: `${username}'s Reputation Scores`,
      description: `Check out ${username}'s reputation scores on Farcasturds!`,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${username}'s Reputation Scores`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${username}'s Reputation Scores`,
      description: `Check out ${username}'s reputation scores on Farcasturds!`,
      images: [ogImage],
    },
    other: {
      'fc:frame': 'vNext',
      'fc:frame:image': ogImage,
      'fc:frame:button:1': 'View Full Profile',
      'fc:frame:button:1:action': 'link',
      'fc:frame:button:1:target': `${process.env.NEXT_PUBLIC_APP_URL}/?fid=${fid}`,
    },
  };
}

export default function ShareMiniAppPage() {
  return <ShareMiniAppClient />;
}
