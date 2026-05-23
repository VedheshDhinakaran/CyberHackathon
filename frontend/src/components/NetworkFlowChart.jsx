import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = ['#00d4ff', '#ff3b5c', '#ff8c42', '#7c5cfc', '#00ff88', '#ffd93d'];

export default function NetworkFlowChart({ events }) {
  const { protocolData, ipPairs, hourlyData } = useMemo(() => {
    const protos = {};
    const pairs = {};
    const hours = {};

    events.forEach(e => {
      // Protocol breakdown
      const p = e.protocol || 'UNKNOWN';
      protos[p] = (protos[p] || 0) + 1;

      // IP pair flows
      const pair = `${e.src_ip} → ${e.dst_ip}`;
      if (!pairs[pair]) pairs[pair] = { pair, src: e.src_ip, dst: e.dst_ip, count: 0, critical: 0 };
      pairs[pair].count += 1;
      if (e.severity === 'critical' || e.severity === 'high') pairs[pair].critical += 1;

      // Hourly distribution
      if (e.timestamp) {
        const h = new Date(e.timestamp).getUTCHours();
        const key = `${String(h).padStart(2,'0')}:00`;
        hours[key] = (hours[key] || 0) + 1;
      }
    });

    return {
      protocolData: Object.entries(protos).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      ipPairs: Object.values(pairs).sort((a,b) => b.critical - a.critical || b.count - a.count).slice(0, 8),
      hourlyData: Object.entries(hours).map(([h, v]) => ({ hour: h, events: v })).sort((a,b) => a.hour.localeCompare(b.hour)),
    };
  }, [events]);

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-glow)', borderRadius: 4, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'var(--accent-cyan)', marginBottom: 4 }}>{label}</div>
        {payload.map(p => (
          <div key={p.dataKey} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            {p.value} events
          </div>
        ))}
      </div>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-glow)', borderRadius: 4, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: payload[0].payload.fill, marginBottom: 2 }}>
          {payload[0].name}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {payload[0].value} packets ({((payload[0].value / events.length) * 100).toFixed(1)}%)
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title }) => (
    <div className="section-header">
      <div className="accent-dot" />
      <h3>{title}</h3>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Protocol Pie */}
      <div className="panel" style={{ padding: '20px 24px' }}>
        <SectionHeader title="Protocol Distribution" />
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={protocolData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
              dataKey="value" nameKey="name" paddingAngle={3}
              stroke="none">
              {protocolData.map((_, i) => <cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend
              formatter={(v) => <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{v}</span>}
              iconSize={8}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Hourly activity */}
      <div className="panel" style={{ padding: '20px 24px' }}>
        <SectionHeader title="Activity Over Time (UTC Hour)" />
        {hourlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--text-dim)"
                tick={{ fill: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
                tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }} />
              <YAxis stroke="var(--text-dim)"
                tick={{ fill: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
                tickLine={false} axisLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
              <Bar dataKey="events" fill="var(--accent-cyan)" opacity={0.8} radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}>
            NO TIMESTAMP DATA
          </div>
        )}
      </div>

      {/* IP Flow Matrix */}
      <div className="panel" style={{ padding: '20px 24px', gridColumn: '1 / -1' }}>
        <SectionHeader title="Top Network Flows" />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Source IP</th>
                <th>→</th>
                <th>Destination IP</th>
                <th>Total Events</th>
                <th>Critical/High</th>
                <th>Threat Level</th>
              </tr>
            </thead>
            <tbody>
              {ipPairs.map((row, i) => {
                const threat = row.critical >= 3 ? 'CRITICAL' : row.critical >= 1 ? 'HIGH' : 'MEDIUM';
                const threatColor = { CRITICAL: 'var(--accent-red)', HIGH: 'var(--accent-orange)', MEDIUM: 'var(--accent-yellow)' }[threat];
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', fontSize: '0.75rem' }}>{String(i+1).padStart(2,'0')}</td>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>{row.src}</td>
                    <td style={{ color: 'var(--text-dim)', textAlign: 'center', fontSize: '0.9rem' }}>⟶</td>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{row.dst}</td>
                    <td style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem' }}>{row.count}</td>
                    <td>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: row.critical > 0 ? 'var(--accent-red)' : 'var(--text-dim)', fontWeight: row.critical > 0 ? 700 : 400 }}>
                        {row.critical}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-${threat.toLowerCase()}`} style={{ padding: '3px 9px', borderRadius: 2, fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.08em' }}>
                        {threat}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}