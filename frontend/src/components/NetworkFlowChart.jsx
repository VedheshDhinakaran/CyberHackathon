import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend, Cell } from 'recharts';

const COLORS = ['#00d4ff', '#ff3b5c', '#ff8c42', '#7c5cfc', '#00ff88', '#ffd93d', '#a855f7', '#f59e0b'];

export default function NetworkFlowChart({ sessions = [] }) {
  const { protocolData, flowData, hourlyData } = useMemo(() => {
    const protos = {};
    const pairs = {};
    const hours = {};

    sessions.forEach((session) => {
      const protocol = session.protocol || 'UNKNOWN';
      protos[protocol] = (protos[protocol] || 0) + 1;

      const pairKey = `${session.src_ip}:${session.src_port} → ${session.dst_ip}:${session.dst_port}`;
      if (!pairs[pairKey]) {
        pairs[pairKey] = {
          pair: pairKey,
          protocol,
          src: session.src_ip,
          dst: session.dst_ip,
          count: 0,
          bytes: 0,
        };
      }
      pairs[pairKey].count += 1;
      pairs[pairKey].bytes += session.byte_count || 0;

      if (session.start_time) {
        const hour = new Date(session.start_time).getUTCHours();
        const key = `${String(hour).padStart(2, '0')}:00`;
        hours[key] = (hours[key] || 0) + 1;
      }
    });

    return {
      protocolData: Object.entries(protos)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      flowData: Object.values(pairs)
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 10),
      hourlyData: Object.entries(hours)
        .map(([h, v]) => ({ hour: h, sessions: v }))
        .sort((a, b) => a.hour.localeCompare(b.hour)),
    };
  }, [sessions]);

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-glow)', borderRadius: 4, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'var(--accent-cyan)', marginBottom: 4 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.8rem', color: 'var(--text-primary)' }}>
            {p.value} sessions
          </div>
        ))}
      </div>
    );
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-glow)', borderRadius: 4, padding: '10px 14px' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'var(--accent-cyan)', marginBottom: 2 }}>
          {payload[0].name}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          {payload[0].value} sessions ({((payload[0].value / (sessions.length || 1)) * 100).toFixed(1)}%)
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
      <div className="panel" style={{ padding: '20px 24px' }}>
        <SectionHeader title="Protocol Distribution" />
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={protocolData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              nameKey="name"
              paddingAngle={3}
              stroke="none"
            >
              {protocolData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend
              formatter={(v) => (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{v}</span>
              )}
              iconSize={8}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="panel" style={{ padding: '20px 24px' }}>
        <SectionHeader title="Sessions Over Time (UTC Hour)" />
        {hourlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourlyData} margin={{ top: 5, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.06)" vertical={false} />
              <XAxis
                dataKey="hour"
                stroke="var(--text-dim)"
                tick={{ fill: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-subtle)' }}
              />
              <YAxis
                stroke="var(--text-dim)"
                tick={{ fill: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
              <Bar dataKey="sessions" fill="var(--accent-cyan)" opacity={0.8} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}>
            NO SESSION TIMESTAMPS
          </div>
        )}
      </div>

      <div className="panel" style={{ padding: '20px 24px', gridColumn: '1 / -1' }}>
        <SectionHeader title="Top Session Flows" />
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Flow</th>
                <th>Protocol</th>
                <th>Packets</th>
                <th>Bytes</th>
              </tr>
            </thead>
            <tbody>
              {flowData.map((row, i) => (
                <tr key={`${row.pair}-${i}`}>
                  <td style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', fontSize: '0.75rem' }}>{String(i + 1).padStart(2, '0')}</td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent-cyan)', minWidth: 320 }}>{row.pair}</td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-secondary)' }}>{row.protocol}</td>
                  <td style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)' }}>{row.count}</td>
                  <td style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-primary)' }}>{row.bytes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
