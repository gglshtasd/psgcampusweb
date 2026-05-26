"use client";

import { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [logOutput, setLogOutput] = useState<string>('System ready. Waiting for authentication...');

  const appendLog = (title: string, data: any) => {
    const formattedData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    setLogOutput(`=== ${title} ===\n${formattedData}\n`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLogOutput('Initiating authentication flow...');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed.');
      }

      setAccessToken(data.accessToken);
      appendLog('AUTH SUCCESS', `JWT Acquired for ${username}.\nToken Prefix: ${data.accessToken.substring(0, 20)}...`);
    } catch (err: any) {
      appendLog('AUTH ERROR', err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeProbe = async (endpoint: string, method: string = 'GET') => {
    setLoading(true);
    setLogOutput(`Probing API Endpoint: ${method} ${endpoint}\nPlease wait...`);

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, method, accessToken })
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || `Proxy failed to fetch ${endpoint}`);
      }
      
      appendLog(`RESPONSE: ${endpoint}`, json.data);
    } catch (err: any) {
      appendLog(`FETCH ERROR: ${endpoint}`, err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // VIEW: AUTHENTICATED PROBE
  // ==========================================
  if (accessToken) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'monospace', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>PSG API Diagnostic Probe</h1>
            <button onClick={() => setAccessToken('')} style={{ background: 'transparent', color: '#f87171', border: '1px solid #f87171', padding: '0.5rem 1rem', cursor: 'pointer' }}>Disconnect</button>
          </header>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => executeProbe(`/sis/students/${username.toUpperCase()}`)}
              disabled={loading}
              style={{ padding: '0.75rem 1rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              [GET] Probe Profile
            </button>
            <button 
              onClick={() => executeProbe(`/sis/attendance/old/${username.toUpperCase()}`)}
              disabled={loading}
              style={{ padding: '0.75rem 1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              [GET] Probe Attendance
            </button>
            <button 
              onClick={() => executeProbe(`/sis/ca/marks/${username.toUpperCase()}`)}
              disabled={loading}
              style={{ padding: '0.75rem 1rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              [GET] Probe CA Marks
            </button>
          </div>

          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Raw JSON Output (Copy this and send it to the AI)</span>
              <button onClick={() => navigator.clipboard.writeText(logOutput)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>Copy All</button>
            </div>
            <textarea 
              readOnly 
              value={logOutput} 
              style={{ width: '100%', height: '60vh', background: '#020617', color: '#a5b4fc', border: 'none', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
            />
          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW: LOGIN
  // ==========================================
  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', fontFamily: 'monospace' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#1e293b', padding: '2rem', borderRadius: '8px', border: '1px solid #334155' }}>
        <h1 style={{ margin: '0 0 1.5rem 0', color: '#38bdf8', fontSize: '1.25rem', textAlign: 'center' }}>TERMINAL LOGIN</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Roll Number" 
            style={{ padding: '0.75rem', background: '#020617', color: '#fff', border: '1px solid #475569', outline: 'none', fontFamily: 'monospace' }} 
          />
          <input 
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" 
            style={{ padding: '0.75rem', background: '#020617', color: '#fff', border: '1px solid #475569', outline: 'none', fontFamily: 'monospace' }} 
          />
          <button type="submit" disabled={loading} style={{ padding: '0.75rem', background: '#38bdf8', color: '#0f172a', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace' }}>
            {loading ? 'EXECUTING...' : 'INITIALIZE'}
          </button>
        </form>
      </div>
    </main>
  );
}
