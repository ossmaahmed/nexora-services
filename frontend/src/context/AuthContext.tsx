import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../api';
import { User } from '../types';

interface Ctx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
const AuthContext = createContext<Ctx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    api.get('/auth/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const store = (d: { token: string; user: User }) => { localStorage.setItem('token', d.token); setUser(d.user); };
  const login = async (email: string, password: string) => store((await api.post('/auth/login', { email, password })).data);
  const register = async (name: string, email: string, password: string) =>
    store((await api.post('/auth/register', { name, email, password })).data);
  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
