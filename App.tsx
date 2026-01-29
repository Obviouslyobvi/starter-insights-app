
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AnalyzeForm from './components/AnalyzeForm';
import Trends from './components/Trends';
import { StoryAnalysis } from './types';
import { GoogleSheetsService } from './googleSheetsService';

const App: React.FC = () => {
  const [analyses, setAnalyses] = useState<StoryAnalysis[]>([]);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(localStorage.getItem('google_client_id') || '');
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(localStorage.getItem('gsheet_id'));
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // DETECTION: Check if we are in a tiny window, but don't hard-block.
  const isIframe = window.self !== window.top;
  const isExpanded = window.location.search.includes('fullscreen') || !isIframe;

  // ROBUST URL DETECTION: Avoids doubling up origin/path
  const getSafeUrl = () => {
    // This is the most reliable way to get the base URL without query strings or hashes
    return window.location.href.split('#')[0].split('?')[0].replace(/\/$/, '');
  };

  const currentRedirectUri = getSafeUrl();
  const currentOrigin = window.location.origin;

  const [manualRedirectUri, setManualRedirectUri] = useState<string>(localStorage.getItem('manual_override_uri') || '');
  const [showOverride, setShowOverride] = useState(manualRedirectUri !== '');

  const finalRedirectUri = (manualRedirectUri || currentRedirectUri);

  useEffect(() => {
    const processToken = () => {
      const hash = window.location.hash || window.location.search;
      if (hash && (hash.includes('access_token=') || hash.includes('token='))) {
        const params = new URLSearchParams(hash.replace(/^#/, '').replace(/^\?/, ''));
        const token = params.get('access_token') || params.get('token');
        if (token) {
          setGoogleToken(token);
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };
    processToken();
    window.addEventListener('hashchange', processToken);
    return () => window.removeEventListener('hashchange', processToken);
  }, []);

  useEffect(() => {
    localStorage.setItem('google_client_id', clientId.trim());
    localStorage.setItem('manual_override_uri', manualRedirectUri.trim());
  }, [clientId, manualRedirectUri]);

  // Initialize Google Sheet after login
  useEffect(() => {
    if (googleToken && !spreadsheetId) {
      setIsInitializing(true);
      const sheetService = new GoogleSheetsService(googleToken);
      sheetService.findOrCreateSheet()
        .then((id) => {
          setSpreadsheetId(id);
          localStorage.setItem('gsheet_id', id);
        })
        .catch((err) => {
          console.error('Sheet init error:', err);
          alert('Failed to initialize Google Sheet: ' + err.message);
        })
        .finally(() => setIsInitializing(false));
    }
  }, [googleToken, spreadsheetId]);

  // Load all stories from Google Sheet
  useEffect(() => {
    if (googleToken && spreadsheetId && analyses.length === 0) {
      setIsInitializing(true);
      const sheetService = new GoogleSheetsService(googleToken);
      sheetService.getAllStories(spreadsheetId)
        .then((stories) => {
          const fullStories = stories.map((s, i) => ({
            ...s,
            id: `sheet-${i}`,
            rawContent: 'Loaded from Google Sheets',
          })) as StoryAnalysis[];
          setAnalyses(fullStories);
        })
        .catch((err) => {
          console.error('Load stories error:', err);
        })
        .finally(() => setIsInitializing(false));
    }
  }, [googleToken, spreadsheetId]);

  const handleLogin = () => {
    if (!clientId.trim().includes('.apps.googleusercontent.com')) {
      alert("⚠️ PAUSE: You need to paste your Google Client ID into Step 2 first.");
      return;
    }
    
    setIsLoggingIn(true);
    const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId.trim()}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&response_type=token&scope=${scope}&prompt=select_account`;
    
    window.location.href = authUrl;
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied! Now go to your Google Cloud Console and paste this.");
  };

  if (!googleToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start py-20 p-6 font-['Inter']">
        
        {/* WARNING FOR UPDATES */}
        <div className="mb-10 w-full max-w-2xl bg-indigo-500/10 border border-indigo-500/30 p-8 rounded-[2.5rem] text-center">
          <h2 className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em] mb-2">Important Note</h2>
          <p className="text-indigo-100/60 text-sm leading-relaxed">
            Every time the app code is updated, your <span className="text-indigo-400 font-bold">Redirect URI</span> may change. 
            If you get a "Mismatch" error, you must copy the new URI below and update your Google Console again.
          </p>
        </div>

        {!isExpanded && (
          <div className="mb-8 w-full max-w-2xl bg-amber-500/10 border border-amber-500/30 p-6 rounded-[2rem] text-center">
            <h2 className="text-amber-500 font-black text-sm mb-1 uppercase tracking-widest">Notice: Preview Mode</h2>
            <p className="text-amber-200/60 text-[11px]">If the connection fails, use the "Expand" icon at the top right of this screen.</p>
          </div>
        )}

        <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-2xl max-w-2xl w-full border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuration</h1>
            <p className="text-slate-500 font-medium mt-3">Link this specific build to your Google Project.</p>
          </div>

          <div className="space-y-10">
            {/* STEP 1: GOOGLE CONSOLE */}
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Step 1. Cloud Console</h3>
              </div>
              
              <div className="space-y-8">
                <section>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">JavaScript Origin</label>
                    <button onClick={() => copy(currentOrigin)} className="text-[9px] font-black text-indigo-400 hover:text-white transition-colors">COPY</button>
                  </div>
                  <code className="bg-white/5 p-4 rounded-xl text-[10px] font-mono block border border-white/10 text-indigo-300 break-all">{currentOrigin}</code>
                </section>

                <section>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Redirect URI</label>
                    <button onClick={() => copy(finalRedirectUri)} className="text-[9px] font-black text-emerald-400 hover:text-white transition-colors">COPY</button>
                  </div>
                  <code className="bg-white/5 p-4 rounded-xl text-[10px] font-mono block border border-white/10 text-emerald-400 break-all">{finalRedirectUri}</code>
                </section>
              </div>
            </div>

            {/* STEP 2: CLIENT ID */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 px-4">
                <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">2</span>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Paste Google Client ID</label>
              </div>
              <input 
                type="text" 
                placeholder="xxxxxx.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-500 outline-none font-mono text-xs shadow-inner"
              />
            </div>

            {/* ACTION */}
            <div className="space-y-4 pt-4">
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={`w-full py-7 rounded-[2.5rem] font-black text-white transition-all shadow-2xl flex items-center justify-center gap-4 text-lg ${isLoggingIn ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'}`}
              >
                {isLoggingIn ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-link"></i>}
                {isLoggingIn ? 'Connecting...' : 'Connect to Google'}
              </button>
            </div>

            <div className="flex justify-center gap-8 items-center px-6">
               <button onClick={() => setShowOverride(!showOverride)} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                {showOverride ? 'Hide Manual' : 'Help! Mismatch Error'}
               </button>
               <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-[9px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-colors">
                Reset App
               </button>
            </div>

            {showOverride && (
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 animate-fadeIn">
                <p className="text-[10px] font-bold text-slate-600 leading-relaxed mb-4">
                  If Google shows a "mismatch" popup, find the URL it is asking for in its error message. Paste that exact URL here.
                </p>
                <input 
                  type="text"
                  placeholder="Paste URI from Google Error here..."
                  value={manualRedirectUri}
                  onChange={(e) => setManualRedirectUri(e.target.value)}
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[10px] font-mono outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen flex bg-slate-50">
        <nav className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-10">
          <div className="p-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <i className="fas fa-brain text-white text-lg"></i>
              </div>
              <span className="font-black text-2xl tracking-tighter">Insights</span>
            </div>
            
            <div className="space-y-4 flex-1">
              <SidebarLink to="/" icon="fas fa-th-large" label="Vault" />
              <SidebarLink to="/analyze" icon="fas fa-bolt" label="Crawler" />
              <SidebarLink to="/trends" icon="fas fa-chart-bar" label="Market" />
            </div>

            <div className="pt-10 border-t border-slate-800">
              <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/50 rounded-2xl mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black">
                  {isInitializing ? <i className="fas fa-spinner animate-spin text-[8px]"></i> : 'GS'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Database</p>
                  <p className="text-[10px] font-bold truncate opacity-80">Synced</p>
                </div>
              </div>
              <button 
                onClick={() => { setGoogleToken(null); setAnalyses([]); localStorage.removeItem('gsheet_id'); }}
                className="w-full flex items-center gap-3 px-6 py-4 text-slate-500 hover:text-rose-400 font-black text-xs uppercase tracking-widest transition-colors"
              >
                <i className="fas fa-power-off"></i> Sign Out
              </button>
            </div>
          </div>
        </nav>
        
        <main className="flex-1 ml-72 p-16 max-w-7xl">
          <Routes>
            <Route path="/" element={<Dashboard analyses={analyses} onRemove={(id) => setAnalyses(prev => prev.filter(a => a.id !== id))} />} />
            <Route path="/analyze" element={<AnalyzeForm onAdd={(a) => setAnalyses(prev => [a, ...prev])} existingAnalyses={analyses} googleToken={googleToken!} spreadsheetId={spreadsheetId} />} />
            <Route path="/trends" element={<Trends analyses={analyses} />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const SidebarLink: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = (to === '/' && location.pathname === '/') || (to !== '/' && location.pathname.startsWith(to));
  return (
    <Link to={to} className={`flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}>
      <i className={`${icon} text-lg`}></i>
      <span className="font-black text-sm tracking-tight">{label}</span>
    </Link>
  );
};

export default App;
