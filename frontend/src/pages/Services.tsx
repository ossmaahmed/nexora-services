import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Service } from '../types';
import RequestModal from '../components/RequestModal';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = { name: '', description: '', icon: '' };

export default function Services() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
      setError('');
    } catch (loadError) {
      setError(errMsg(loadError));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const startEdit = (service: Service) => {
    setEditing(service);
    setForm({ name: service.name, description: service.description, icon: service.icon });
    setFormOpen(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, status: editing?.status || 'active' };
      if (editing) await api.put(`/services/${editing.id}`, payload);
      else await api.post('/services', payload);
      setFormOpen(false);
      await load();
    } catch (saveError) {
      setError(errMsg(saveError));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (service: Service) => {
    try {
      await api.put(`/services/${service.id}`, {
        name: service.name,
        description: service.description,
        icon: service.icon,
        status: service.status === 'active' ? 'inactive' : 'active',
      });
      await load();
    } catch (statusError) {
      setError(errMsg(statusError));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Services</h1>
        {isAdmin && <button className="btn" onClick={startCreate}>Add service</button>}
      </div>
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div key={s.id} className={`flex flex-col rounded-xl bg-card p-5 ${s.status !== 'active' ? 'opacity-70' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="text-3xl">{s.icon}</div>
              {isAdmin && <span className="text-xs text-slate-400">{s.status}</span>}
            </div>
            <div className="mt-2 font-semibold">{s.name}</div>
            <p className="mt-1 flex-1 text-sm text-slate-400">{s.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {s.status === 'active' && user?.role === 'user' && <button className="btn" onClick={() => setSelected(s.id)}>Request Service</button>}
              {isAdmin && <>
                <button className="btn-ghost" onClick={() => startEdit(s)}>Edit</button>
                <button className="btn-ghost" onClick={() => void toggleStatus(s)}>{s.status === 'active' ? 'Deactivate' : 'Activate'}</button>
              </>}
            </div>
          </div>
        ))}
      </div>
      {services.length === 0 && !error && <p className="text-sm text-slate-400">No services available.</p>}
      {selected && <RequestModal defaultServiceId={selected} onClose={() => setSelected(null)} onCreated={() => nav('/requests')} />}
      {formOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-xl bg-card p-6">
          <h2 className="text-lg font-semibold">{editing ? 'Edit service' : 'Add service'}</h2>
          <input className="input" placeholder="Service name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input className="input" placeholder="Icon or emoji" value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} required />
          <textarea className="input min-h-24" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="btn" disabled={saving}>{saving ? 'Saving...' : 'Save service'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}
