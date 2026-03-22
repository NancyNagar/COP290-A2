import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types/user';
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/auth_service';
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER': return { ...state, user: action.payload, loading: false, error: null };
    case 'CLEAR_USER': return { ...state, user: null, loading: false };
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
    default: return state;
  }
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, loading: true, error: null });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        dispatch({ type: 'SET_USER', payload: JSON.parse(stored) as User });
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  async function login(payload: LoginPayload) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const res = await apiLogin(payload);
      localStorage.setItem('user', JSON.stringify(res.user));
      dispatch({ type: 'SET_USER', payload: res.user });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      throw err;
    }
  }

  async function logout() {
    try { await apiLogout(); } finally {
      localStorage.removeItem('user');
      dispatch({ type: 'CLEAR_USER' });
    }
  }

  async function register(payload: RegisterPayload) {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await apiRegister(payload);
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      throw err;
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}