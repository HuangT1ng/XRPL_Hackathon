import React, { useState, useEffect } from 'react';
import { debugLogger } from '@/lib/logger';

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    // Load logs initially
    setLogs(debugLogger.getAllLogs());
    
    // Auto-refresh logs every 2 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        setLogs(debugLogger.getAllLogs());
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const refreshLogs = () => {
    setLogs(debugLogger.getAllLogs());
  };

  const clearLogs = () => {
    debugLogger.clearLogs();
    setLogs([]);
  };

  const downloadLogs = () => {
    debugLogger.downloadLogs();
  };

  const printToConsole = () => {
    debugLogger.printRecentLogs();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">CrowdLift Debug Console</h1>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={refreshLogs}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh Logs
          </button>
          
          <button
            onClick={downloadLogs}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            📥 Download Logs
          </button>
          
          <button
            onClick={printToConsole}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            🖥️ Print to Console
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            🗑️ Clear Logs
          </button>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Auto-refresh (2s)</span>
          </label>
        </div>
        
        {/* Stats */}
        <div className="text-sm text-gray-600">
          Total logs: {logs.length} | 
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Logs Display */}
      <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-auto max-h-96">
        <div className="mb-2 border-b border-gray-700 pb-2">
          <strong>Debug Logs ({logs.length} entries)</strong>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-gray-500 italic">No logs available. Try performing some actions in the app.</div>
        ) : (
          <div className="space-y-1">
            {logs.slice(-50).map((log, index) => {
              const isError = log.includes('[ERROR]');
              const isWarning = log.includes('[WARN]');
              const isInfo = log.includes('[INFO]');
              const isDebug = log.includes('[DEBUG]');
              
              let colorClass = 'text-green-400';
              if (isError) colorClass = 'text-red-400';
              else if (isWarning) colorClass = 'text-yellow-400';
              else if (isInfo) colorClass = 'text-blue-400';
              else if (isDebug) colorClass = 'text-gray-400';
              
              return (
                <div key={index} className={`${colorClass} whitespace-pre-wrap break-all`}>
                  {log}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3">🛠️ Debug Instructions</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>How to debug campaign creation:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to the onboarding page: <code className="bg-gray-100 px-1 rounded">/onboard</code></li>
            <li>Fill out the campaign form and click "Launch Campaign"</li>
            <li>Come back to this page to see detailed logs</li>
            <li>Look for ERROR messages in red</li>
            <li>Download logs and share specific error details</li>
          </ol>
          
          <p className="mt-4"><strong>Log Levels:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><span className="text-red-600">ERROR</span> - Something went wrong</li>
            <li><span className="text-yellow-600">WARN</span> - Warning or potential issue</li>
            <li><span className="text-blue-600">INFO</span> - General information</li>
            <li><span className="text-gray-600">DEBUG</span> - Detailed debug information</li>
          </ul>
          
          <p className="mt-4">
            <strong>Direct URLs:</strong><br />
            • Main app: <a href="/" className="text-blue-500 hover:underline">http://localhost:5173/</a><br />
            • Campaign creation: <a href="/onboard" className="text-blue-500 hover:underline">http://localhost:5173/onboard</a><br />
            • Debug console: <a href="/debug" className="text-blue-500 hover:underline">http://localhost:5173/debug</a>
          </p>
        </div>
      </div>
    </div>
  );
} 