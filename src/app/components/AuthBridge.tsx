'use client';
import { useState, useEffect } from 'react';

interface AuthBridgeProps {
  onAuthChange?: (isAuthenticated: boolean, user?: any) => void;
}

export default function AuthBridge({ onAuthChange }: AuthBridgeProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [logoutReady, setLogoutReady] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check for token in URL params first (from redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');
      const refreshTokenFromUrl = urlParams.get('refresh_token');
      
      if (tokenFromUrl) {
        // Validate token format before storing
        if (tokenFromUrl.split('.').length === 3) {
          localStorage.setItem('geomap-auth-token', tokenFromUrl);
          if (refreshTokenFromUrl && refreshTokenFromUrl.split('.').length === 3) {
            localStorage.setItem('geomap-refresh-token', refreshTokenFromUrl);
          }
        } else {
          console.warn('Invalid token format from URL, not storing');
        }
        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('token');
        newUrl.searchParams.delete('refresh_token');
        window.history.replaceState({}, document.title, newUrl.toString());
      }
      
      let token = localStorage.getItem('geomap-auth-token');
      
      // Validate stored token format
      if (token && token.split('.').length !== 3) {
        console.warn('Invalid token format in localStorage, clearing');
        localStorage.removeItem('geomap-auth-token');
        localStorage.removeItem('geomap-refresh-token');
        token = null;
      }
      
      // Check if stored access token is actually a refresh token
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.type === 'refresh') {
            console.warn('Refresh token found in access token slot, attempting to get new access token');
            // Move it to the correct slot and try to refresh
            localStorage.setItem('geomap-refresh-token', token);
            localStorage.removeItem('geomap-auth-token');
            
            try {
              const newAccessToken = await refreshToken();
              if (newAccessToken) {
                token = newAccessToken;
                console.log('Successfully exchanged refresh token for access token');
              } else {
                console.error('Failed to get new access token');
                token = null;
              }
            } catch (refreshError) {
              console.error('Error refreshing token:', refreshError);
              token = null;
            }
          }
        } catch (error) {
          console.warn('Could not decode token payload:', error);
        }
      }
      
      if (token) {
        let response = await fetch('/api/verify-token', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // If token expired, try to refresh
        if (response.status === 401) {
          const refreshedToken = await refreshToken();
          if (refreshedToken) {
            response = await fetch('/api/verify-token', {
              headers: { 'Authorization': `Bearer ${refreshedToken}` }
            });
          }
        }
        
        if (response.ok) {
          const data = await response.json();
            setIsAuthenticated(true);
            setUser(data.user);
            onAuthChange?.(true, data.user);
        } else {
          handleAuthFailure();
        }
      } else {
        handleAuthFailure();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      handleAuthFailure();
    }
    
    setLoading(false);
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('geomap-refresh-token');
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('geomap-auth-token', data.accessToken);
        localStorage.setItem('geomap-refresh-token', data.refreshToken);
        return data.accessToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('geomap-auth-token');
      localStorage.removeItem('geomap-refresh-token');
      return null;
    }
  };

  const handleAuthFailure = () => {
  localStorage.removeItem('geomap-auth-token');
  localStorage.removeItem('geomap-refresh-token');
  setIsAuthenticated(false);
  setUser(null);
  onAuthChange?.(false, null);
  };

  const handleLogin = () => {
    const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL;
    if (!onboardingUrl) {
      console.error('NEXT_PUBLIC_ONBOARDING_URL environment variable is not set');
      return;
    }
    const redirectUrl = `${onboardingUrl}/auth/authenticate?redirect=${encodeURIComponent(window.location.href)}`;
    window.location.href = redirectUrl;
  };

  const handleLogout = async () => {
    // Remove tokens locally
    localStorage.removeItem('geomap-auth-token');
    localStorage.removeItem('geomap-refresh-token');
    setIsAuthenticated(false);
    setUser(null);
    onAuthChange?.(false);

    // Redirect to NextAuth signout endpoint, which will clear session and then redirect back
    const onboardingUrl = process.env.NEXT_PUBLIC_ONBOARDING_URL;
    const geomapUrl = process.env.NEXT_PUBLIC_GEOMAP_URL;
    
    if (!onboardingUrl || !geomapUrl) {
      console.error('Environment variables NEXT_PUBLIC_ONBOARDING_URL or NEXT_PUBLIC_GEOMAP_URL are not set');
      return;
    }
    
    window.location.href = `${onboardingUrl}/api/auth/signout?callbackUrl=${geomapUrl}`;
  };

  const handleLogoutClick = () => {
    if (!logoutReady) {
      setLogoutReady(true);
      setTimeout(() => setLogoutReady(false), 3000); // Reset after 3s if not confirmed
    } else {
      handleLogout();
      setLogoutReady(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-loading flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="auth-bridge flex items-center gap-3">
      {isAuthenticated ? (
        <>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Welcome, {user?.name || user?.email}</span>
          </div>
          <button 
            onClick={handleLogoutClick}
            className="auth-button logout px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </>
      ) : (
        <button 
          onClick={handleLogin} 
          className="auth-button login px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Login to Edit
        </button>
      )}
    </div>
  );
}
