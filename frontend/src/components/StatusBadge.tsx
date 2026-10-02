const colors: Record<string, string> = {
  Pending: 'bg-warning/20 text-warning',
  'In Progress': 'bg-primary/20 text-primary',
  'Awaiting Admin Approval': 'bg-warning/20 text-warning',
  Completed: 'bg-success/20 text-success',
  Rejected: 'bg-danger/20 text-danger',
};
export default function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] || 'bg-slate-700'}`}>{status}</span>;
}
