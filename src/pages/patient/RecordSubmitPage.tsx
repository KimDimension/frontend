import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { submitRecord, DailyRecordCreate } from '../../api/records'
import RecordForm from '../../components/patient/RecordForm'

const getKoreanDate = (): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`
}

const s = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#eff1f5',
    fontFamily: "'Noto Sans KR', 'Inter', sans-serif",
  } as React.CSSProperties,
  header: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0,
    height: 52,
    backgroundColor: '#1b508a',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    zIndex: 100,
  },
  headerLogo: { color: '#fff', fontWeight: 700, fontSize: 16, flex: 1 },
  headerTitle: {
    color: '#fff',
    fontSize: 13,
    position: 'absolute' as const,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  body: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '72px 20px 40px',
  } as React.CSSProperties,
  dateTitle: { fontSize: 16, fontWeight: 700, color: '#1f1f1f', marginBottom: 4 } as React.CSSProperties,
  dateSub: { fontSize: 11, color: '#8c8c8c', marginBottom: 16 } as React.CSSProperties,
  error: { textAlign: 'center' as const, color: '#c0392b', fontSize: 12, marginBottom: 8 },
}

export default function RecordSubmitPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: DailyRecordCreate) => {
    setLoading(true)
    setError(null)
    try {
      const record = await submitRecord(data)
      navigate('/patient/survey', { state: { recordId: record.id } })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        '제출에 실패했습니다.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <span style={s.headerLogo}>CAPD</span>
        <span style={s.headerTitle}>일일 기록 제출</span>
      </header>

      <main style={s.body}>
        <p style={s.dateTitle}>{getKoreanDate()}</p>
        <p style={s.dateSub}>오늘의 CAPD 투석 기록을 입력해 주세요.</p>

        {error && <p style={s.error}>⚠ {error}</p>}

        <RecordForm onSubmit={handleSubmit} isLoading={loading} />
      </main>
    </div>
  )
}
