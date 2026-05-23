import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UploadSection from '../components/UploadSection';
import TimelineVisualization from '../components/TimelineVisualization';
import SuspiciousIPTable from '../components/SuspiciousIPTable';
import FileBrowser from '../components/FileBrowser';
import IOCPanel from '../components/IOCPanel';
import { Activity, ShieldAlert, FileSearch, Globe } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function Dashboard({ activeFileId, setActiveFileId }) {
  const [status, setStatus] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [files, setFiles] = useState([]);
  const [iocs, setIocs] = useState([]);

  useEffect(() => {
    if (!activeFileId) return;

    const pollStatus = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/analysis/${activeFileId}`);
        setStatus(res.data);
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          clearInterval(pollStatus);
          fetchData();
        }
      } catch (e) {
        console.error('Error polling status', e);
      }
    }, 2000);

    return () => clearInterval(pollStatus);
  }, [activeFileId]);

  const fetchData = async () => {
    try {
      const [tlRes, filesRes, iocsRes] = await Promise.all([
        axios.get(`${API_BASE}/timeline/${activeFileId}`),
        axios.get(`${API_BASE}/files/${activeFileId}`),
        axios.get(`${API_BASE}/iocs/${activeFileId}`)
      ]);
      setTimeline(tlRes.data);
      setFiles(filesRes.data);
      setIocs(iocsRes.data);
    } catch (e) {
      console.error('Error fetching data', e);
    }
  };

  if (!activeFileId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8">
        <div className="text-center space-y-4 max-w-2xl">
          <h2 className="text-4xl font-bold">Start Investigation</h2>
          <p className="text-gray-400 text-lg">
            Upload a PCAP or PCAPNG file to automatically extract streams, reconstruct files, and detect attacker activity.
          </p>
        </div>
        <UploadSection onUploadSuccess={(id) => setActiveFileId(id)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Activity className={`w-6 h-6 ${status?.status === 'processing' ? 'text-warning animate-pulse' : 'text-success'}`} />
          <div>
            <div className="font-semibold">{status?.filename || 'Analyzing...'}</div>
            <div className="text-sm text-gray-400 capitalize">Status: {status?.status || 'starting'}</div>
          </div>
        </div>

        {status?.status === 'completed' && (
          <div className="flex space-x-3 mr-4">
            <a href={`${API_BASE}/report/${activeFileId}/pdf`} download className="px-4 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 rounded shadow transition-all text-sm font-semibold flex items-center">
              Download PDF
            </a>
            <a href={`${API_BASE}/report/${activeFileId}/json`} download className="px-4 py-1.5 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded shadow transition-all text-sm font-semibold flex items-center">
              Download JSON
            </a>
          </div>
        )}

        <div className="w-1/3">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${status?.progress || 0}%` }}
            />
          </div>
        </div>
      </div>

      {status?.status === 'completed' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card flex items-center space-x-4">
              <div className="p-3 bg-danger/20 text-danger rounded-lg"><ShieldAlert /></div>
              <div>
                <div className="text-2xl font-bold">{timeline.filter(t => t.severity === 'high' || t.severity === 'critical').length}</div>
                <div className="text-sm text-gray-400">Critical Alerts</div>
              </div>
            </div>
            <div className="card flex items-center space-x-4">
              <div className="p-3 bg-primary/20 text-primary rounded-lg"><FileSearch /></div>
              <div>
                <div className="text-2xl font-bold">{files.length}</div>
                <div className="text-sm text-gray-400">Files Extracted</div>
              </div>
            </div>
            <div className="card flex items-center space-x-4">
              <div className="p-3 bg-warning/20 text-warning rounded-lg"><Globe /></div>
              <div>
                <div className="text-2xl font-bold">{iocs.length}</div>
                <div className="text-sm text-gray-400">IOCs Detected</div>
              </div>
            </div>
            <div className="card flex items-center space-x-4">
              <div className="p-3 bg-success/20 text-success rounded-lg"><Activity /></div>
              <div>
                <div className="text-2xl font-bold">{timeline.length}</div>
                <div className="text-sm text-gray-400">Timeline Events</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <TimelineVisualization events={timeline} />
              <FileBrowser files={files} />
            </div>
            <div className="space-y-6">
              <SuspiciousIPTable events={timeline} />
              <IOCPanel iocs={iocs} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
