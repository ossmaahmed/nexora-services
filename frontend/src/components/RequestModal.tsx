import { FormEvent, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { PRIORITIES, Service } from '../types';

interface Props { onClose: () => void; onCreated: () => void; defaultServiceId?: number }

export default function RequestModal({ onClose, onCreated, defaultServiceId }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState(defaultServiceId ? String(defaultServiceId) : '');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get('/services').then((r) => setServices(r.data)); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const fd = new FormData();
    fd.append('title', title); fd.append('description', description);
    fd.append('priority', priority); fd.append('serviceId', serviceId);
    if (file) fd.append('attachment', file);
    try { await api.post('/requests', fd); onCreated(); onClose(); }
    catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-xl bg-card p-6">
        <h2 className="text-lg font-semibold">Create Request</h2>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <select className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
          <option value="">Select service</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
        </select>
        <div className="flex gap-4 text-sm">
          {PRIORITIES.map((p) => (
            <label key={p} className="flex items-center gap-1">
              <input type="radio" name="priority" checked={priority === p} onChange={() => setPriority(p)} /> {p}
            </label>
          ))}
        </div>
        <textarea className="input h-28" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        <input type="file" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
}
