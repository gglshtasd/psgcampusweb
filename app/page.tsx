"use client";

import { useState } from 'react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Storage for both tokens to test Hypothesis C
  const [laudeaToken, setLaudeaToken] = useState('');
  const [sisToken, setSisToken] = useState('');
  const [sessionCookies, setSessionCookies] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [logOutput, setLogOutput] = useState<string>('System ready. Enter credentials to extract tokens.');

  const appendLog = (title: string, data: any) => {
    const formattedData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    setLogOutput(prev => `=== ${title} ===\n${formattedData}\n\n${prev}`);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLogOutput('Initiating Auth & Token Extraction Matrix...');

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

      setLaudeaToken(data.laudeaToken);
      if (data.sisToken) setSisToken(data.sisToken);
      setSessionCookies(data.sessionCookies || '');
      
      appendLog('AUTH SUCCESS', `Laudea Token Extracted: YES\nSIS Token Extracted: ${data.sisToken ? 'YES' : 'FAILED'}\nCookies Extracted: YES`);
    } catch (err: any) {
      appendLog('AUTH ERROR', err.message);
    } finally {
      setLoading(false);
    }
  };

  // The base probe executor
  const executeProbe = async (endpoint: string, tokenToUse: string, strategy: string) => {
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, method: 'GET', accessToken: tokenToUse, sessionCookies, strategy })
      });
      
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { status: 500, error: err.message };
    }
  };

  // THE SHOTGUN METHOD: Test every combination sequentially
  const runMatrixTest = async () => {
    setLoading(true);
    appendLog('MATRIX TEST STARTED', 'Running combinations for CA Marks endpoint... Please wait.');
    
    const endpoint = `/sis/ca/marks/${username.toUpperCase()}`;
    const tokens = [
        { name: 'LAUDEA', val: laudeaToken }, 
        { name: 'IES_SIS', val: sisToken }
    ];
    const strategies = ['control', 'headers', 'headers-cookies'];

    let matrixResults = [];

    for (const token of tokens) {
        if (!token.val) continue; // Skip if SIS token failed to extract
        for (const strat of strategies) {
            appendLog(`TESTING`, `Token: ${token.name} | Strategy: ${strat}`);
            const result = await executeProbe(endpoint, token.val, strat);
            
            const logEntry = `Token: ${token.name} | Strat: ${strat} => Status: ${result.status}`;
            matrixResults.push(logEntry);
            
            // If we hit a 200 OK, we instantly know what works. Log the data and celebrate.
            if (result.status === 200 && result.data) {
                appendLog(`🎉 SUCCESS: ${token.name} + ${strat}`, result.data);
            } else {
                appendLog(`❌ FAILED: ${token.name} + ${strat}`, `Status: ${result.status}\nMessage: ${result.data?.message || result.error || 'Unknown'}`);
            }
        }
    }

    appendLog('MATRIX SUMMARY', matrixResults.join('\n'));
    setLoading(false);
  };

  // ==========================================
  // VIEW: AUTHENTICATED PROBE
  // ==========================================
  if (laudeaToken) {
    return (
      <main style={{ padding: '2rem', fontFamily: 'monospace', background: '#0f172a', minHeight: '100vh', color: '#e2e8f0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '1rem', marginBottom: '2rem' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#38bdf8' }}>Diagnostic Matrix Probe</h1>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Laudea Token: Active | SIS Token: {sisToken ? 'Active' : 'Missing'} | Cookies: Loaded</p>
            </div>
            <button onClick={() => { setLaudeaToken(''); setSisToken(''); }} style={{ background: 'transparent', color: '#f87171', border: '1px solid #f87171', padding: '0.5rem 1rem', cursor: 'pointer' }}>Disconnect</button>
          </header>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button 
              onClick={runMatrixTest}
              disabled={loading}
              style={{ padding: '1rem 2rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
            >
              {loading ? 'EXECUTING MATRIX...' : '🔥 RUN AUTOMATED SHOTGUN MATRIX TEST 🔥'}
            </button>
          </div>

          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Raw Diagnostic Output</span>
              <button onClick={() => navigator.clipboard.writeText(logOutput)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '0.25rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>Copy All</button>
            </div>
            <textarea 
              readOnly 
              value={logOutput} 
              style={{ width: '100%', height: '50vh', background: '#020617', color: '#a5b4fc', border: 'none', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
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
        <h1 style={{ margin: '0 0 1.5rem 0', color: '#38bdf8', fontSize: '1.25rem', textAlign: 'center' }}>SYSTEM DIAGNOSTIC</h1>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Deploying Matrix Failsafes...</p>
        
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
            {loading ? 'EXTRACTING TOKENS...' : 'INITIALIZE'}
          </button>
        </form>
      </div>
    </main>
  );
}
