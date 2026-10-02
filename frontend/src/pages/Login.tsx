import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) await register(name, email, password); else await login(email, password);
      nav('/dashboard');
    } catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-card p-8">
        <h1 className="text-2xl font-bold text-primary">NEXORA</h1>
        <p className="text-sm text-slate-400">{isRegister ? 'Create your account' : 'Sign in to continue'}</p>
        {isRegister && <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />}
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (6+ chars)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button className="btn w-full">{isRegister ? 'Register' : 'Login'}</button>
        <button type="button" className="w-full text-sm text-slate-400 hover:text-white" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Have an account? Login' : "No account? Register"}
        </button>
      </form>
    </div>
  );
}
