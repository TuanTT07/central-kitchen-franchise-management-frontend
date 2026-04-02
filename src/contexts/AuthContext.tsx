import { authService } from '@/services/authService';
import { extractPrimaryRoleFromLoginUser, normalizeToAppRole } from '@/lib/authRole';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';

/** Đồng bộ userRole từ JSON user (sửa session cũ lưu sai kiểu role). */
function readInitialRoleName(): string | null {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const u = JSON.parse(userJson);
      const raw = extractPrimaryRoleFromLoginUser(u);
      const n = normalizeToAppRole(raw);
      if (n) {
        localStorage.setItem('userRole', n);
        return n;
      }
      if (raw) {
        localStorage.setItem('userRole', raw);
        return raw;
      }
    } catch {
      /* ignore */
    }
  }
  const ls = localStorage.getItem('userRole');
  if (!ls || ls === '[object Object]') return null;
  const n = normalizeToAppRole(ls);
  return n ?? ls;
}

type AuthContextValue = {
  user: any | null;
  userName: string;
  roleName: string | null;
  token: string | null;
  refreshToken: string | null;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem('refreshToken'));
  const [roleName, setRoleName] = useState<string | null>(() => readInitialRoleName());
  const [user, setUser] = useState<any | null>(() => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  });

  /** Sau đăng nhập, localStorage đã có user/userRole nhưng state React chưa cập nhật — đồng bộ khi đổi route (cùng tab không có sự kiện storage). */
  useEffect(() => {
    const t = localStorage.getItem('authToken');
    setToken(t);
    setRefreshToken(localStorage.getItem('refreshToken'));
    if (!t) {
      setRoleName(null);
      setUser(null);
      return;
    }
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      setRoleName(readInitialRoleName());
      return;
    }
    try {
      const parsed = JSON.parse(userJson) as Record<string, unknown>;
      setUser(parsed);
      const raw = extractPrimaryRoleFromLoginUser(parsed);
      const n = normalizeToAppRole(raw);
      const next = n ?? (typeof raw === 'string' && raw.trim() ? raw.trim() : null);
      setRoleName(next);
      if (n) localStorage.setItem('userRole', n);
    } catch {
      setRoleName(readInitialRoleName());
    }
  }, [location.pathname]);

  const userName =
    user?.user_name?.trim() ||
    user?.username?.trim() ||
    user?.userName?.trim() ||
    'Người dùng';

  const logout = useCallback(() => {
    try {
      authService.logout(refreshToken);
    } catch (error) {
    } finally {
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      localStorage.removeItem('franchise_cart_v1');
    }
    setRefreshToken(null);
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
      refreshToken,
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
