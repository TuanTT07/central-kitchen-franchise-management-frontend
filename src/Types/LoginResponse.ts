import type { User } from './User';

export interface LoginPayload {
  user: User;
  access_token: string;
  refresh_token: string;
  expires: string;
}

export interface LoginResponse {
  message: string;
  data: LoginPayload;
}
