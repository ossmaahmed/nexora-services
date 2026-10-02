import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { RequestItem, STATUSES } from '../types';
import StatusBadge from '../components/StatusBadge';
import RequestModal from '../components/RequestModal';
import RequestDetailsModal from '../components/RequestDetailsModal';

export default function Requests() {
  const { user } = useAuth();
  const isAdmin = user!.role === 'admin';
  const isTechnician = user!.role === 'technician';
  const isStaff = isAdmin || isTechnician;
  const [items, setItems] = useState<RequestItem[]>([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      const response = await api.get('/requests', { params: filter ? { status: filter } : {} });
      setItems(response.data);
      setLoadError('');
    } catch (error) {
      setLoadError(errMsg(error));
    }
  }, [filter]);
  useEffect(() => { void load(); }, [load]);

  const changeStatus = async (id: number, status: string) => {
    try { await api.put(`/requests/${id}/status`, { status }); load(); } catch (e) { alert(errMsg(e)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{isAdmin ? 'All Requests' : isTechnician ? 'Technician Queue' : 'My Requests'}</h1>
        <div className="flex gap-2">
          <select className="input w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {!isStaff && <button className="btn" onClick={() => setOpen(true)}>+ Create Request</button>}
        </div>
      </div>
      {loadError && <p className="text-sm text-danger" role="alert">{loadError}</p>}
      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">#</th><th className="th">Title</th>
              {isStaff && <th className="th">User</th>}
              {isAdmin && <th className="th">Technician</th>}
              <th className="th">Service</th><th className="th">Priority</th><th className="th">Status</th><th className="th">File</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-slate-700">
                <td className="td">{r.id}</td>
                <td className="td"><button className="text-left text-primary hover:underline" onClick={() => setSelectedId(r.id)}>{r.title}</button></td>
                {isStaff && <td className="td">{r.user.name}</td>}
                {isAdmin && <td className="td">{r.technician?.name || '-'}</td>}
                <td className="td">{r.service.icon} {r.service.name}</td><td className="td">{r.priority}</td>
                <td className="td">
                  <div className="flex min-w-40 flex-col items-start gap-2">
                    <StatusBadge status={r.status} />
                    {isAdmin && (r.status === 'Pending' || r.status === 'Awaiting Admin Approval') && (
                      <select className="input w-44" value="" onChange={(e) => changeStatus(r.id, e.target.value)}>
                        <option value="" disabled>Choose action</option>
                        {(r.status === 'Pending' ? ['Rejected', 'In Progress'] : ['Completed', 'In Progress']).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                    {isTechnician && r.status === 'In Progress' && (!r.technician || r.technician.id === user!.id) && (
                      <button className="btn" onClick={() => changeStatus(r.id, r.technician ? 'Awaiting Admin Approval' : 'In Progress')}>
                        {r.technician ? 'Send to admin' : 'Take request'}
                      </button>
                    )}
                    {!isStaff && r.status === 'Rejected' && <span className="text-xs text-danger">This request was rejected by admin.</span>}
                  </div>
                </td>
                <td className="td">{r.attachment ? <a className="text-primary underline" href={r.attachment} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="td text-slate-400" colSpan={isAdmin ? 8 : isStaff ? 7 : 6}>No requests found</td></tr>}
          </tbody>
        </table>
      </div>
      {open && <RequestModal onClose={() => setOpen(false)} onCreated={load} />}
      {selectedId !== null && <RequestDetailsModal requestId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
