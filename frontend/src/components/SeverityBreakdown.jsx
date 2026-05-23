import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

export default function SeverityBreakdown({ events }) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  const byType = {};

  events.forEach(e => {
    counts[e.severity] = (counts[e.severity] || 0) + 1;
    byType[e.event_type] = (byType[e.event_type] || 0) + 1;
  });

  const radarData = Object.entries(byType).map(([type, count]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    count,
    fullMark: Math.max(...Object.values(byType)) + 1,
  }));

  const total = events.length || 1;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-glow)', borderRadius: 4, padding: '8px 12px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>
          {payload[0]?.payload?.type}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: 2 }}>
          {payload[0]?.value} events
        </div>
      </div>
    );
  };

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      <div className="section-header">
        <div className="accent-dot" />
        <h3>Threat Analysis</h3>
      </div>

      {/* Severity bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'CRITICAL', count: counts.critical, color: 'var(--accent-red)', bg: 'rgba(255,59,92,0.15)' },
          { label: 'HIGH', count: counts.high, color: 'var(--accent-orange)', bg: 'rgba(255,140,66,0.12)' },
          { label: 'MEDIUM', count: counts.medium, color: 'var(--accent-yellow)', bg: 'rgba(255,217,61,0.1)' },
          { label: 'LOW', count: counts.low || 0, color: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.08)' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: s.color, letterSpacing: '0.1em' }}>{s.label}</span>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {s.count} <span style={{ color: 'var(--text-dim)', fontSize: '0.65rem' }}>({((s.count / total) * 100).toFixed(0)}%)</span>
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--bg-deep)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div style={{
                height: '100%', width: `${(s.count / total) * 100}%`,
                background: s.color, borderRadius: 2,
                boxShadow: `0 0 8px ${s.color}66`,
                transition: 'width 0.8s ease',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Radar chart for event types */}
      {radarData.length > 1 && (
        <>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
            Attack Pattern Radar
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,212,255,0.1)" />
              <PolarAngleAxis dataKey="type"
                tick={{ fill: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }} />
              <Radar name="Events" dataKey="count" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.15} strokeWidth={1.5} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}