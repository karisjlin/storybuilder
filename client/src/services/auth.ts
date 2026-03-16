import api from './api';
import { AuthResponse, User } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', { username, email, password });
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>('/auth/me');
  return response.data;
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
