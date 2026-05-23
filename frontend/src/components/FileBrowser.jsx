import React from 'react';
import { File, Download, Hash, Cpu } from 'lucide-react';

const MIME_COLORS = {
  'application/x-msdownload': { color: 'var(--accent-red)', label: 'EXE' },
  'application/x-sharedlib':  { color: 'var(--accent-orange)', label: 'DLL' },
  'application/octet-stream': { color: 'var(--accent-yellow)', label: 'BIN' },
  'text/plain':               { color: 'var(--accent-cyan)', label: 'TXT' },
  'text/html':                { color: 'var(--accent-green)', label: 'HTML' },
  'application/pdf':          { color: 'var(--accent-purple)', label: 'PDF' },
  'image/png':                { color: 'var(--accent-cyan)', label: 'IMG' },
  'image/jpeg':               { color: 'var(--accent-cyan)', label: 'IMG' },
};

function EntropyBar({ entropy }) {
  if (entropy == null) return null;
  const val = Math.min(8, Math.max(0, parseFloat(entropy)));
  const pct = (val / 8) * 100;
  const color = val > 7.5 ? 'var(--accent-red)' : val > 6.5 ? 'var(--accent-orange)' : val > 4 ? 'var(--accent-yellow)' : 'var(--accent-green)';
  const label = val > 7.5 ? 'ENCRYPTED/PACKED' : val > 6.5 ? 'HIGH ENTROPY' : val > 4 ? 'MIXED' : 'PLAINTEXT';

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>ENTROPY</span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color }}>
          {val.toFixed(2)} — {label}
        </span>
      </div>
      <div style={{ height: 3, background: 'var(--bg-deep)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}66` }} />
      </div>
    </div>
  );
}

export default function FileBrowser({ files }) {
  if (!files || files.length === 0) {
    return (
      <div className="panel" style={{ padding: '20px 24px' }}>
        <div className="section-header">
          <div className="accent-dot" />
          <h3>Extracted Files</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}>
          NO FILES EXTRACTED
        </div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      <div className="section-header">
        <div className="accent-dot" />
        <h3>Extracted Files ({files.length})</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {files.map((file, idx) => {
          const mimeInfo = MIME_COLORS[file.mime_type] || { color: 'var(--text-dim)', label: 'UNK' };

          return (
            <div key={idx} style={{
              background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)',
              borderRadius: 4, padding: '14px 16px',
              transition: 'all 0.2s',
              borderLeft: `3px solid ${mimeInfo.color}33`,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.borderLeftColor = mimeInfo.color; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.borderLeftColor = `${mimeInfo.color}33`; }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem',
                      color: mimeInfo.color, background: `${mimeInfo.color}15`,
                      border: `1px solid ${mimeInfo.color}33`,
                      padding: '2px 7px', borderRadius: 2, letterSpacing: '0.08em',
                      flexShrink: 0,
                    }}>
                      {mimeInfo.label}
                    </span>
                    <File size={11} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                  </div>
                  <div style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem',
                    color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.4,
                  }} title={file.filename}>
                    {file.filename}
                  </div>
                </div>
                <button
                  title="Download"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '2px 4px', marginLeft: 8, flexShrink: 0, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                >
                  <Download size={14} />
                </button>
              </div>

              {/* MIME */}
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: 8 }}>
                {file.mime_type}
                {file.size && <span style={{ marginLeft: 8, color: 'var(--accent-cyan)' }}>{file.size}</span>}
              </div>

              {/* Hash */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 6,
                background: 'var(--bg-surface)', borderRadius: 3, padding: '8px 10px',
                border: '1px solid var(--border-subtle)',
              }}>
                <Hash size={11} color="var(--text-dim)" style={{ marginTop: 1, flexShrink: 0 }} />
                <span style={{
                  fontFamily: "'Share Tech Mono', monospace", fontSize: '0.68rem',
                  color: 'var(--text-dim)', wordBreak: 'break-all', lineHeight: 1.5,
                }}>
                  {file.md5_hash}
                </span>
              </div>

              {/* Entropy */}
              <EntropyBar entropy={file.entropy} />
            </div>
          );
        })}
      </div>
    </div>
  );
}