import type { Location } from './Location';
import type { Role } from './Role';
import type { User } from './User';

export type LoginResponse = {
  user: User;
  role: Role;
  token: string;
};

// danh sách các response trả về khi login (MOCK)
// LƯU Ý: roleID & roleName ở đây phải khớp 1-1 với bảng Role trong DB KitchenDB_BatchMaster
// Gợi ý seed DB:
// 1 - ADMIN
// 2 - FRANCHISE
// 3 - MANAGER
// 4 - SUPPLIER
// 5 - CENTRAL_KITCHEN
//
// Record<key, value> : key: email, value: { user: User, password: string }
const mockLoginResponse: Record<string, { user: User; password: string }> = {
  'admin@example.com': {
    user: {
      userId: '1',
      userFullName: 'Admin User',
      userRoleId: { roleID: '1', roleName: 'ADMIN' } as Role,
      userLocationID: { locationID: '1', locationName: 'Head Office' } as Location,
      userEmail: 'admin@example.com',
      createdAt: new Date(),
      isActive: true,
    },
    password: 'admin123',
  },
  'franchise@example.com': {
    user: {
      userId: '2',
      userFullName: 'Nhân viên cửa hàng',
      userRoleId: { roleID: '2', roleName: 'FRANCHISE' } as Role,
      userLocationID: { locationID: '2', locationName: 'Cửa hàng Q1' } as Location,
      userEmail: 'franchise@example.com',
      createdAt: new Date(),
      isActive: true,
    },
    password: 'franchise123',
  },
  'franchise2@example.com': {
    user: {
      userId: '2b',
      userFullName: 'Nhân viên cửa hàng',
      userRoleId: { roleID: '2b', roleName: 'FRANCHISE' } as Role,
      userLocationID: { locationID: '2', locationName: 'Cửa hàng Q1' } as Location,
      userEmail: 'franchise@example.com',
      createdAt: new Date(),
      isActive: true,
    },
    password: 'franchise123',
  },
  'manager@example.com': {
    user: {
      userId: '3',
      userFullName: 'Manager User',
      userRoleId: { roleID: '3', roleName: 'MANAGER' } as Role,
      userLocationID: { locationID: '3', locationName: 'Regional Office' } as Location,
      userEmail: 'manager@example.com',
      createdAt: new Date(),
      isActive: true,
    },
    password: 'manager123',
  },
  'supplier@example.com': {
    user: {
      userId: '4',
      userFullName: 'Supplier User',
      userRoleId: { roleID: '4', roleName: 'SUPPLIER' } as Role,
      userLocationID: { locationID: '4', locationName: 'Supplier Office' } as Location,
      userEmail: 'supplier@example.com',
      createdAt: new Date(),
      isActive: true,
    },
    password: 'supplier123',
  },
  'central@example.com': {
    user: {
      userId: '5',
      userFullName: 'Nhân viên bếp trung tâm',
      userRoleId: { roleID: '5', roleName: 'CENTRAL_KITCHEN' } as Role,
      userLocationID: { locationID: '5', locationName: 'Bếp trung tâm' } as Location,
      userEmail: 'central@example.com',
      createdAt: new Date(),
      isActive: true,
    },
    password: 'central123',
  },
};
export default mockLoginResponse;
