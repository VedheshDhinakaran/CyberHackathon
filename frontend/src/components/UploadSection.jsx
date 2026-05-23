import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, File as FileIcon, CheckCircle } from 'lucide-react';

export default function UploadSection({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true); setUploadProgress(0);
    try {
      const res = await axios.post(
        `http://localhost:8000/upload?filename=${encodeURIComponent(file.name)}`,
        file,
        {
          headers: { 'Content-Type': 'application/octet-stream' },
          onUploadProgress: (e) => setUploadProgress(Math.round((e.loaded * 100) / e.total)),
        }
      );
      if (res.data.status === 'success') onUploadSuccess(res.data.file_id);
    } catch (e) {
      alert('Upload failed: ' + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  const fmt = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <input ref={inputRef} type="file" accept=".pcap,.pcapng" style={{ display: 'none' }} onChange={handleChange} />

      <div
        className={`upload-zone ${dragActive ? 'active-drag' : ''}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag}
        onDragOver={handleDrag} onDrop={handleDrop}
        style={{ padding: '48px 32px', textAlign: 'center' }}
      >
        {!file ? (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', transition: 'all 0.3s',
            }}>
              <UploadCloud size={30} color="var(--accent-cyan)" style={{ opacity: dragActive ? 1 : 0.6 }} />
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
              Drop PCAP / PCAPNG here
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 24, fontWeight: 400 }}>
              or click to browse your filesystem
            </div>
            <button onClick={() => inputRef.current?.click()} className="btn-primary" style={{ fontSize: '0.78rem' }}>
              Browse Files
            </button>
          </>
        ) : (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <FileIcon size={26} color="var(--accent-green)" />
            </div>

            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 4 }}>
              {file.name}
            </div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 20 }}>
              {fmt(file.size)}
            </div>

            {uploading && (
              <div style={{ marginBottom: 20 }}>
                <div className="progress-track" style={{ marginBottom: 6 }}>
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                  Uploading... {uploadProgress}%
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {!uploading && (
                <button onClick={() => setFile(null)} style={{
                  background: 'none', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-dim)', padding: '8px 20px', borderRadius: 3,
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}>
                  Cancel
                </button>
              )}
              <button
                onClick={onUpload}
                disabled={uploading}
                className="btn-primary"
                style={{ opacity: uploading ? 0.6 : 1, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {uploading ? (
                  <span>Uploading...</span>
                ) : (
                  <><CheckCircle size={13} /> Start Analysis</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}