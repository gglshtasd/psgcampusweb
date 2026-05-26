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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabData, setTabData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

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
      
      // Default to loading profile first to get the user's name
      fetchTabData('profile', `/sis/students/${username.toUpperCase()}`);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  // --- Handler: Fetch Dynamic Tab Data ---
  const fetchTabData = async (tabName: string, endpoint: string, method: string = 'GET', body?: any) => {
    setActiveTab(tabName);
    setLoadingData(true);
    setDataError('');
    setTabData(null);

    try {
      console.log(`[UI - Data] Fetching ${endpoint}...`);
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, method, body, accessToken })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to fetch ${tabName}`);
      
      setTabData(json.data);
    } catch (err: any) {
      console.error(`[UI - Data Error]`, err);
      setDataError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => {
    setAccessToken('');
    setUsername('');
    setPassword('');
    setTabData(null);
    setActiveTab('dashboard');
  };

  // ==========================================
  // COMPONENT: SIDEBAR NAVIGATION
  // ==========================================
  const Sidebar = () => (
    <div style={{ width: '250px', background: '#111827', color: '#fff', minHeight: '100vh', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px' }}>PSG GATEWAY</h2>
        <p style={{ margin: '0.25rem 0 0 0', color: '#9ca3af', fontSize: '0.75rem' }}>Secure Portal Wrapper</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>Core</p>
        <button onClick={() => fetchTabData('dashboard', '/featureFlags/dashboardMenu')} style={navBtnStyle(activeTab === 'dashboard')}>Dashboard</button>
        <button onClick={() => fetchTabData('profile', `/sis/students/${username.toUpperCase()}`)} style={navBtnStyle(activeTab === 'profile')}>My Profile</button>
        
        <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem 0', textTransform: 'uppercase' }}>Academics</p>
        <button onClick={() => fetchTabData('attendance', `/sis/attendance/old/${username.toUpperCase()}`)} style={navBtnStyle(activeTab === 'attendance')}>Attendance</button>
        <button onClick={() => setActiveTab('timetable')} style={navBtnStyle(activeTab === 'timetable')}>Time Table</button>
        
        <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 'bold', margin: '1.5rem 0 0.5rem 0', textTransform: 'uppercase' }}>Exams</p>
        <button onClick={() => fetchTabData('camarks', `/sis/ca/marks/${username.toUpperCase()}`)} style={navBtnStyle(activeTab === 'camarks')}>CA Marks</button>
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
    background: isActive ? '#374151' : 'transparent', color: isActive ? '#fff' : '#d1d5db',
    border: 'none', padding: '0.75rem 1rem', borderRadius: '6px', textAlign: 'left' as const,
    cursor: 'pointer', fontSize: '0.9rem', fontWeight: isActive ? '600' : '400', transition: 'background 0.2s'
  });

  // ==========================================
  // VIEW RENDERERS
  // ==========================================
  const renderProfile = () => {
    if (!tabData) return null;
    return (
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Academic Profile</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          <div><strong style={{ color: '#6b7280', fontSize: '0.85rem' }}>FULL NAME</strong><p style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{tabData.studentName || 'N/A'}</p></div>
          <div><strong style={{ color: '#6b7280', fontSize: '0.85rem' }}>ROLL NUMBER</strong><p style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{tabData.rollNumber || username}</p></div>
          <div><strong style={{ color: '#6b7280', fontSize: '0.85rem' }}>PROGRAMME</strong><p style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{tabData.programmeName || 'N/A'}</p></div>
          <div><strong style={{ color: '#6b7280', fontSize: '0.85rem' }}>BATCH YEAR</strong><p style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{tabData.batchYear || 'N/A'}</p></div>
          <div><strong style={{ color: '#6b7280', fontSize: '0.85rem' }}>EMAIL</strong><p style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{tabData.emailId || 'N/A'}</p></div>
          <div><strong style={{ color: '#6b7280', fontSize: '0.85rem' }}>SECTION</strong><p style={{ margin: '0.25rem 0', fontSize: '1.1rem' }}>{tabData.section || 'N/A'}</p></div>
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    if (!tabData) return null;
    return (
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div style={{ flex: 1, background: '#fff', padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>Overall Attendance</h3>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: tabData.netPresentPercentage > 75 ? '#16a34a' : '#dc2626' }}>
            {tabData.netPresentPercentage || 0}%
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', color: '#374151' }}>Days Present</span>
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{tabData.present || 0}</span>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', color: '#374151' }}>Days Absent</span>
            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{tabData.absent || 0}</span>
          </div>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', color: '#374151' }}>Total Working Days</span>
            <span style={{ color: '#4b5563', fontWeight: 'bold' }}>{tabData.workingDaysTillToday || 0}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderCAMarks = () => {
    if (!Array.isArray(tabData)) return <p>No marks data available.</p>;
    return (
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>COURSE CODE</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>SUBJECT NAME</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>MARKS OBTAINED</th>
            </tr>
          </thead>
          <tbody>
            {tabData.map((course: any, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '1rem', fontWeight: '500', color: '#374151' }}>{course.courseCode || 'N/A'}</td>
                <td style={{ padding: '1rem', color: '#4b5563' }}>{course.courseName || 'Unknown Subject'}</td>
                <td style={{ padding: '1rem' }}>
                  {course.testDetails && course.testDetails.length > 0 
                    ? course.testDetails.map((t:any) => `${t.testName}: ${t.marksSecured}/${t.maxMarks}`).join(' | ') 
                    : <span style={{ color: '#9ca3af' }}>Not Uploaded</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDashboardApps = () => {
    if (!Array.isArray(tabData)) return null;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {tabData.filter(app => app.isDisplay).map((app, i) => (
          <div key={i} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
    );
  };

  // ==========================================
  // VIEW: AUTHENTICATED WRAPPER
  // ==========================================
  if (accessToken) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.75rem', color: '#111827', textTransform: 'capitalize' }}>
              {activeTab.replace(/([A-Z])/g, ' $1').trim()}
            </h1>
          </header>

          {loadingData ? (
            <div style={{ color: '#3b82f6', fontWeight: '500' }}>Fetching live data...</div>
          ) : dataError ? (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', border: '1px solid #fecaca' }}>{dataError}</div>
          ) : (
            <div>
              {activeTab === 'profile' && renderProfile()}
              {activeTab === 'attendance' && renderAttendance()}
              {activeTab === 'camarks' && renderCAMarks()}
              {activeTab === 'dashboard' && renderDashboardApps()}
              {(activeTab === 'timetable' || activeTab === 'results') && (
                <div style={{ background: '#fff', padding: '3rem', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
                  <h2>Under Construction</h2>
                  <p>We need to map the endpoints for this module next.</p>
                </div>
              )}
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
