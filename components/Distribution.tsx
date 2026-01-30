
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { StoryAnalysis } from '../types';
import { normalizeTerm, normalizeCategory } from '../utils/normalize';

interface DistributionProps {
  analyses: StoryAnalysis[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const Distribution: React.FC<DistributionProps> = ({ analyses }) => {
  const navigate = useNavigate();

  const handleDistributionClick = (channel: string) => {
    navigate('/?distribution=' + encodeURIComponent(channel));
  };

  if (analyses.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-600">Not enough data to generate distribution insights</h2>
        <p className="text-slate-700 mt-2">Analyze at least 3 stories to see aggregate distribution intelligence.</p>
      </div>
    );
  }

  // Calculate distribution channels frequency
  const distCounts: Record<string, number> = {};
  analyses.forEach(a => {
    a.mainDistributionChannels.forEach(c => {
      const normalized = normalizeTerm(c);
      distCounts[normalized] = (distCounts[normalized] || 0) + 1;
    });
  });

  const distData = Object.entries(distCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const topDistData = distData.slice(0, 8);

  // Calculate category-distribution matrix (with normalized categories)
  const categoryDistribution: Record<string, Record<string, number>> = {};
  analyses.forEach(a => {
    const normalizedCat = normalizeCategory(a.category);
    if (!categoryDistribution[normalizedCat]) {
      categoryDistribution[normalizedCat] = {};
    }
    a.mainDistributionChannels.forEach(c => {
      const normalized = normalizeTerm(c);
      categoryDistribution[normalizedCat][normalized] = (categoryDistribution[normalizedCat][normalized] || 0) + 1;
    });
  });

  // Sort categories by total count and limit to top 6
  const sortedCategories = Object.entries(categoryDistribution)
    .map(([cat, channels]) => ({
      category: cat,
      channels,
      total: Object.values(channels).reduce((sum, c) => sum + c, 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Distribution Intelligence</h1>
        <p className="text-slate-700 mt-1">How successful companies acquire customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution Bar Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Distribution Channels</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDistData} layout="vertical" margin={{ left: 20, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Channel Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {topDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} companies`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend below chart */}
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {topDistData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-slate-700 font-medium">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution Ranking - Clickable */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribution Dominance (Click to Filter)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {distData.map((item, idx) => (
              <button
                key={item.name}
                onClick={() => handleDistributionClick(item.name)}
                className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer text-left"
              >
                <div className="text-2xl font-black text-slate-400">#{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-600">{item.value} companies</p>
                </div>
                <i className="fas fa-chevron-right text-slate-500"></i>
              </button>
            ))}
          </div>
        </div>

        {/* Top Channels by Category */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Channels by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCategories.map(({ category, channels }) => {
              const sortedChannels = Object.entries(channels)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);

              return (
                <div key={category} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                  <h4 className="text-sm font-black text-indigo-600 uppercase tracking-wide mb-3">{category}</h4>
                  <div className="space-y-2">
                    {sortedChannels.map(([channel, count], idx) => (
                      <button
                        key={channel}
                        onClick={() => handleDistributionClick(channel)}
                        className="w-full flex items-center justify-between text-xs p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <span className="text-slate-700">
                          <span className="font-bold text-slate-500 mr-2">{idx + 1}.</span>
                          {channel}
                        </span>
                        <span className="font-bold text-indigo-600">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Distribution;
