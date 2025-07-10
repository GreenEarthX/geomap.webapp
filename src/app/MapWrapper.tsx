'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

// Load LeafletMap with SSR disabled
const LeafletMap = dynamic(() => import('./components/LeafletMap'), {
  ssr: false,
});

export default function MapWrapper() {
  const [isClient, setIsClient] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    setIsClient(true); // ensures we are on the client
    const timer = setTimeout(() => setShowMap(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) return null; // prevent server-side render entirely

  return showMap ? <LeafletMap /> : <LoadingScreen />;
}

function LoadingScreen() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes animMarker {
        0% { transform: rotate(45deg) translate(5px, 5px); }
        100% { transform: rotate(45deg) translate(-5px, -5px); }
      }
      @keyframes animShadow {
        0% { transform: scale(0.5); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <Image
          src="/gex-logo.png"
          alt="GEX Logo"
          width={100}
          height={160}
          style={styles.logo}
        />
        <h1 style={styles.title}>
          Welcome to <span style={styles.gex}>GEX</span> Map
        </h1>
        <div style={styles.loader}>
          <div style={styles.loaderAfter}></div>
          <div style={styles.loaderBefore}></div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(to bottom right, #e0f7fa, #e8f5e9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Segoe UI, sans-serif',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: '#003B70',
    marginBottom: 20,
    fontWeight: 600,
  },
  gex: {
    color: '#006CB5',
  },
  loader: {
    width: 48,
    height: 48,
    position: 'relative' as const,
    display: 'block',
    margin: '0 auto',
    boxSizing: 'border-box' as const,
  },
  loaderAfter: {
    width: 48,
    height: 48,
    position: 'absolute' as const,
    left: 0,
    bottom: 0,
    borderRadius: '50% 50% 0',
    border: '15px solid #006CB5',
    transform: 'rotate(45deg)',
    animation: 'animMarker 0.4s ease-in-out infinite alternate',
    boxSizing: 'border-box' as const,
  },
  loaderBefore: {
    width: 24,
    height: 4,
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: '150%',
    margin: 'auto',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.2)',
    animation: 'animShadow 0.4s ease-in-out infinite alternate',
    boxSizing: 'border-box' as const,
  },
};
