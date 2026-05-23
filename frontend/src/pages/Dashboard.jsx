import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadSection from '../components/UploadSection';
import TimelineVisualization from '../components/TimelineVisualization';
import SuspiciousIPTable from '../components/SuspiciousIPTable';
import FileBrowser from '../components/FileBrowser';
import IOCPanel from '../components/IOCPanel';
import NetworkFlowChart from '../components/NetworkFlowChart';
import SessionTable from '../components/SessionTable';
import SeverityBreakdown from '../components/SeverityBreakdown';
import { Activity, ShieldAlert, FileSearch, Globe, AlertTriangle, Cpu, Download, FileJson } from 'lucide-react';

// Base URL for the backend API. The dashboard fetches analysis results from this service.
const API_BASE = 'http://localhost:8000';
// ── Mock data for preview when no backend ──────────────────────────────────────
const MOCK_TIMELINE = [
  { event_type: 'port_scan', severity: 'high', timestamp: '2024-01-15T10:02:11Z', src_ip: '192.168.1.105', dst_ip: '10.0.0.1', protocol: 'TCP', description: 'Rapid SYN sweep across 1024 ports detected. Classic nmap fingerprint pattern.', evidence: 'SYN flags, no ACK response, sequential port pattern' },
  { event_type: 'exploit', severity: 'critical', timestamp: '2024-01-15T10:04:38Z', src_ip: '192.168.1.105', dst_ip: '10.0.0.22', protocol: 'TCP', description: 'SMB EternalBlue exploit attempt. MS17-010 vulnerability targeted on port 445.', evidence: 'Trans2 request with malformed size field' },
  { event_type: 'c2_beacon', severity: 'critical', timestamp: '2024-01-15T10:07:22Z', src_ip: '10.0.0.22', dst_ip: '185.220.101.47', protocol: 'HTTPS', description: 'Periodic beacon to known C2 infrastructure. 30-second interval observed over 12 minutes.', evidence: 'JA3: 77b7f45e5e7abe3cb1e21f6cfe... cipher mismatch' },
  { event_type: 'file_transfer', severity: 'high', timestamp: '2024-01-15T10:09:55Z', src_ip: '185.220.101.47', dst_ip: '10.0.0.22', protocol: 'HTTPS', description: 'Encrypted payload delivered over TLS. 4.2MB binary with high entropy (7.98 bits/byte).', evidence: 'PE header detected post-decrypt, UPX packed' },
  { event_type: 'exploit', severity: 'medium', timestamp: '2024-01-15T10:12:30Z', src_ip: '10.0.0.22', dst_ip: '10.0.0.15', protocol: 'SMB', description: 'Lateral movement via PsExec-style service creation. ADMIN$ share accessed.', evidence: 'IPC$ connection, service binary deployed' },
  { event_type: 'c2_beacon', severity: 'high', timestamp: '2024-01-15T10:18:05Z', src_ip: '10.0.0.15', dst_ip: '185.220.101.47', protocol: 'DNS', description: 'DNS tunneling activity. Suspiciously long TXT record queries to attacker domain.', evidence: 'Query length >100 chars, base64 encoded subdomains' },
];

