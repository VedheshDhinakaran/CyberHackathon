import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { Shield, Radio, Clock } from 'lucide-react';

function App() {
  const [activeFileId, setActiveFileId] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2, '0');
  const ts = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())} UTC`;

  return (
    <div className="min-h-screen scanlines">
      {/* Header */}
      <header style={{
        background: 'rgba(5,8,16,0.96)',
        borderBottom: '1px solid rgba(0,212,255,0.12)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 34, height: 34,
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={16} color="var(--accent-cyan)" />
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.85rem', letterSpacing: '0.2em', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                NETRECON
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', marginTop: -2 }}>
                FORENSICS WORKBENCH v2.0
              </div>
            </div>
          </div>

          {/* Center status */}
          {activeFileId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }} className="animate-pulse-cyan" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                ACTIVE SESSION: <span style={{ color: 'var(--accent-cyan)' }}>{activeFileId.slice(0, 8).toUpperCase()}</span>
              </span>
            </div>
          )}

          {/* Right: time + radio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={11} color="var(--text-dim)" />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                {ts}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Radio size={11} color="var(--accent-green)" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--accent-green)', letterSpacing: '0.1em' }}>
                SYS ONLINE
              </span>
            </div>
          </div>
        </div>

        {/* Progress stripe if loading */}
        <div id="header-progress-bar" style={{ height: 1, width: '100%', background: 'rgba(0,212,255,0.05)' }}>
          <div id="header-progress-fill" style={{ height: '100%', width: '0%', background: 'linear-gradient(90deg, transparent, var(--accent-cyan), transparent)', transition: 'width 0.4s ease' }} />
        </div>
      </header>

      <main style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 24px' }}>
        <Dashboard activeFileId={activeFileId} setActiveFileId={setActiveFileId} />
      </main>
    </div>
  );
}

export default App;