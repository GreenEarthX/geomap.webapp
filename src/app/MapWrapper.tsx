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
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  

useEffect(() => {
  setIsClient(true); // client-only check
}, []);


  // ✅ Add this useEffect to control scrolling
  useEffect(() => {
    // When this component mounts, hide the body's scrollbar
    document.body.style.overflow = 'hidden';

    // When the component unmounts, restore the scrollbar
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []); // The empty dependency array ensures this runs only once on mount and unmount

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);       // hide disclaimer
    setTimeout(() => setShowMap(true), 1000);  // after 1s, show map (via loading screen first)
  };

  if (!isClient) return null;

  if (showDisclaimer) return <DisclaimerScreen onAccept={handleAcceptDisclaimer} />;

  if (!showMap) return <LoadingScreen />; // <-- show loading if disclaimer accepted but map not loaded

  return <LeafletMap />;

}

function DisclaimerScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div style={disclaimerStyles.container}>
      <div style={disclaimerStyles.content}>
        <Image
          src="/gex-logo.png"
          alt="GEX Logo"
          width={100}
          height={160}
          style={disclaimerStyles.logo}
        />
        <h1 style={disclaimerStyles.title}>
          <span style={disclaimerStyles.gex}>GEX</span> Map - Beta Version
        </h1>
        
        <div style={disclaimerStyles.disclaimerBox}>
          <div style={disclaimerStyles.warningIcon}>⚠️</div>
          <h2 style={disclaimerStyles.disclaimerTitle}>Beta Version Disclaimer</h2>
          <p style={disclaimerStyles.disclaimerText}>
            You are currently using a Beta version of GreenEarthX, released for early access, testing, and feedback purposes.
          </p>
          <p style={disclaimerStyles.disclaimerText}>
            This version is still under development and may include bugs, incomplete features, or performance issues.
          </p>
          <p style={disclaimerStyles.disclaimerText}>
            Please do not upload or share any sensitive, confidential, or personal information while using this Beta version.
          </p>
          <p style={disclaimerStyles.disclaimerText}>
            We cannot guarantee the confidentiality, integrity, or security of any data entered at this stage.
          </p>
          <p style={disclaimerStyles.disclaimerText}>
            GreenEarthX assumes no liability for data loss or unauthorized access resulting from Beta usage.
          </p>
          <p style={disclaimerStyles.disclaimerText}>
            We appreciate your understanding and support as we improve the platform.
          </p>
          <p style={disclaimerStyles.disclaimerText}>
            You will be notified of future updates and improvements leading up to the full release.
          </p>
          <p style={disclaimerStyles.disclaimerText}>
            Thank you for helping us shape the future of GreenEarthX.
          </p>
        </div>

        <button 
          style={disclaimerStyles.acceptButton}
          onClick={onAccept}
        >
          I Understand and Accept
        </button>
      </div>
    </div>
  );
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
          width={60}
          height={96}
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
    marginBottom: 15,
  },
 title: {
  fontSize: '18px',
  color: '#003B70',
  fontWeight: 600,
  marginBottom: '16px',
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


const disclaimerStyles = {
  container: {
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(to bottom right, #e0f7fa, #e8f5e9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Segoe UI, sans-serif',
    padding: '20px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const,
    animation: 'fadeIn 0.6s ease-in',
  },
  content: {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  padding: '24px 32px',                    // ⬅ less vertical/horizontal padding
  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)', // ⬅ softer shadow
  textAlign: 'center' as const,
  maxWidth: '900px',                       // ⬅ wider
  width: '90%',                            // ⬅ responsive width
  maxHeight: '90vh',                       // ⬅ reduced height
  overflowY: 'auto' as const,              // ⬅ scrolls if too tall
},
  logo: {
  marginBottom: '20px',
  width: '40px',
  height: '40px',
},
  title: {
    fontSize: '18px',
    color: '#003B70',
    fontWeight: 700,
    marginBottom: '24px',
  },
  gex: {
    color: '#006CB5',
  },
  disclaimerBox: {
    textAlign: 'left' as const,
    backgroundColor: '#fdfdfd',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '20px',
    maxHeight: '50vh',
    overflowY: 'auto' as const,
  },
  warningIcon: {
    fontSize: '24px',
    color: '#f44336',
    marginBottom: '10px',
    textAlign: 'center' as const,
  },
  disclaimerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#d32f2f',
    textAlign: 'center' as const,
    marginBottom: '15px',
  },
  disclaimerText: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '10px',
    lineHeight: '1.6',
  },
  acceptButton: {
    backgroundColor: '#006CB5',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
