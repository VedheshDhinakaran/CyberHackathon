import React, { useState } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Download, Activity, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';

// Severity colors and visual styling for timeline markers and tooltips.
const SEVERITY_CONFIG = {
  critical: { color: 'var(--accent-red)', bg: 'rgba(255,59,92,0.12)', border: 'rgba(255,59,92,0.35)', hex: '#ff3b5c' },
  high:     { color: 'var(--accent-orange)', bg: 'rgba(255,140,66,0.1)', border: 'rgba(255,140,66,0.3)', hex: '#ff8c42' },
  medium:   { color: 'var(--accent-yellow)', bg: 'rgba(255,217,61,0.08)', border: 'rgba(255,217,61,0.25)', hex: '#ffd93d' },
  low:      { color: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.07)', border: 'rgba(0,212,255,0.2)', hex: '#00d4ff' },
};

const TYPE_ICONS = {
  port_scan:     { icon: Activity, label: 'PORT SCAN' },
  exploit:       { icon: AlertTriangle, label: 'EXPLOIT' },
  c2_beacon:     { icon: Terminal, label: 'C2 BEACON' },
  file_transfer: { icon: Download, label: 'FILE XFER' },
};

// Custom tooltip for timeline scatter points. Shows event metadata on hover.
const CustomTooltip = ({ active, payload }) => {
  // Tooltip content for the scatter chart. Shows a concise event preview on hover.
  if (!active || !payload?.length) return null;
  const ev = payload[0].payload.event;
  const cfg = SEVERITY_CONFIG[ev.severity] || SEVERITY_CONFIG.low;
  return (
    <div style={{
      background: 'var(--bg-raised)', border: `1px solid ${cfg.border}`,
      borderRadius: 4, padding: '12px 16px', maxWidth: 260,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${cfg.bg}`,
    }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.1em', color: cfg.color, marginBottom: 6 }}>
        {TYPE_ICONS[ev.event_type]?.label || ev.event_type.toUpperCase()}
      </div>
      <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
        {ev.timestamp ? format(new Date(ev.timestamp), 'HH:mm:ss.SSS') : '—'}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: 'var(--text-dim)' }}>
        {ev.src_ip} → {ev.dst_ip}
      </div>
      {ev.protocol && (
        <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: cfg.color }}>
          {ev.protocol}
        </div>
      )}
    </div>
  );
};

function TimelineChart({ events }) {
  const chartData = events.map(e => {
    const ts = e.timestamp ? new Date(e.timestamp).getTime() : 0;
    const cfg = SEVERITY_CONFIG[e.severity] || SEVERITY_CONFIG.low;
    const typeOrder = { port_scan: 1, exploit: 2, c2_beacon: 3, file_transfer: 4 };
    return {
      x: ts,
      y: typeOrder[e.event_type] || 2,
      z: e.severity === 'critical' ? 5 : e.severity === 'high' ? 4 : e.severity === 'medium' ? 3 : 2,
      fill: cfg.hex,
      event: e,
    };
  }).filter(d => d.x !== 0);

  if (!chartData.length) return null;

  const typeLabels = { 1: 'PORT SCAN', 2: 'EXPLOIT', 3: 'C2 BEACON', 4: 'FILE XFER' };

  return (
    <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '20px 16px 8px', marginBottom: 24 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: 'var(--text-dim)', marginBottom: 16, textTransform: 'uppercase' }}>
        ⬡ Visual Attack Scatter — Time vs Event Type
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" />
          <XAxis
            type="number" dataKey="x" domain={['auto', 'auto']}
            tickFormatter={v => format(new Date(v), 'HH:mm:ss')}
            stroke="var(--text-dim)" tick={{ fill: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
            tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }}
          />
          <YAxis
            type="number" dataKey="y" domain={[0.5, 4.5]}
            tickFormatter={v => typeLabels[Math.round(v)] || ''}
            stroke="var(--text-dim)" tick={{ fill: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
            tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }} width={72}
            ticks={[1, 2, 3, 4]}
          />
          <ZAxis type="number" dataKey="z" range={[60, 280]} />
          <Tooltip cursor={{ stroke: 'rgba(0,212,255,0.15)', strokeDasharray: '4 4' }} content={<CustomTooltip />} />
          {[1,2,3,4].map(y => (
            <ReferenceLine key={y} y={y} stroke="rgba(0,212,255,0.04)" strokeDasharray="none" />
          ))}
          <Scatter data={chartData}>
            {chartData.map((entry, index) => (
              <cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function EventRow({ event, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.low;
  const TypeInfo = TYPE_ICONS[event.event_type] || { icon: Activity, label: event.event_type?.toUpperCase() };
  const Icon = TypeInfo.icon;

  return (
    <div style={{ position: 'relative' }}>
      {/* Timeline dot */}
      <div style={{
        position: 'absolute', left: -20, top: 16,
        width: 10, height: 10, borderRadius: '50%',
        background: cfg.hex, border: `2px solid ${cfg.hex}`,
        boxShadow: `0 0 10px ${cfg.hex}55`,
      }} />

      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: expanded ? 'var(--bg-raised)' : 'var(--bg-panel)',
          border: `1px solid ${expanded ? cfg.border : 'var(--border-subtle)'}`,
          borderLeft: `3px solid ${cfg.hex}`,
          borderRadius: 4, marginBottom: 8, padding: '14px 18px',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
        className="timeline-event"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Severity badge */}
            <span className={`badge-${event.severity}`} style={{ padding: '3px 8px', borderRadius: 2, fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {event.severity}
            </span>
            {/* Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={13} color={cfg.color} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: cfg.color, letterSpacing: '0.05em' }}>
                {TypeInfo.label}
              </span>
            </div>
            {/* Protocol chip */}
            {event.protocol && (
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', color: 'var(--text-dim)', background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 2 }}>
                {event.protocol}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {event.timestamp ? format(new Date(event.timestamp), 'HH:mm:ss') : '—'}
            </span>
            {expanded ? <ChevronUp size={13} color="var(--text-dim)" /> : <ChevronDown size={13} color="var(--text-dim)" />}
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {event.description}
        </div>

        {expanded && (
          <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Flow row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-dim)', background: 'var(--bg-deep)', padding: '4px 10px', borderRadius: 3, border: '1px solid var(--border-subtle)' }}>
                {event.src_ip}
              </span>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>⟶</span>
              <span style={{ color: 'var(--text-dim)', background: 'var(--bg-deep)', padding: '4px 10px', borderRadius: 3, border: '1px solid var(--border-subtle)' }}>
                {event.dst_ip}
              </span>
              {event.protocol && (
                <>
                  <span style={{ color: 'var(--text-dim)' }}>via</span>
                  <span style={{ color: cfg.color }}>{event.protocol}</span>
                </>
              )}
            </div>

            {/* Evidence */}
            {event.evidence && (
              <div className="hexdump" style={{ color: 'var(--accent-green)' }}>
                <span style={{ color: 'var(--text-dim)' }}>EVIDENCE  </span>{event.evidence}
              </div>
            )}

            {/* Timestamp full */}
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              TIMESTAMP: {event.timestamp ? format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS') : '—'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimelineVisualization({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="panel" style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem' }}>
        NO TIMELINE EVENTS FOUND
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <TimelineChart events={sorted} />

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(SEVERITY_CONFIG).map(([sev, cfg]) => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.hex, boxShadow: `0 0 6px ${cfg.hex}` }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {sev}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--text-dim)' }}>
          {sorted.length} events · click to expand
        </div>
      </div>

      {/* Chronological list */}
      <div className="timeline-track" style={{ paddingLeft: 28 }}>
        {sorted.map((event, idx) => (
          <EventRow key={idx} event={event} index={idx} />
        ))}
      </div>
    </div>
  );
}