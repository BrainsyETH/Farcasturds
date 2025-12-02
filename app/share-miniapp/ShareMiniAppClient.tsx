"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// This component redirects to the main app with the user's profile
export default function ShareMiniAppClient() {
  const params = useSearchParams();
  const router = useRouter();
  const fid = params.get('fid');

  useEffect(() => {
    // Redirect to main app with FID and show profile tab
    if (fid) {
      const mainAppUrl = `/?fid=${fid}`;
      router.push(mainAppUrl);
    } else {
      // No FID, redirect to home
      router.push('/');
    }
  }, [fid, router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 25%, #16213e 50%, #0f0919 100%)',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Loading Farcasturds...</h2>
        <p style={{ marginTop: '1rem', color: '#9ca3af' }}>
          Redirecting to profile...
        </p>
      </div>
    </div>
  );
}

// Ensure proper tree-shaking and component-level caching
ShareMiniAppClient.displayName = "ShareMiniAppClient";
