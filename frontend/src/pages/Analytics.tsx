import { useEffect, useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api';
import { Stats } from '../types';

const COLORS: Record<string, string> = { Pending: '#F59E0B', 'In Progress': '#3B82F6', 'Awaiting Admin Approval': '#F59E0B', Completed: '#22C55E', Rejected: '#EF4444' };

export default function Analytics() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { api.get('/requests/stats').then((r) => setS(r.data)); }, []);
  if (!s) return <p className="text-slate-400">Loading...</p>;

  const rate = s.total ? Math.round((s.Completed / s.total) * 100) : 0;
  const data = ['Pending', 'In Progress', 'Awaiting Admin Approval', 'Completed', 'Rejected'].map((k) => ({ name: k, value: s[k as keyof Stats] }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[['Total', s.total], ['Completed', s.Completed], ['Pending', s.Pending], ['Completion rate', `${rate}%`]].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-card p-5">
            <div className="text-sm text-slate-400">{l}</div>
            <div className="mt-1 text-3xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      <div className="h-80 rounded-xl bg-card p-4">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
              {data.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #334155' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
