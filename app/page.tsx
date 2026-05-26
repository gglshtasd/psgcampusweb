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
  const [currentView, setCurrentView] = useState('');

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

      console.log('[UI - Step 2] Login successful! JWT Access Token received.');
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
    setCurrentView(endpoint);

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
    setAccessToken('');
    setDashboardData(null);
    setUsername('');
    setPassword('');
    setCurrentView('');
  };

  // --- Render Helper: Dashboard Grid ---
  const renderDashboardMenu = () => {
    if (!Array.isArray(dashboardData)) return null;

    // Filter out inactive items just in case
    const activeApps = dashboardData.filter((app: any) => app.isDisplay);

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
        gap: '1rem', 
        marginTop: '1rem' 
      }}>
        {activeApps.map((app: any, index: number) => (
          <div key={index} style={{
            background: '#ffffff',
            border: '1px solid #eaeaea',
            borderRadius: '10px',
            padding: '1.5rem 1rem',
            textAlign: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.02)';
          }}
          >
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#f0f4f8',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {/* Fallback emoji icons based on name since we don't have their sprite images */}
              {app.name.includes('Student') ? '👨‍🎓' : 
               app.name.includes('Exam') ? '📝' : 
               app.name.includes('Fees') ? '💳' : 
               app.name.includes('Faculty') ? '👨‍🏫' : '📁'}
            </div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#111' }}>{app.name}</h3>
            <span style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>{app.link}</span>
          </div>
        ))}
      </div>
    );
  };

  // ==========================================
  // VIEW: DASHBOARD (Rendered if logged in)
  // ==========================================
  if (accessToken) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1000px', margin: '0 auto', background: '#fafafa', minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eaeaea', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#000' }}>PSG Portal Wrapper</h1>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>Welcome, {username}</p>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ padding: '0.5rem 1rem', cursor: 'pointer', background: '#fff', color: '#ff4d4f', border: '1px solid #ff4d4f', borderRadius: '6px', fontWeight: '500' }}
          >
            Sign Out
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            onClick={() => fetchDashboardData('/featureFlags/dashboardMenu')} 
            disabled={loadingData}
            style={{ padding: '0.75rem 1.25rem', cursor: loadingData ? 'not-allowed' : 'pointer', background: currentView === '/featureFlags/dashboardMenu' ? '#000' : '#fff', color: currentView === '/featureFlags/dashboardMenu' ? '#fff' : '#000', border: '1px solid #000', borderRadius: '6px', fontWeight: '500' }}
          >
            Dashboard Menu
          </button>
          <button 
            onClick={() => fetchDashboardData('/collegeDetails')} 
            disabled={loadingData}
            style={{ padding: '0.75rem 1.25rem', cursor: loadingData ? 'not-allowed' : 'pointer', background: currentView === '/collegeDetails' ? '#000' : '#fff', color: currentView === '/collegeDetails' ? '#fff' : '#000', border: '1px solid #000', borderRadius: '6px', fontWeight: '500' }}
          >
            College Details
          </button>
          <button 
            onClick={() => fetchDashboardData('/sis')} 
            disabled={loadingData}
            style={{ padding: '0.75rem 1.25rem', cursor: loadingData ? 'not-allowed' : 'pointer', background: currentView === '/sis' ? '#000' : '#fff', color: currentView === '/sis' ? '#fff' : '#000', border: '1px solid #000', borderRadius: '6px', fontWeight: '500' }}
          >
            Student Info (SIS)
          </button>
        </div>

        {loadingData && <p style={{ color: '#0070f3', fontWeight: '500' }}>Fetching live data via edge proxy...</p>}
        {dataError && <p style={{ color: '#d93025', fontWeight: '500', background: '#fce8e6', padding: '1rem', borderRadius: '6px' }}>Error: {dataError}</p>}
        
        {dashboardData && (
          <div>
            {/* If the data is the dashboard menu array, render our custom UI */}
            {currentView === '/featureFlags/dashboardMenu' && Array.isArray(dashboardData) ? (
              renderDashboardMenu()
            ) : (
              /* Otherwise, show the raw JSON so we can analyze it for the next step */
              <div style={{ background: '#1e1e1e', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto' }}>
                <h3 style={{ marginTop: 0, color: '#fff', fontSize: '1rem' }}>Raw Payload ({currentView}):</h3>
                <pre style={{ fontSize: '0.85rem', color: '#9cdcfe', margin: 0 }}>{JSON.stringify(dashboardData, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </main>
    );
  }

  // ==========================================
  // VIEW: LOGIN (Rendered if logged out)
  // ==========================================
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '400px', margin: '10vh auto', border: '1px solid #eaeaea', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', background: '#fff' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#000' }}>PSG Wrapper</h1>
        <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>Lightning fast portal access</p>
      </div>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: '#333' }}>Roll Number</label>
          <input 
            id="username"
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="e.g. 21BCO001"
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
          />
        </div>
        
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: '#333' }}>Password</label>
          <input 
            id="password"
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{ width: '100%', padding: '0.75rem', boxSizing: 'border-box', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
          />
        </div>

        {authError && (
          <div style={{ padding: '0.75rem', background: '#fce8e6', border: '1px solid #f28b82', borderRadius: '8px', color: '#d93025', fontSize: '0.85rem', fontWeight: '500' }}>
            {authError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loadingAuth}
          style={{ padding: '0.85rem', marginTop: '0.5rem', cursor: loadingAuth ? 'not-allowed' : 'pointer', background: loadingAuth ? '#666' : '#000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '1rem', transition: 'background 0.2s' }}
        >
          {loadingAuth ? 'Authenticating...' : 'Secure Login'}
        </button>
      </form>
    </main>
  );
}
