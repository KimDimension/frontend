import client from './client'
import type { LoginRequest, TokenResponse, User } from '../types'

/**
 * 로그인 → { access_token, user_id, name, role }
 */
export async function login(email: LoginRequest['email'], password: LoginRequest['password']): Promise<TokenResponse> {
  const { data } = await client.post<TokenResponse>('/api/v1/auth/login', { email, password })
  return data
}

/**
 * 현재 로그인 유저 정보 조회
 */
export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/api/v1/auth/me')
  return data
}
