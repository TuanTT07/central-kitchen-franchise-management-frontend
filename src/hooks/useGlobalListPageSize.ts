import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ADMIN_PAGINATION_CHANGED_EVENT,
  getListPageSizeForRole,
} from '@/lib/adminPaginationSettings';

/**
 * Kích thước trang theo vai trò đang đăng nhập (cấu hình tại Admin → Phân trang).
 */
export function useGlobalListPageSize(): number {
  const { roleName } = useAuth();
  const [size, setSize] = useState(() => getListPageSizeForRole(roleName));

  useEffect(() => {
    setSize(getListPageSizeForRole(roleName));
  }, [roleName]);

  useEffect(() => {
    const onChange = () => setSize(getListPageSizeForRole(roleName));
    window.addEventListener(ADMIN_PAGINATION_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ADMIN_PAGINATION_CHANGED_EVENT, onChange);
  }, [roleName]);

  return size;
}
