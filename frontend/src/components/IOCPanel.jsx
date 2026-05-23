import React from 'react';
import { Target, Copy } from 'lucide-react';

export default function IOCPanel({ iocs }) {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="card max-h-[500px] flex flex-col">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Target className="mr-2 text-warning" /> Indicators of Compromise
      </h3>

      {(!iocs || iocs.length === 0) ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          No IOCs detected.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {iocs.map((ioc, idx) => (
            <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 group">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase text-primary tracking-wider">{ioc.ioc_type}</span>
                <button
                  onClick={() => handleCopy(ioc.value)}
                  className="text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div className="font-mono text-sm break-all text-gray-200">{ioc.value}</div>
              {ioc.description && (
                <div className="text-xs text-gray-500 mt-2">{ioc.description}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
