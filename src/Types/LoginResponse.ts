import { type Response } from './utils.type';
import type { User } from './User';

export type LoginResponse = Response<{
  access_token: string;
  refresh_token: string;
  expires: string;
  user: User;
}>;
