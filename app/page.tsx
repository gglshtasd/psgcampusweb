"use client";

import { useState } from 'react';

export default function Home() {
  // --- Core State ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accessToken, setAccessToken] = useState('');

  // --- App State ---
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, profile, attendance, marks
  const [apiData, setApiData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);

  // --- Mocked Profile Data (Until we find the true endpoint) ---
  const mockProfile = {
    name: "MOHAMED KASSIM S",
    roll: username.toUpperCase(),
    degree: "B.Com (Professional Accounting)",
    email: "mohamedkassimsarbudeen@gmail.com",
    completion: 87
  };

  // --- Handler: Login Flow ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAuth(true);
    setAuthError('');

    try {
      console.log(`[UI - Auth] Attempting login for ${username}...`);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed.');

      console.log('[UI - Auth] Success! JWT stored.');
      setAccessToken(data.accessToken);
      
      // Auto-fetch dashboard apps on login
      fetchDashboardApps(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  // --- Handler: Fetch Dashboard Menu (The one API we know works) ---
  const fetchDashboardApps = async (token: string) => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: '/featureFlags/dashboardMenu', method: 'GET', accessToken: token })
      });
      const json = await res.json();
      if (res.ok) setApiData(json.data);
    } catch (err) {
      console.error("Failed to fetch dashboard apps", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    setAccessToken('');
    setUsername('');
    setPassword('');
    setApiData(null);
  };

  // ==========================================
  // COMPONENT: SIDEBAR NAVIGATION
  // Built using the AngularJS routing schema provided
  // ==========================================
  const Sidebar = () => (
    <div style={{ width: '250px', background: '#111827', color: '#fff', minHeight: '100vh', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px' }}>PSG GATEWAY</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>Lightning Fast Wrapper</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Core</p>
        <button onClick={() => setActiveTab('dashboard')} style={navBtnStyle(activeTab === 'dashboard')}>Dashboard</button>
        <button onClick={() => setActiveTab('profile')} style={navBtnStyle(activeTab === 'profile')}>My Profile</button>
        
        <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem 0', textTransform: 'uppercase' }}>Academics</p>
        <button onClick={() => setActiveTab('attendance')} style={navBtnStyle(activeTab === 'attendance')}>Attendance</button>
        <button onClick={() => setActiveTab('timetable')} style={navBtnStyle(activeTab === 'timetable')}>Time Table</button>
        
        <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem 0', textTransform: 'uppercase' }}>Exams</p>
        <button onClick={() => setActiveTab('camarks')} style={navBtnStyle(activeTab === 'camarks')}>CA Marks</button>
        <button onClick={() => setActiveTab('results')} style={navBtnStyle(activeTab === 'results')}>Results</button>
      </nav>

      <div style={{ marginTop: 'auto' }}>
        <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  const navBtnStyle = (isActive: boolean) => ({
    background: isActive ? '#374151' : 'transparent',
    color: isActive ? '#fff' : '#d1d5db',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: isActive ? '600' : '400',
    transition: 'background 0.2s'
  });

  // ==========================================
  // VIEW: AUTHENTICATED DASHBOARD
  // ==========================================
  if (accessToken) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Sidebar />
        
        <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
          {/* Top Profile Header */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '1.5rem 2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#111827' }}>Welcome back, {mockProfile.name}</h1>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>{mockProfile.roll} • {mockProfile.degree}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#dcfce7', color: '#166534', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                Profile: {mockProfile.completion}% Complete
              </div>
            </div>
          </header>

          {/* Dynamic Content Area */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '1rem' }}>Connected Applications</h2>
              {loadingData ? <p>Syncing apps...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {Array.isArray(apiData) && apiData.filter(app => app.isDisplay).map((app, i) => (
                    <div key={i} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {app.name.includes('Student') ? '👨‍🎓' : app.name.includes('Exam') ? '📝' : app.name.includes('Fees') ? '💳' : '📁'}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#111827' }}>{app.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>{app.link}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeTab === 'attendance' || activeTab === 'camarks' || activeTab === 'results' || activeTab === 'timetable' || activeTab === 'profile') && (
            <div style={{ background: '#fff', padding: '3rem', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>Awaiting API Endpoint</h2>
              <p style={{ color: '#6b7280', maxWidth: '500px', margin: '0 auto' }}>
                We know the AngularJS route for this is <code>#!/{activeTab}</code>, but we need the actual backend data URL. 
              </p>
              <div style={{ marginTop: '2rem', padding: '1rem', background: '#fef3c7', color: '#92400e', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left', maxWidth: '600px', margin: '2rem auto 0 auto' }}>
                <strong>Next Step:</strong> Open the original college portal, press F12 (Network Tab), select "Fetch/XHR", and click the "{activeTab}" button. Copy the URL of the API request it makes!
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW: LOGIN
  // ==========================================
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#fff', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '1.75rem' }}>PSG Gateway</h1>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>Enter your Roll Number to continue</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}>Roll Number</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. 25BPA530" style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem', color: '#374151' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', outline: 'none' }} />
          </div>

          {authError && <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem' }}>{authError}</div>}

          <button type="submit" disabled={loadingAuth} style={{ padding: '0.85rem', background: loadingAuth ? '#9ca3af' : '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: loadingAuth ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {loadingAuth ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </main>
  );
}
