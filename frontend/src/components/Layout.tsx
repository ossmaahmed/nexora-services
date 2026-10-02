import { FormEvent, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/requests', label: user!.role === 'user' ? 'My Requests' : user!.role === 'technician' ? 'Technician Queue' : 'All Requests' },
    { to: '/services', label: 'Services' },
    ...(user!.role === 'admin'
      ? [{ to: '/admin/users', label: 'Users' }, { to: '/admin/analytics', label: 'Analytics' }]
      : []),
  ];
  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSaved(true);
    } catch (error) { setPasswordError(errMsg(error)); }
  };
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 flex-col bg-card p-5 md:flex">
        <div className="mb-8 text-2xl font-bold text-primary">NEXORA</div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1">
          <button className="btn-ghost w-full" onClick={() => { logout(); nav('/login'); }}>Logout</button>
        </div>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between gap-2 border-b border-slate-700 px-4 py-4 sm:px-6">
          <div className="text-sm text-slate-400 md:hidden font-bold text-primary">NEXORA</div>
          <div className="ml-auto flex min-w-0 items-center gap-2 text-sm">
            <button className="btn-ghost whitespace-nowrap" onClick={() => { setPasswordOpen(true); setPasswordSaved(false); }}>
              <span className="sm:hidden">Password</span><span className="hidden sm:inline">Change password</span>
            </button>
            <span className="max-w-24 truncate sm:max-w-none">{user!.name}</span>
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs">{user!.role}</span>
          </div>
        </header>
        <main className="p-6"><Outlet /></main>
      </div>
      {passwordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={changePassword} className="w-full max-w-sm space-y-4 rounded-lg bg-card p-6">
            <h2 className="text-lg font-semibold">Change password</h2>
            <input className="input" type="password" autoComplete="current-password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            <input className="input" type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required />
            {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
            {passwordSaved && <p className="text-sm text-success">Password updated.</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setPasswordOpen(false)}>Close</button>
              <button className="btn">Update password</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