const MOCK_FILES = [
  { filename: 'payload_x64.exe', mime_type: 'application/x-msdownload', md5_hash: 'a3f4e2d1c8b7a6e5f9d0c3b2a1e4f7d8', size: '4.2 MB', entropy: 7.98 },
  { filename: 'stage2_loader.dll', mime_type: 'application/x-sharedlib', md5_hash: 'b7c3d9e2f1a0b8c4d5e6f7a8b9c0d1e2', size: '890 KB', entropy: 7.64 },
  { filename: 'config.enc', mime_type: 'application/octet-stream', md5_hash: 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6', size: '12 KB', entropy: 7.99 },
  { filename: 'credentials.txt', mime_type: 'text/plain', md5_hash: 'd8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3', size: '2.1 KB', entropy: 3.21 },
];

const MOCK_IOCS = [
  { ioc_type: 'IPv4', value: '185.220.101.47', description: 'Known Tor exit node used as C2 relay — ThreatFox confirmed' },
  { ioc_type: 'domain', value: 'update-cdn-delivery.net', description: 'DNS tunneling C2 domain — registered 3 days before incident' },
  { ioc_type: 'md5', value: 'a3f4e2d1c8b7a6e5f9d0c3b2a1e4f7d8', description: 'payload_x64.exe — matches Cobalt Strike beacon signature' },
  { ioc_type: 'JA3', value: '77b7f45e5e7abe3cb1e21f6cfe332b8d', description: 'TLS fingerprint associated with Cobalt Strike default configuration' },
  { ioc_type: 'IPv4', value: '192.168.1.105', description: 'Initial attacker pivot — internal compromised host' },
  { ioc_type: 'CVE', value: 'CVE-2017-0144', description: 'EternalBlue — SMB RCE exploited during initial access phase' },
];

export default function Dashboard({ activeFileId, setActiveFileId }) {
  const [status, setStatus] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [files, setFiles] = useState([]);
  const [iocs, setIocs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [useMock, setUseMock] = useState(false);

  // Poll backend analysis status every two seconds while a file is processing.
  // Once processing completes, load all related dashboard data.
  useEffect(() => {
    if (!activeFileId) return;
    const pollStatus = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/analysis/${activeFileId}`);
        setStatus(res.data);
        const bar = document.getElementById('header-progress-fill');
        if (bar) bar.style.width = `${res.data.progress || 0}%`;
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          clearInterval(pollStatus);
          fetchData();
        }
      } catch { clearInterval(pollStatus); }
    }, 2000);
    return () => clearInterval(pollStatus);
  }, [activeFileId]);

  // Fetch all analysis payloads from the backend once processing is complete.
  // Fetch the completed analysis payloads for the selected file.
  // This includes the event timeline, extracted files, IOCs, and reconstructed sessions.
  const fetchData = async () => {
    try {
      const [tlRes, filesRes, iocsRes, sessionsRes] = await Promise.all([
        axios.get(`${API_BASE}/timeline/${activeFileId}`),
        axios.get(`${API_BASE}/files/${activeFileId}`),
        axios.get(`${API_BASE}/iocs/${activeFileId}`),
        axios.get(`${API_BASE}/sessions/${activeFileId}`),
      ]);
      setTimeline(tlRes.data);
      setFiles(filesRes.data);
      setIocs(iocsRes.data);
      setSessions(sessionsRes.data);
    } catch (error) {
      console.error('Failed fetching dashboard data', error);
    }
  };

  // Preview mode with mock data
  const showDemo = () => {
    setUseMock(true);
    setStatus({ status: 'completed', filename: 'apt_attack_sample.pcap', progress: 100 });
    setTimeline(MOCK_TIMELINE);
    setFiles(MOCK_FILES);
    setIocs(MOCK_IOCS);
    setActiveFileId('demo-session-preview');
  };

  const isReady = status?.status === 'completed';
  const data = { timeline, files, iocs };

  const criticalCount = timeline.filter(t => t.severity === 'critical').length;
  const highCount = timeline.filter(t => t.severity === 'high').length;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'network', label: 'Network Flow' },
    { id: 'sessions', label: `Sessions (${sessions.length})` },
    { id: 'files', label: `Files (${files.length})` },
    { id: 'iocs', label: `IOCs (${iocs.length})` },
  ];

  if (!activeFileId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 40 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', maxWidth: 600 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.25em', color: 'var(--accent-cyan)', marginBottom: 16, opacity: 0.7 }}>
            // NETWORK PACKET ANALYSIS SUITE
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
            Begin Forensic<br />
            <span style={{ color: 'var(--accent-cyan)' }} className="glow-cyan">Investigation</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7, margin: '0 0 32px', fontWeight: 400 }}>
            Upload a PCAP or PCAPNG capture file to automatically extract TCP streams, reconstruct transferred files, detect attacker TTPs and generate an attack timeline.
          </p>
        </div>

        <UploadSection onUploadSuccess={(id) => setActiveFileId(id)} />

        <button onClick={showDemo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.1em', textDecoration: 'underline', marginTop: -20 }}>
          or load demo data
        </button>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 800, width: '100%', marginTop: 20 }}>
          {[
            { icon: '⟳', title: 'TCP Reassembly', desc: 'Full bidirectional stream reconstruction with statistics' },
            { icon: '⬡', title: 'File Carving', desc: 'Extract HTTP, SMB, and TFTP objects with entropy analysis' },
            { icon: '◈', title: 'Attack Detection', desc: 'Port scans, exploit attempts, C2 beaconing' },
            { icon: '⋯', title: 'Timeline Builder', desc: 'Chronological attack reconstruction with severity scoring' },
            { icon: '◎', title: 'Zeek Integration', desc: 'Protocol logs: conn, http, dns, notice' },
            { icon: '↗', title: 'IOC Export', desc: 'IPs, domains, hashes, JA3, CVEs in one click' },
          ].map(f => (
            <div key={f.title} className="panel" style={{ padding: '18px 20px' }}>
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1.2rem', color: 'var(--accent-cyan)', marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5, fontWeight: 400 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Status Bar */}
      <div className="panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Activity size={15} color={status?.status === 'processing' ? 'var(--accent-orange)' : 'var(--accent-green)'}
            style={{ animation: status?.status === 'processing' ? 'pulse-cyan 1s infinite' : 'none' }} />
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {status?.filename || 'Processing...'}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
              Status: <span style={{ color: status?.status === 'completed' ? 'var(--accent-green)' : status?.status === 'processing' ? 'var(--accent-orange)' : 'var(--accent-cyan)' }}>
                {status?.status || 'initializing'}
              </span>
            </div>
          </div>
        </div>

        {isReady && (
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`${API_BASE}/report/${activeFileId}/pdf`} download className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.7rem', padding: '6px 14px' }}>
              <Download size={12} /> PDF Report
            </a>
            <a href={`${API_BASE}/report/${activeFileId}/json`} download className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.7rem', padding: '6px 14px' }}>
              <FileJson size={12} /> JSON Export
            </a>
          </div>
        )}

        <div style={{ width: 200 }}>
          <div className="progress-track">
            <div className={`progress-fill ${isReady ? 'complete' : ''}`} style={{ width: `${status?.progress || 0}%` }} />
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: 4, textAlign: 'right' }}>
            {status?.progress || 0}% complete
          </div>
        </div>
      </div>

      {isReady && (
        <>
          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { label: 'Critical Alerts', value: criticalCount, icon: ShieldAlert, accent: 'var(--accent-red)', bg: 'rgba(255,59,92,0.08)' },
              { label: 'High Severity', value: highCount, icon: AlertTriangle, accent: 'var(--accent-orange)', bg: 'rgba(255,140,66,0.08)' },
              { label: 'Files Extracted', value: files.length, icon: FileSearch, accent: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.08)' },
              { label: 'IOCs Detected', value: iocs.length, icon: Globe, accent: 'var(--accent-purple)', bg: 'rgba(124,92,252,0.08)' },
              { label: 'Timeline Events', value: timeline.length, icon: Activity, accent: 'var(--accent-green)', bg: 'rgba(0,255,136,0.08)' },
              { label: 'Network Sessions', value: sessions.length, icon: Cpu, accent: 'var(--accent-yellow)', bg: 'rgba(255,217,61,0.08)' },
              { label: 'Unique Sources', value: [...new Set(timeline.map(t => t.src_ip))].length, icon: Cpu, accent: 'var(--accent-yellow)', bg: 'rgba(255,217,61,0.08)' },
              { label: 'Protocols', value: [...new Set(sessions.map(s => s.protocol))].length, icon: Globe, accent: 'var(--accent-purple)', bg: 'rgba(124,92,252,0.06)' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ '--card-accent': s.accent }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: s.accent, lineHeight: 1, fontFamily: "'IBM Plex Mono', monospace" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginTop: 6, textTransform: 'uppercase', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {s.label}
                    </div>
                  </div>
                  <div style={{ padding: 8, background: s.bg, borderRadius: 4 }}>
                    <s.icon size={16} color={s.accent} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: activeTab === tab.id ? 'rgba(0,212,255,0.08)' : 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-dim)',
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                transition: 'all 0.2s',
                borderRadius: '4px 4px 0 0',
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="animate-slide-in" key={activeTab}>
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <SeverityBreakdown events={timeline} />
                  <SuspiciousIPTable events={timeline} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <IOCPanel iocs={iocs} />
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <TimelineVisualization events={timeline} />
            )}

            {activeTab === 'network' && (
              <NetworkFlowChart sessions={sessions} />
            )}

            {activeTab === 'sessions' && (
              <SessionTable sessions={sessions} />
            )}

            {activeTab === 'files' && (
              <FileBrowser files={files} />
            )}

            {activeTab === 'iocs' && (
              <IOCPanel iocs={iocs} expanded />
            )}
          </div>
        </>
      )}

      {status?.status === 'processing' && (
        <div className="panel" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '1rem', color: 'var(--accent-cyan)', marginBottom: 16 }}>
            ANALYZING PACKET CAPTURE<span className="animate-blink">_</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360, margin: '0 auto' }}>
            {['Parsing PCAP headers', 'Reassembling TCP streams', 'Extracting file objects', 'Running detection modules', 'Building attack timeline'].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: (status?.progress || 0) > i * 20 ? 'var(--accent-green)' : 'var(--text-dim)' }} />
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: (status?.progress || 0) > i * 20 ? 'var(--text-secondary)' : 'var(--text-dim)' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}