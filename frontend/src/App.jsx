import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';

function App() {
  const [activeFileId, setActiveFileId] = useState(null);

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-800 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              NR
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              NetRecon Forensics Workbench
            </h1>
          </div>
          {activeFileId && (
            <div className="text-sm text-gray-400">
              Active Investigation: <span className="text-primary font-mono">{activeFileId.split('-')[0]}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Dashboard activeFileId={activeFileId} setActiveFileId={setActiveFileId} />
      </main>
    </div>
  );
}

export default App;
