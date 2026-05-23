import React from 'react';
import { Cpu, ArrowRight, Clock, Activity } from 'lucide-react';

// Map protocol names to UI colors for easier scanning in the session table.
const PROTOCOL_COLOR = {
  TCP: 'var(--accent-cyan)',
  UDP: 'var(--accent-green)',
  HTTP: 'var(--accent-blue)',
  HTTPS: 'var(--accent-purple)',
  DNS: 'var(--accent-yellow)',
  NTP: 'var(--accent-orange)',
  TFTP: 'var(--accent-red)',
  SMB: 'var(--accent-orange)',
  SSH: 'var(--accent-cyan)',
  DHCP: 'var(--accent-purple)',
  SNMP: 'var(--accent-yellow)',
  UNKNOWN: 'var(--text-dim)',
};

export default function SessionTable({ sessions }) {
  // Simple fallback when no session data is available.
  if (!sessions || sessions.length === 0) {
    return (
      <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          NO NETWORK SESSIONS FOUND
        </div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: '20px 24px' }}>
      <div className="section-header">
        <div className="accent-dot" />
        <h3>Network Sessions ({sessions.length})</h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 860 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Protocol</th>
              <th>Source</th>
              <th></th>
              <th>Destination</th>
              <th>Packets</th>
              <th>Bytes</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => {
              const color = PROTOCOL_COLOR[session.protocol] || 'var(--text-dim)';
              const duration = session.session_duration != null ? `${session.session_duration.toFixed(2)}s` : '—';
              return (
                <tr key={`${session.src_ip}-${session.dst_ip}-${session.src_port}-${session.dst_port}-${index}`}>
                  <td style={{ fontFamily: "'Share Tech Mono', monospace", color: 'var(--text-dim)', fontSize: '0.78rem' }}>{index + 1}</td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontSize: '0.78rem', letterSpacing: '0.04em' }}>{session.protocol}</td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>{session.src_ip}:{session.src_port}</td>
                  <td style={{ textAlign: 'center', color: 'var(--text-dim)' }}><ArrowRight size={14} /></td>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{session.dst_ip}:{session.dst_port}</td>
                  <td>{session.packet_count}</td>
                  <td>{session.byte_count}</td>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-dim)', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.74rem' }}>
                    <Clock size={12} /> {duration}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
