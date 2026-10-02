import { FormEvent, useEffect, useState } from 'react';
import api, { errMsg } from '../api';

interface RequestDetails {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  comments: Array<{
    id: number;
    comment: string;
    createdAt: string;
    user: { name: string; role: string };
  }>;
}

interface Props { requestId: number; onClose: () => void }

export default function RequestDetailsModal({ requestId, onClose }: Props) {
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const response = await api.get(`/requests/${requestId}`);
      setRequest(response.data);
      setError('');
    } catch (loadError) {
      setError(errMsg(loadError));
    }
  };

  useEffect(() => { void load(); }, [requestId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(`/requests/${requestId}/comments`, { comment });
      setComment('');
      await load();
    } catch (submitError) {
      setError(errMsg(submitError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="w-full max-w-2xl space-y-5 rounded-xl bg-card p-6" role="dialog" aria-modal="true" aria-labelledby="request-details-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="request-details-title" className="text-lg font-semibold">{request?.title || 'Request details'}</h2>
            {request && <p className="mt-1 text-sm text-slate-400">#{request.id} · {request.priority} · {request.status}</p>}
          </div>
          <button type="button" className="btn-ghost" aria-label="Close request details" onClick={onClose}>Close</button>
        </div>
        {!request && !error && <p className="text-sm text-slate-400">Loading request...</p>}
        {request && <p className="whitespace-pre-wrap text-sm">{request.description}</p>}
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        {request && <div className="max-h-56 space-y-3 overflow-y-auto border-y border-slate-700 py-4">
          <h3 className="text-sm font-semibold">Conversation</h3>
          {request.comments.length === 0 && <p className="text-sm text-slate-400">No comments yet</p>}
          {request.comments.map((entry) => (
            <article key={entry.id} className="border-l-2 border-slate-600 pl-3">
              <p className="whitespace-pre-wrap text-sm">{entry.comment}</p>
              <p className="mt-1 text-xs text-slate-400">{entry.user.name} · {new Date(entry.createdAt).toLocaleString()}</p>
            </article>
          ))}
        </div>}
        {request && <form onSubmit={submit} className="space-y-3">
          <textarea className="input min-h-20" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" required />
          <div className="flex justify-end">
            <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Add comment'}</button>
          </div>
        </form>}
      </section>
    </div>
  );
}