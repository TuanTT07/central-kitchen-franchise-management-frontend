import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

type AuthContextValue = {
  user: any | null;
  userName: string;
  roleName: string | null;
  token: string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [roleName, setRoleName] = useState<string | null>(() => localStorage.getItem('userRole'));
  const [user, setUser] = useState<any | null>(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  });

  const userName = user?.userFullName ?? 'User';

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');

    setToken(null);
    setRoleName(null);
    setUser(null);

    navigate('/login', { replace: true });
  }, [navigate]);

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      userName,
      roleName,
      token,
      logout,
    }),
    [user, userName, roleName, token, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

