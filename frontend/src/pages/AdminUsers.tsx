import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Service, User } from '../types';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [editingTechnician, setEditingTechnician] = useState<User | null>(null);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const load = useCallback(() => {
    api.get('/users', { params: { search } }).then((r) => setUsers(r.data));
  }, [search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => { api.get('/services').then((r) => setServices(r.data)); }, []);

  const act = async (fn: () => Promise<unknown>) => { try { await fn(); load(); } catch (e) { alert(errMsg(e)); } };
  const saveServiceSkills = async () => {
    if (!editingTechnician) return;
    try {
      await api.put(`/users/${editingTechnician.id}/services`, { serviceIds: selectedServiceIds });
      setEditingTechnician(null);
      load();
    } catch (error) { alert(errMsg(error)); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Users</h1>
        <input className="input w-64" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full">
          <thead><tr><th className="th">Name</th><th className="th">Email</th><th className="th">Role</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-700">
                <td className="td">{u.name}</td><td className="td">{u.email}</td>
                <td className="td">
                  <select className="input w-32" value={u.role} onChange={(e) => act(() => api.put(`/users/${u.id}/role`, { role: e.target.value }))}>
                    <option>user</option><option>technician</option><option>admin</option>
                  </select>
                </td>
                <td className={`td ${u.status === 'blocked' ? 'text-danger' : 'text-success'}`}>{u.status}</td>
                <td className="td">
                  <button className="btn-ghost" onClick={() => act(() => api.put(`/users/${u.id}/block`))}>
                    {u.status === 'blocked' ? 'Unblock' : 'Block'}
                  </button>
                  {u.role === 'technician' && (
                    <button className="btn-ghost" onClick={() => {
                      setEditingTechnician(u);
                      setSelectedServiceIds(u.serviceSkills?.map((service) => service.id) || []);
                    }}>Services ({u.serviceSkills?.length || 0})</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingTechnician && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Services for {editingTechnician.name}</h2>
            <div className="space-y-2">
              {services.filter((service) => service.status === 'active').map((service) => (
                <label key={service.id} className="flex items-center gap-3 rounded border border-slate-700 p-3">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={(event) => setSelectedServiceIds((current) => event.target.checked
                      ? [...current, service.id]
                      : current.filter((id) => id !== service.id))}
                  />
                  <span>{service.icon} {service.name}</span>
                </label>
              ))}
              {services.every((service) => service.status !== 'active') && <p className="text-sm text-slate-400">No active services.</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setEditingTechnician(null)}>Cancel</button>
              <button className="btn" onClick={() => void saveServiceSkills()}>Save services</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
