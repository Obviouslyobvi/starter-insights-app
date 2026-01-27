
import React, { useState, useMemo } from 'react';
import { StoryAnalysis } from '../types';

interface DashboardProps {
  analyses: StoryAnalysis[];
  onRemove: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ analyses, onRemove }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return analyses.filter(a => 
      a.companyName.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.founder.toLowerCase().includes(search.toLowerCase())
    );
  }, [analyses, search]);

  return (
    <div className="space-y-10 animate-fadeIn">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Vault</h1>
          <p className="text-slate-600 mt-2 font-medium">Decoded distribution hacks and growth insights.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text"
              placeholder="Filter companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-medium text-sm"
            />
          </div>
          <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 shrink-0">
             <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <i className="fas fa-database text-lg"></i>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Database</p>
              <p className="text-xl font-black text-slate-900 leading-none">{analyses.length}</p>
            </div>
          </div>
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 mx-auto">
            <i className="fas fa-ghost text-3xl text-slate-200"></i>
          </div>
          <h3 className="text-xl font-black text-slate-900">No matches found</h3>
          <p className="text-slate-500 mt-2 font-medium">Try a different search or crawl new stories.</p>
          {analyses.length === 0 && (
            <a href="#/analyze" className="mt-8 inline-flex bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all gap-3 items-center shadow-xl shadow-indigo-100">
              <i className="fas fa-plus"></i> Start Analyzing
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {filtered.map(story => (
            <div key={story.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-3xl shadow-xl ring-4 ring-slate-50">
                      {story.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 leading-tight">{story.companyName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-slate-400">{story.founder}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tight">{story.revenue}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemove(story.id)}
                    className="text-slate-200 hover:text-rose-500 p-3 rounded-xl transition-all hover:bg-rose-50"
                  >
                    <i className="fas fa-trash-alt text-sm"></i>
                  </button>
                </div>

                <div className="mb-8 p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <i className="fas fa-lightbulb text-6xl -rotate-12"></i>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">The "Aha!" Moment</span>
                  </div>
                  <p className="text-base font-medium leading-relaxed italic text-slate-100 relative z-10">
                    "{story.ahaMoment}"
                  </p>
                </div>

                <div className="space-y-8">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-3">
                      <span className="w-8 h-[1px] bg-slate-100"></span> Distribution Strategy
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {story.mainDistributionChannels.map(chan => (
                        <span key={chan} className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl border border-indigo-100/50">
                          {chan}
                        </span>
                      ))}
                    </div>
                  </section>
                  
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-3">
                      <span className="w-8 h-[1px] bg-slate-100"></span> Monetization
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {story.mainMonetizationMethods.map(meth => (
                        <span key={meth} className="text-[10px] font-black bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100/50">
                          {meth}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
              
              <div className="bg-slate-50/50 px-8 py-5 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref: {new Date(story.analyzedAt).toLocaleDateString()}</span>
                <span className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">{story.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
