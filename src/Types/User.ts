import { type Role } from './Role';
export interface User {
  id: number;
  username: string;
  password: string;
  fullName: string;
  email: string;
  isActive: boolean;
  roles: Role[];
}
