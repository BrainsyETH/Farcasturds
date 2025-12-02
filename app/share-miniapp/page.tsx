import { Metadata } from 'next';
import ShareMiniAppClient from './ShareMiniAppClient';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  // Extract score parameters from search params
  const username = typeof searchParams.username === 'string' ? searchParams.username : 'User';
  const fid = typeof searchParams.fid === 'string' ? searchParams.fid : '';
  const pfpUrl = typeof searchParams.pfpUrl === 'string' ? searchParams.pfpUrl : '';
  const neynarScore = typeof searchParams.neynarScore === 'string' ? searchParams.neynarScore : '';
  const builderScore = typeof searchParams.builderScore === 'string' ? searchParams.builderScore : '';
  const ethosScore = typeof searchParams.ethosScore === 'string' ? searchParams.ethosScore : '';
  const openRankRank = typeof searchParams.openRankRank === 'string' ? searchParams.openRankRank : '';
  const turdScore = typeof searchParams.turdScore === 'string' ? searchParams.turdScore : '';

  // Construct the image URL from score parameters if we have them
  let ogImage = `${process.env.NEXT_PUBLIC_APP_URL}/splash.png`;
  if (fid && username) {
    const imageUrl = new URL('/api/share-scores', process.env.NEXT_PUBLIC_APP_URL || '');
    imageUrl.searchParams.set('fid', fid);
    imageUrl.searchParams.set('username', username);
    if (pfpUrl) imageUrl.searchParams.set('pfpUrl', pfpUrl);
    if (neynarScore) imageUrl.searchParams.set('neynarScore', neynarScore);
    if (builderScore) imageUrl.searchParams.set('builderScore', builderScore);
    if (ethosScore) imageUrl.searchParams.set('ethosScore', ethosScore);
    if (openRankRank) imageUrl.searchParams.set('openRankRank', openRankRank);
    if (turdScore) imageUrl.searchParams.set('turdScore', turdScore);
    ogImage = imageUrl.toString();
  }

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
