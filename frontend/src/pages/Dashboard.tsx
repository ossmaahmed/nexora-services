import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { RequestItem, Stats } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RequestItem[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    api.get('/requests/stats').then((r) => setStats(r.data));
    api.get('/requests').then((r) => setRecent(r.data.slice(0, 5)));
    if (user?.role === 'admin') api.get('/users/stats').then((r) => setUserCount(r.data.total));
  }, [user?.role]);

  if (!stats) return <p className="text-slate-400">Loading...</p>;
  const cards: [string, number | string, string][] = [
    ['Total', stats.total, 'text-white'],
    ['Pending', stats.Pending, 'text-warning'],
    ['In Progress', stats['In Progress'], 'text-primary'],
    ['Completed', stats.Completed, 'text-success'],
    ...(user?.role === 'admin' ? [['Users', userCount ?? '...', 'text-primary'] as [string, number | string, string]] : []),
  ];
  const chart = ['Pending', 'In Progress', 'Awaiting Admin Approval', 'Completed', 'Rejected'].map((k) => ({ name: k, count: stats[k as keyof Stats] }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map(([label, value, color]) => (
          <div key={label} className="rounded-xl bg-card p-5">
            <div className="text-sm text-slate-400">{label}</div>
            <div className={`mt-1 text-3xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      <div className="h-64 rounded-xl bg-card p-4">
        <ResponsiveContainer>
          <BarChart data={chart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis allowDecimals={false} stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #334155' }} />
            <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full">
          <thead><tr><th className="th">Title</th><th className="th">Service</th><th className="th">Priority</th><th className="th">Status</th></tr></thead>
          <tbody>
            {recent.map((r) => (
              <tr key={r.id} className="border-t border-slate-700">
                <td className="td">{r.title}</td><td className="td">{r.service.icon} {r.service.name}</td>
                <td className="td">{r.priority}</td><td className="td"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {recent.length === 0 && <tr><td className="td text-slate-400" colSpan={4}>No requests yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
