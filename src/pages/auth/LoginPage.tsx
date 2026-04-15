import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const role = await login(email, password)
      if (role === 'doctor') navigate('/doctor')
      else navigate('/patient')
    } catch {
      // 에러는 store에서 처리
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* 로고 / 타이틀 */}
        <div className={styles.header}>
          <h1 className={styles.title}>CAPD</h1>
          <p className={styles.subtitle}>복막투석 일일 기록 관리 시스템</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">이메일</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={isLoading}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 개발용 테스트 계정 안내 */}
        <div className={styles.devNote}>
          <p>테스트 계정</p>
          <p>의사: doctor@test.com / test1234</p>
          <p>환자: patient@test.com / test1234</p>
        </div>
      </div>
    </div>
  )
}
