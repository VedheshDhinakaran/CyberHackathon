import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, File as FileIcon } from 'lucide-react';

export default function UploadSection({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const onUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await axios.post(`http://localhost:8000/upload?filename=${encodeURIComponent(file.name)}`, file, {
        headers: { "Content-Type": "application/octet-stream" },
        onUploadProgress: (progressEvent) => {
           console.log(`Upload Progress: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
        }
      });
      if (res.data.status === "success") {
        onUploadSuccess(res.data.file_id);
      }
    } catch (e) {
      console.error(e);
      alert("Upload failed: " + (e.response?.data?.detail || e.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div 
        className={`glass-panel border-2 border-dashed p-12 flex flex-col items-center justify-center transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-700'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".pcap,.pcapng" onChange={handleChange} />
        
        {!file ? (
          <>
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drag & Drop PCAP file</h3>
            <p className="text-gray-400 mb-6">or</p>
            <button onClick={() => inputRef.current?.click()} className="px-6 py-2 bg-primary hover:bg-blue-600 rounded-lg font-medium transition-colors">
              Browse Files
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <FileIcon className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
            <p className="text-gray-400 mb-6">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <div className="flex space-x-4">
              <button onClick={() => setFile(null)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors" disabled={uploading}>
                Cancel
              </button>
              <button onClick={onUpload} className="px-6 py-2 bg-primary hover:bg-blue-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Start Analysis'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
