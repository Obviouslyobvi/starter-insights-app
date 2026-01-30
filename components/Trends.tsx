
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { StoryAnalysis } from '../types';
import { normalizeTerm, normalizeCategory } from '../utils/normalize';

interface TrendsProps {
  analyses: StoryAnalysis[];
  onCategoryFilter?: (category: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Trends: React.FC<TrendsProps> = ({ analyses, onCategoryFilter }) => {
  const navigate = useNavigate();

  const handleCategoryClick = (category: string) => {
    if (onCategoryFilter) {
      onCategoryFilter(category);
    }
    navigate('/?category=' + encodeURIComponent(category));
  };
  if (analyses.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-600">Not enough data to generate trends</h2>
        <p className="text-slate-700 mt-2">Analyze at least 3 stories to see aggregate market intelligence.</p>
      </div>
    );
  }

  // Calculate top distribution channels
  const distCounts: Record<string, number> = {};
  analyses.forEach(a => {
    a.mainDistributionChannels.forEach(c => {
      const normalized = normalizeTerm(c);
      distCounts[normalized] = (distCounts[normalized] || 0) + 1;
    });
  });

  const distData = Object.entries(distCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Calculate monetization frequency
  const monCounts: Record<string, number> = {};
  analyses.forEach(a => {
    a.mainMonetizationMethods.forEach(m => {
      const normalized = normalizeTerm(m);
      monCounts[normalized] = (monCounts[normalized] || 0) + 1;
    });
  });

  const monData = Object.entries(monCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Category distribution (normalized)
  const catCounts: Record<string, number> = {};
  analyses.forEach(a => {
    const normalized = normalizeCategory(a.category);
    catCounts[normalized] = (catCounts[normalized] || 0) + 1;
  });
  const catData = Object.entries(catCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Limit pie chart to top 6 categories
  const topCatData = catData.slice(0, 6);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Market Intelligence</h1>
        <p className="text-slate-700 mt-1">Aggregated insights across your analyzed database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Growth Channels</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} layout="vertical" margin={{ left: 40, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Business Categories</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCatData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {topCatData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Ranking - Clickable */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Categories (Click to Filter)</h3>
          <div className="space-y-3">
            {catData.slice(0, 10).map((item, idx) => (
              <button
                key={item.name}
                onClick={() => handleCategoryClick(item.name)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer text-left"
              >
                <div className="text-2xl font-black text-slate-400">#{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 capitalize">{item.name}</p>
                  <p className="text-xs text-slate-600">{item.value} companies</p>
                </div>
                <i className="fas fa-chevron-right text-slate-500"></i>
              </button>
            ))}
          </div>
        </div>

        {/* Monetization Ranking */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Monetization Models</h3>
          <div className="space-y-3">
            {monData.slice(0, 8).map((item, idx) => (
              <div key={item.name} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-black text-slate-400">#{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 capitalize">{item.name}</p>
                  <p className="text-xs text-slate-600">{item.value} companies</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trends;
