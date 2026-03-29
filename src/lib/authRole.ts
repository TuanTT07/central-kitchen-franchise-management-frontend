import { Role, type Role as RoleType } from '@/Types';

const APP_ROLE_VALUES = new Set<string>(Object.values(Role));

/** Khớp bảng role trong `UserManagementPage` / BE thường trả roleId */
const ROLE_ID_TO_APP: Record<number, RoleType> = {
  1: Role.ADMIN,
  2: Role.FRANCHISE_STORE_STAFF,
  3: Role.MANAGER,
  4: Role.SUPPLY_COORDINATOR,
  5: Role.CENTRAL_KITCHEN_STAFF,
};

function roleIdToAppRole(id: unknown): RoleType | null {
  const n = typeof id === 'number' ? id : typeof id === 'string' && /^\d+$/.test(id.trim()) ? parseInt(id.trim(), 10) : NaN;
  if (!Number.isFinite(n)) return null;
  return ROLE_ID_TO_APP[n] ?? null;
}

/**
 * Lấy chuỗi role đầu tiên từ payload user sau login.
 * Hỗ trợ: roles[] string | number | object có roleId/authority, role string, roleId top-level.
 */
export function extractPrimaryRoleFromLoginUser(user: unknown): string {
  if (!user || typeof user !== 'object') return '';
  const u = user as Record<string, unknown>;

  const roles = u.roles;
  if (Array.isArray(roles) && roles.length > 0) {
    const first = roles[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (typeof first === 'number' || (typeof first === 'string' && /^\d+$/.test(String(first).trim()))) {
      const mapped = roleIdToAppRole(first);
      if (mapped) return mapped;
    }
    if (first && typeof first === 'object') {
      const o = first as Record<string, unknown>;
      const fromId = roleIdToAppRole(o.roleId ?? o.id ?? o.role_id);
      if (fromId) return fromId;
      const v = o.authority ?? o.name ?? o.roleName ?? o.role ?? o.code ?? o.roleCode;
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }

  const single = u.role;
  if (typeof single === 'string' && single.trim()) return single.trim();
  if (typeof single === 'number') {
    const mapped = roleIdToAppRole(single);
    if (mapped) return mapped;
  }

  const topRid = u.roleId ?? u.role_id;
  const fromTop = roleIdToAppRole(topRid);
  if (fromTop) return fromTop;

  return '';
}

/**
 * Chuẩn hóa chuỗi từ JWT/BE về key Role trong app (để khớp pageSizeByRole).
 */
export function normalizeToAppRole(raw: string | null | undefined): RoleType | null {
  if (!raw || typeof raw !== 'string') return null;

  let k = raw
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/i, '')
    .replace(/[\s-]+/g, '_');

  if (APP_ROLE_VALUES.has(k)) return k as RoleType;

  const aliases: Record<string, RoleType> = {
    SUPPLY: Role.SUPPLY_COORDINATOR,
    FRANCHISE: Role.FRANCHISE_STORE_STAFF,
    FRANCHISE_STORE: Role.FRANCHISE_STORE_STAFF,
    STORE_STAFF: Role.FRANCHISE_STORE_STAFF,
    CENTRAL_KITCHEN: Role.CENTRAL_KITCHEN_STAFF,
    KITCHEN: Role.CENTRAL_KITCHEN_STAFF,
    KITCHEN_STAFF: Role.CENTRAL_KITCHEN_STAFF,
  };

  return aliases[k] ?? null;
}
