import client from './client'

/**
 * 로그인 → { access_token, user_id, name, role }
 */
export async function login(email, password) {
  const { data } = await client.post('/api/v1/auth/login', { email, password })
  return data
}

/**
 * 현재 로그인 유저 정보 조회
 */
export async function getMe() {
  const { data } = await client.get('/api/v1/auth/me')
  return data
}
