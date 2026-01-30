
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { discoverAllStories, analyzeStory } from '../geminiService';
import { StoryAnalysis } from '../types';
import { GoogleSheetsService } from '../googleSheetsService';

interface AnalyzeFormProps {
  onAdd: (analysis: StoryAnalysis) => void;
  existingAnalyses: StoryAnalysis[];
  googleToken: string;
  spreadsheetId: string | null;
}

type CrawlerStatus = 'idle' | 'discovering' | 'analyzing' | 'completed' | 'error' | 'paused';

const AnalyzeForm: React.FC<AnalyzeFormProps> = ({ onAdd, existingAnalyses, googleToken, spreadsheetId }) => {
  const [status, setStatus] = useState<CrawlerStatus>('idle');
  const [batchSize, setBatchSize] = useState(10);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error' | 'warn'}[]>([]);
  const [queue, setQueue] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') => {
    setLogs(prev => [...prev, { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  };

  const startAutomatedCrawl = async () => {
    if (isRunningRef.current || !spreadsheetId) return;
    
    isRunningRef.current = true;
    setStatus('discovering');
    setError(null);
    setLogs([]);
    addLog("System Initialize: Starting Google Sheets session...", 'info');
    
    try {
      const sheetService = new GoogleSheetsService(googleToken);

      // 1. DISCOVERY
      addLog(`Discovery: Scouring Starter Story for ${batchSize} new case studies...`, 'info');
      const discoveredNames = await discoverAllStories(existingAnalyses.length, batchSize);
      
      const existingNamesSet = new Set(existingAnalyses.map(a => a.companyName.toLowerCase()));
      const filteredQueue = discoveredNames.filter(name => !existingNamesSet.has(name.toLowerCase()));
      
      if (filteredQueue.length === 0) {
        addLog("Discovery: All items found are already in your Vault.", 'success');
        setStatus('completed');
        isRunningRef.current = false;
        return;
      }

      setQueue(filteredQueue);
      addLog(`Discovery Complete: Found ${filteredQueue.length} unsynced stories. Starting Analysis.`, 'success');
      
      // 2. SEQUENTIAL ANALYSIS + CLOUD SYNC
      setStatus('analyzing');
      for (let i = 0; i < filteredQueue.length; i++) {
        if (!isRunningRef.current) break;
        
        const target = filteredQueue[i];
        setCurrentIndex(i + 1);
        addLog(`Processing (${i+1}/${filteredQueue.length}): Decoding ${target}...`, 'info');

        try {
          const result = await analyzeStory(target);
          
          const storyData: StoryAnalysis = {
            id: `cloud-${Date.now()}-${i}`,
            companyName: result.companyName,
            founder: result.founder,
            revenue: result.revenue,
            mainDistributionChannels: result.distributionChannels,
            mainMonetizationMethods: result.monetizationMethods,
            ahaMoment: result.ahaMoment,
            summary: result.summary,
            category: result.category,
            rawContent: "Extracted via Gemini Pro",
            analyzedAt: new Date().toISOString(),
            starterStoryUrl: result.starterStoryUrl,
            companyWebsite: result.companyWebsite
          };

          addLog(`Cloud Sync: Writing ${target} to Google Sheets...`, 'info');
          await sheetService.appendStory(spreadsheetId, storyData);
          
          onAdd(storyData);
          addLog(`Success: ${target} analyzed and synced.`, 'success');
        } catch (itemErr: any) {
          addLog(`Warning: Failed to process ${target}. Reason: ${itemErr.message}`, 'warn');
        }

        // Avoid rate limits
        await new Promise(r => setTimeout(r, 1500));
      }

      if (isRunningRef.current) {
        addLog("Mission Complete: All batch items processed and secured.", 'success');
        setStatus('completed');
        isRunningRef.current = false;
      }

    } catch (err: any) {
      isRunningRef.current = false;
      setStatus('error');
      setError(err.message);
      addLog(`SYSTEM FAILURE: ${err.message}`, 'error');
    }
  };

  const stopCrawl = () => {
    isRunningRef.current = false;
    setStatus('paused');
    addLog("System: User requested manual pause.", 'warn');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cloud Crawler</h1>
          <p className="text-slate-700 mt-2 font-medium">Analyze Starter Story batches directly to Sheets.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            disabled={status === 'analyzing' || status === 'discovering'}
            value={batchSize}
            onChange={(e) => setBatchSize(Number(e.target.value))}
            className="px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50"
          >
            <option value={10}>Batch: 10</option>
            <option value={25}>Batch: 25</option>
            <option value={50}>Batch: 50</option>
          </select>

          {status === 'discovering' || status === 'analyzing' ? (
            <button 
              onClick={stopCrawl}
              className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all flex items-center gap-2"
            >
              <i className="fas fa-stop"></i> Stop
            </button>
          ) : (
            <button 
              onClick={startAutomatedCrawl}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-3"
            >
              <i className="fas fa-bolt text-amber-300"></i>
              {status === 'paused' ? 'Resume' : 'Start Crawler'}
            </button>
          )}
        </div>
      </header>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="h-4 w-full bg-slate-50 relative">
          {(status === 'analyzing' || status === 'completed') && (
            <div 
              className="h-full bg-indigo-600 transition-all duration-1000 ease-in-out"
              style={{ width: `${(currentIndex / queue.length) * 100}%` }}
            ></div>
          )}
          {status === 'discovering' && (
            <div className="h-full bg-indigo-400 w-full animate-pulse"></div>
          )}
        </div>

        <div className="p-10">
          <div className="flex items-center gap-3 mb-8 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className={`w-3 h-3 rounded-full ${spreadsheetId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              G-Sheet Integration: {spreadsheetId ? 'Active & Ready' : 'Pending...'}
            </span>
          </div>

          <div 
            ref={logContainerRef}
            className="bg-slate-900 rounded-[2.5rem] p-10 font-mono text-xs h-[450px] overflow-y-auto shadow-inner border border-slate-800 custom-scrollbar"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700">
                <i className="fas fa-terminal text-6xl mb-6 opacity-10"></i>
                <p className="text-lg font-bold">System Idle</p>
                <p className="text-xs uppercase tracking-widest opacity-40 mt-2">Ready for deployment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log, i) => (
                  <div key={i} className={`flex items-start gap-5 ${
                    log.type === 'success' ? 'text-emerald-400' : 
                    log.type === 'error' ? 'text-rose-400' : 
                    log.type === 'warn' ? 'text-amber-400' : 'text-indigo-300'
                  }`}>
                    <span className="opacity-30 text-[9px] mt-1 font-bold">{String(i + 1).padStart(3, '0')}</span>
                    <span className="leading-relaxed">{log.msg}</span>
                  </div>
                ))}
                {isRunningRef.current && (
                  <div className="pt-8 flex items-center gap-3">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default AnalyzeForm;
