type Role = 'ADMIN' | 'FRANCHISE' | 'MANAGER' | 'SUPPLIER' | 'CENTRAL_KITCHEN';
export interface User {
  id: number;
  username: string;
  roles: Role[];
}
