import React from 'react';

// SuspiciousIPTable aggregates event sources and ranks them by risk.
// It is used to highlight potentially compromised or attacker-controlled hosts.

// SuspiciousIPTable aggregates source IP addresses and highlights the riskiest hosts.
export default function SuspiciousIPTable({ events }) {
  const ips = {};
  events.forEach(e => {
    if (!ips[e.src_ip]) ips[e.src_ip] = { ip: e.src_ip, events: 0, critical: 0, high: 0, types: new Set() };
    ips[e.src_ip].events += 1;
    if (e.severity === 'critical') ips[e.src_ip].critical += 1;
    if (e.severity === 'high') ips[e.src_ip].high += 1;
    ips[e.src_ip].types.add(e.event_type);
  });

  const sorted = Object.values(ips)
    .sort((a, b) => b.critical - a.critical || b.high - a.high || b.events - a.events)
    .slice(0, 6);

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      <div className="section-header">
        <div className="accent-dot" />
        <h3>Top Suspicious Sources</h3>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}>
          NO DATA
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((ip, i) => {
            const riskScore = Math.min(100, ip.critical * 25 + ip.high * 10 + ip.events * 2);
            const riskColor = riskScore >= 70 ? 'var(--accent-red)' : riskScore >= 40 ? 'var(--accent-orange)' : 'var(--accent-yellow)';

            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr auto',
                gap: 12, alignItems: 'center',
                background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)',
                borderRadius: 3, padding: '10px 14px',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-glow)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                {/* Rank */}
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>

                {/* IP + details */}
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--accent-cyan)', marginBottom: 4 }}>
                    {ip.ip}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[...ip.types].map(t => (
                      <span key={t} style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem',
                        color: 'var(--text-dim)', background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        padding: '1px 7px', borderRadius: 2, letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        {t.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risk meter */}
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: riskColor, marginBottom: 5 }}>
                    RISK {riskScore}
                  </div>
                  <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${riskScore}%`, background: riskColor, borderRadius: 2, boxShadow: `0 0 6px ${riskColor}` }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 5, justifyContent: 'flex-end' }}>
                    {ip.critical > 0 && (
                      <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--accent-red)' }}>
                        {ip.critical} CRIT
                      </span>
                    )}
                    <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      {ip.events} EVT
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}