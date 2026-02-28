
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ScanResult, Severity } from '../types';
import { SEVERITY_CHART_COLORS } from '../constants';
import { ShieldCheck, AlertCircle, Clock, Zap } from 'lucide-react';

interface DashboardProps {
  lastScan?: ScanResult;
}

const Dashboard: React.FC<DashboardProps> = ({ lastScan }) => {
  if (!lastScan) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center max-w-lg mx-auto animate-in fade-in duration-700">
        <div className="p-6 bg-slate-900 rounded-full mb-8 ring-8 ring-slate-900/50">
          <ShieldCheck className="w-20 h-20 text-blue-500 opacity-50" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Aegis AI Security Dashboard</h3>
        <p className="text-slate-400 mb-8">
          No audits have been performed in this session. Start a new scan to see detailed vulnerability metrics and remediation reports.
        </p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('nav-scan'))}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
        >
          Begin First Audit
        </button>
      </div>
    );
  }

  const { summary, scanDuration } = lastScan;
  const chartData = [
    { name: 'Critical', value: summary.critical, color: SEVERITY_CHART_COLORS[Severity.CRITICAL] },
    { name: 'High', value: summary.high, color: SEVERITY_CHART_COLORS[Severity.HIGH] },
    { name: 'Medium', value: summary.medium, color: SEVERITY_CHART_COLORS[Severity.MEDIUM] },
    { name: 'Low', value: summary.low, color: SEVERITY_CHART_COLORS[Severity.LOW] },
    { name: 'Info', value: summary.info, color: SEVERITY_CHART_COLORS[Severity.INFO] },
  ].filter(d => d.value > 0);

  const stats = [
    { label: 'Total Findings', value: summary.total, icon: AlertCircle, color: 'text-white' },
    { label: 'Risk Score', value: (summary.critical * 10 + summary.high * 5 + summary.medium * 2).toFixed(0), icon: Zap, color: 'text-red-500' },
    { label: 'Scan Duration', value: `${(scanDuration / 1000).toFixed(2)}s`, icon: Clock, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-800 rounded-xl">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
          <h4 className="text-lg font-bold text-white mb-6">Risk Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-400">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
          <h4 className="text-lg font-bold text-white mb-6">Severity Matrix</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-800/20">
          <h4 className="text-lg font-bold text-white">Latest Scan Target</h4>
        </div>
        <div className="p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500 font-mono">TARGET_IDENTIFIER</p>
            <p className="text-white font-mono break-all bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-40 overflow-y-auto">
              {lastScan.target}
            </p>
          </div>
          <div className="flex flex-wrap gap-10 mt-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Audit Time</p>
              <p className="text-sm text-slate-200">{new Date(lastScan.timestamp).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Target Type</p>
              <p className="text-sm text-slate-200">{lastScan.targetType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
