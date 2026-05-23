import React from 'react';
import { File, Download, Hash } from 'lucide-react';

export default function FileBrowser({ files }) {
  if (!files || files.length === 0) {
    return (
      <div className="card h-48 flex items-center justify-center text-gray-500">
        No files were extracted from this PCAP.
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <File className="mr-2 text-primary" /> Extracted Files
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file, idx) => (
          <div key={idx} className="glass-panel p-4 flex flex-col justify-between group">
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold text-sm truncate max-w-[80%]" title={file.filename}>
                {file.filename}
              </div>
              <button className="text-gray-500 hover:text-primary transition-colors" title="Download placeholder">
                <Download className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-400 mb-2">{file.mime_type}</div>
            <div className="bg-gray-900/50 p-2 rounded text-xs font-mono break-all flex items-start space-x-2">
              <Hash className="w-3 h-3 mt-0.5 text-gray-500 flex-shrink-0" />
              <span className="text-gray-400">{file.md5_hash}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
