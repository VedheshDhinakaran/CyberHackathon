import React, { useState } from 'react';
import { Target, Copy, Check, ExternalLink } from 'lucide-react';

const IOC_CONFIG = {
  IPv4:   { color: 'var(--accent-red)', bg: 'rgba(255,59,92,0.1)', border: 'rgba(255,59,92,0.25)' },
  domain: { color: 'var(--accent-orange)', bg: 'rgba(255,140,66,0.1)', border: 'rgba(255,140,66,0.25)' },
  md5:    { color: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
  sha256: { color: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.08)', border: 'rgba(0,212,255,0.2)' },
  JA3:    { color: 'var(--accent-purple)', bg: 'rgba(124,92,252,0.1)', border: 'rgba(124,92,252,0.25)' },
  CVE:    { color: 'var(--accent-yellow)', bg: 'rgba(255,217,61,0.08)', border: 'rgba(255,217,61,0.2)' },
  url:    { color: 'var(--accent-green)', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.2)' },
};

function IOCCard({ ioc, expanded }) {
  const [copied, setCopied] = useState(false);
  const cfg = IOC_CONFIG[ioc.ioc_type] || { color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ioc.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: expanded ? '14px 16px' : '10px 14px',
      transition: 'all 0.2s', position: 'relative',
    }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
      onMouseLeave={e => e.currentTarget.style.filter = ''}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem',
              color: cfg.color, letterSpacing: '0.12em', textTransform: 'uppercase',
              fontWeight: 700,
            }}>
              ◆ {ioc.ioc_type}
            </span>
          </div>
          {/* Value */}
          <div style={{
            fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem',
            color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.5,
            marginBottom: ioc.description ? 6 : 0,
          }}>
            {ioc.value}
          </div>
          {/* Description */}
          {ioc.description && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 4, fontWeight: 400 }}>
              {ioc.description}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={handleCopy} title="Copy" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: copied ? 'var(--accent-green)' : 'var(--text-dim)',
            padding: 4, transition: 'color 0.2s',
          }}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
          {(ioc.ioc_type === 'IPv4' || ioc.ioc_type === 'domain') && (
            <a
              href={`https://www.virustotal.com/gui/search/${ioc.value}`}
              target="_blank" rel="noopener noreferrer"
              title="VirusTotal lookup"
              style={{ color: 'var(--text-dim)', display: 'flex', alignItems: 'center', transition: 'color 0.2s', padding: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = cfg.color}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IOCPanel({ iocs, expanded = false }) {
  const [filter, setFilter] = useState('ALL');

  const types = ['ALL', ...new Set(iocs.map(i => i.ioc_type))];
  const filtered = filter === 'ALL' ? iocs : iocs.filter(i => i.ioc_type === filter);

  return (
    <div className="panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header">
        <div className="accent-dot" />
        <h3>Indicators of Compromise ({iocs.length})</h3>
      </div>

      {/* Type filter tabs */}
      {iocs.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
          {types.map(t => {
            const cfg = IOC_CONFIG[t];
            const isActive = filter === t;
            return (
              <button key={t} onClick={() => setFilter(t)} style={{
                background: isActive ? (cfg?.bg || 'rgba(0,212,255,0.1)') : 'none',
                border: `1px solid ${isActive ? (cfg?.border || 'rgba(0,212,255,0.3)') : 'var(--border-subtle)'}`,
                color: isActive ? (cfg?.color || 'var(--accent-cyan)') : 'var(--text-dim)',
                padding: '3px 10px', borderRadius: 2, cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem',
                letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.15s',
              }}>
                {t}
              </button>
            );
          })}
        </div>
      )}

      {!iocs.length ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', padding: '32px 0' }}>
          NO IOCs DETECTED
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          overflowY: expanded ? 'visible' : 'auto', maxHeight: expanded ? 'none' : 420,
          paddingRight: 4,
        }}>
          {filtered.map((ioc, idx) => (
            <IOCCard key={idx} ioc={ioc} expanded={expanded} />
          ))}
        </div>
      )}

      {/* Export bar */}
      {iocs.length > 0 && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              const text = iocs.map(i => `${i.ioc_type}\t${i.value}\t${i.description || ''}`).join('\n');
              const blob = new Blob([text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'iocs.txt'; a.click();
            }}
            className="btn-primary" style={{ fontSize: '0.65rem', padding: '5px 12px' }}
          >
            Export TXT
          </button>
          <button
            onClick={() => {
              const json = JSON.stringify(iocs, null, 2);
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'iocs.json'; a.click();
            }}
            className="btn-primary" style={{ fontSize: '0.65rem', padding: '5px 12px' }}
          >
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}