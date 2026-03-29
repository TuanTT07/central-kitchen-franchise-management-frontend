/**
 * Cấu hình phân trang theo vai trò.
 * Mỗi role một key localStorage riêng (tránh lỗi merge/ghi object lồng nhau).
 * Vẫn ghi thêm blob JSON cũ để tương thích / đọc một lần khi migrate.
 */

import { Role, type Role as RoleType } from '@/Types';
import { normalizeToAppRole } from '@/lib/authRole';

/** Blob legacy (một object pageSizeByRole) */
const LEGACY_BLOB_KEY = 'swp_admin_pagination_v1';
/** Một key cho mỗi role — nguồn đọc ưu tiên */
const PER_ROLE_PREFIX = 'swp_list_page_size_';

export const ADMIN_PAGINATION_CHANGED_EVENT = 'swp-admin-pagination-changed';

const ALL_ROLES: RoleType[] = [
  Role.ADMIN,
  Role.FRANCHISE_STORE_STAFF,
  Role.MANAGER,
  Role.SUPPLY_COORDINATOR,
  Role.CENTRAL_KITCHEN_STAFF,
];

export type AdminPaginationPrefs = {
  pageSizeByRole: Record<RoleType, number>;
};

function defaultPageSizeByRole(): Record<RoleType, number> {
  return {
    [Role.ADMIN]: 10,
    [Role.FRANCHISE_STORE_STAFF]: 10,
    [Role.MANAGER]: 10,
    [Role.SUPPLY_COORDINATOR]: 10,
    [Role.CENTRAL_KITCHEN_STAFF]: 10,
  };
}

const DEFAULTS: AdminPaginationPrefs = {
  pageSizeByRole: defaultPageSizeByRole(),
};

/** Giới hạn 5–100 */
export function clampAdminPageSize(n: number): number {
  if (!Number.isFinite(n) || n < 5) return 5;
  if (n > 100) return 100;
  return Math.floor(n);
}

function normalizePageSizeByRole(
  partial: Partial<Record<RoleType, number>> | undefined | null
): Record<RoleType, number> {
  const base = defaultPageSizeByRole();
  if (!partial || typeof partial !== 'object' || Array.isArray(partial)) {
    return base;
  }

  const fromEntries = new Map<RoleType, number>();
  for (const [rawKey, rawVal] of Object.entries(partial as Record<string, unknown>)) {
    const keyNorm = String(rawKey).trim().toUpperCase().replace(/[\s-]+/g, '_') as RoleType;
    if (!ALL_ROLES.includes(keyNorm)) continue;

    const n =
      typeof rawVal === 'number'
        ? rawVal
        : typeof rawVal === 'string'
          ? parseFloat(rawVal)
          : Number(rawVal);

    if (!Number.isFinite(n) || n <= 0) continue;
    fromEntries.set(keyNorm, clampAdminPageSize(n));
  }

  for (const r of ALL_ROLES) {
    const picked = fromEntries.get(r);
    if (picked !== undefined) base[r] = picked;
  }
  return base;
}

/** Migrate legacy: pageSizeUsers / pageSizeStores / pageSizeGlobal */
function migrateLegacyParsed(parsed: Record<string, unknown>): AdminPaginationPrefs | null {
  const ps = parsed.pageSizeByRole;
  if (ps != null && typeof ps === 'object' && !Array.isArray(ps)) {
    return null;
  }
  const g = Number(parsed.pageSizeGlobal);
  const u = Number(parsed.pageSizeUsers);
  const s = Number(parsed.pageSizeStores);
  const seed = clampAdminPageSize(
    [g, u, s].find((x) => Number.isFinite(x) && x > 0) ?? DEFAULTS.pageSizeByRole[Role.ADMIN]
  );
  return {
    pageSizeByRole: {
      [Role.ADMIN]: seed,
      [Role.FRANCHISE_STORE_STAFF]: seed,
      [Role.MANAGER]: seed,
      [Role.SUPPLY_COORDINATOR]: seed,
      [Role.CENTRAL_KITCHEN_STAFF]: seed,
    },
  };
}

/** Đọc từ các key swp_list_page_size_<ROLE> (ưu tiên) */
function readPerRoleKeys(): Record<RoleType, number> | null {
  const out = defaultPageSizeByRole();
  let any = false;
  for (const r of ALL_ROLES) {
    const raw = localStorage.getItem(PER_ROLE_PREFIX + r);
    if (raw == null || raw === '') continue;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) continue;
    out[r] = clampAdminPageSize(n);
    any = true;
  }
  return any ? out : null;
}

/** Ghi từng key per-role */
function writePerRoleKeys(map: Record<RoleType, number>): void {
  for (const r of ALL_ROLES) {
    localStorage.setItem(PER_ROLE_PREFIX + r, String(map[r]));
  }
}

/** Đọc blob JSON cũ (không có per-key hoặc migrate lần đầu) */
function loadFromLegacyBlob(): AdminPaginationPrefs | null {
  try {
    const raw = localStorage.getItem(LEGACY_BLOB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const migrated = migrateLegacyParsed(parsed);
    if (migrated) {
      return { pageSizeByRole: normalizePageSizeByRole(migrated.pageSizeByRole) };
    }
    const byRole = parsed.pageSizeByRole as Partial<Record<RoleType, number>> | undefined;
    return { pageSizeByRole: normalizePageSizeByRole(byRole) };
  } catch {
    return null;
  }
}

export function loadAdminPaginationPrefs(): AdminPaginationPrefs {
  const fromKeys = readPerRoleKeys();
  if (fromKeys) {
    return { pageSizeByRole: fromKeys };
  }

  const fromBlob = loadFromLegacyBlob();
  if (fromBlob) {
    writePerRoleKeys(fromBlob.pageSizeByRole);
    return fromBlob;
  }

  return { pageSizeByRole: defaultPageSizeByRole() };
}

export function saveAdminPaginationPrefs(prefs: AdminPaginationPrefs): void {
  const merged = defaultPageSizeByRole();
  const input = prefs.pageSizeByRole;
  for (const r of ALL_ROLES) {
    const v = input[r];
    if (v === undefined || v === null) continue;
    const n = typeof v === 'number' ? v : parseFloat(String(v).trim());
    if (!Number.isFinite(n) || n <= 0) continue;
    merged[r] = clampAdminPageSize(n);
  }

  writePerRoleKeys(merged);

  const normalized: AdminPaginationPrefs = { pageSizeByRole: merged };
  localStorage.setItem(LEGACY_BLOB_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(ADMIN_PAGINATION_CHANGED_EVENT, { detail: normalized }));
}

export function getListPageSizeForRole(role: string | null | undefined): number {
  const prefs = loadAdminPaginationPrefs();
  const key = normalizeToAppRole(role);
  if (key) return prefs.pageSizeByRole[key];
  return prefs.pageSizeByRole[Role.ADMIN];
}

export { ALL_ROLES };
