"use client";

import { useState } from 'react';

export default function Home() {
  // --- State: Authentication ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // --- State: Dashboard Data ---
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  // --- Handler: Execute Login Flow ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');

    try {
      console.log('[UI - Step 1] Sending login credentials to local Auth API...');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check credentials.');
      }

      console.log('[UI - Step 2] Login successful! JWT Access Token received and stored in state.');
      setAccessToken(data.accessToken);
    } catch (err: any) {
      console.error('[UI - Error] Authentication failed:', err);
      setAuthError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  // --- Handler: Execute Universal Proxy Fetch ---
  const fetchDashboardData = async (endpoint: string) => {
    setLoadingData(true);
    setDataError('');
    setDashboardData(null);

    try {
      console.log(`[UI - Step 3] Requesting ${endpoint} via Universal Proxy...`);
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          method: 'GET',
          accessToken // Injecting the stored JWT
        })
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch data from proxy.');
      }

      console.log('[UI - Step 4] Data successfully retrieved from college portal:', json.data);
      setDashboardData(json.data);
    } catch (err: any) {
      console.error('[UI - Error] Proxy fetch failed:', err);
      setDataError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // --- Handler: Logout ---
  const handleLogout = () => {
    console.log('[UI] Logging out and clearing state.');
    setAccessToken('');
    setDashboardData(null);
    setUsername('');
    setPassword('');
  };

  // ==========================================
  // VIEW: DASHBOARD (Rendered if logged in)
  // ==========================================
  if (accessToken) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>PSG Portal Dashboard</h2>
          <button 
            onClick={handleLogout} 
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Logout
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => fetchDashboardData('/featureFlags/dashboardMenu')} 
            disabled={loadingData}
            style={{ padding: '0.75rem 1rem', cursor: loadingData ? 'not-allowed' : 'pointer', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Load Dashboard Menu
          </button>
          <button 
            onClick={() => fetchDashboardData('/collegeDetails')} 
            disabled={loadingData}
            style={{ padding: '0.75rem 1rem', cursor: loadingData ? 'not-allowed' : 'pointer', background: '#333', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Load College Details
          </button>
        </div>

        {loadingData && <p style={{ color: '#0070f3', fontWeight: 'bold' }}>Loading data via edge proxy...</p>}
        {dataError && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {dataError}</p>}
        
        {dashboardData && (
          <div style={{ background: '#f4f4f5', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid #e4e4e7' }}>
            <h3 style={{ marginTop: 0 }}>Raw JSON Response:</h3>
            <pre style={{ fontSize: '0.85rem', color: '#3f3f46' }}>{JSON.stringify(dashboardData, null, 2)}</pre>
          </div>
        )}
      </main>
    );
  }

  // ==========================================
  // VIEW: LOGIN (Rendered if logged out)
  // ==========================================
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '400px', margin: '10vh auto', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>PSG Auth Gateway</h1>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Roll Number</label>
          <input 
            id="username"
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="e.g. 21BCO001"
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>
        
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Password</label>
          <input 
            id="password"
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '6px' }}
          />
        </div>

        {authError && (
          <div style={{ padding: '0.75rem', background: '#fee2e2', border: '1px solid #f87171', borderRadius: '6px', color: '#b91c1c', fontSize: '0.85rem' }}>
            {authError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loadingAuth}
          style={{ padding: '0.85rem', marginTop: '0.5rem', cursor: loadingAuth ? 'not-allowed' : 'pointer', background: loadingAuth ? '#93c5fd' : '#0070f3', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '1rem', transition: 'background 0.2s' }}
        >
          {loadingAuth ? 'Authenticating with Keycloak...' : 'Secure Login'}
        </button>
      </form>
    </main>
  );
}
