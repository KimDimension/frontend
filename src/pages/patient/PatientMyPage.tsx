/**
 * PatientMyPage — 환자 마이페이지
 * 경로: /patient/mypage
 *
 * - 프로필 정보 조회 (이름/생년월일/병원/담당의/전화번호)
 * - 자기 특이사항 메모 작성/수정 (AI 질문 생성에 활용됨)
 * - 전화번호 변경
 * - 비밀번호 변경
 */
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const C = {
  primary:      'var(--capd-primary)',
  primaryLight: 'var(--capd-primary-light)',
  bg:           'var(--capd-bg)',
  border:       'var(--capd-border)',
  text:         '#1a1a2e',
  textMuted:    '#6b7280',
  success:      '#16a34a',
  successLight: '#f0fdf4',
  danger:       '#dc2626',
}

interface PatientProfile {
  id:            number
  name:          string
  phone_number:  string
  birth_date:    string | null
  hospital_name: string | null
  doctor_name:   string | null
  self_memo:     string | null
  role:          string
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ minWidth: 90, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text }}>{value || '—'}</span>
    </div>
  )
}

function Field({ label, type='text', value, onChange, placeholder }: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding: '10px 13px', borderRadius: 9,
          border: `1.5px solid ${focused ? C.primary : C.border}`,
          fontSize: 13, fontFamily: 'inherit', color: C.text,
          background: '#fff', outline: 'none', transition: 'border-color 0.15s',
        }}
      />
    </div>
  )
}

export default function PatientMyPage() {
  const navigate = useNavigate()
  const [profile,   setProfile]   = useState<PatientProfile | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  // 자기 메모
  const [memo,      setMemo]      = useState('')
  const [origMemo,  setOrigMemo]  = useState('')
  const [memoSaving,setMemoSaving]= useState(false)
  const [memoSaved, setMemoSaved] = useState(false)

  // 전화번호
  const [newPhone,     setNewPhone]     = useState('')
  const [phoneSaving,  setPhoneSaving]  = useState(false)
  const [phoneSaved,   setPhoneSaved]   = useState(false)
  const [phoneError,   setPhoneError]   = useState('')

  // 비밀번호
  const [curPw,     setCurPw]     = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)
  const [pwSaved,   setPwSaved]   = useState(false)
  const [pwError,   setPwError]   = useState('')

  const token = () => localStorage.getItem('access_token') ?? ''

  useEffect(() => {
    fetch(`${API}/api/v1/auth/me/profile`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => { if (r.status === 401) { localStorage.clear(); navigate('/login'); return null } return r.json() })
      .then(d => {
        if (d) {
          setProfile(d)
          setNewPhone(d.phone_number)
          const m = d.self_memo ?? ''
          setMemo(m); setOrigMemo(m)
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [navigate])

  const patch = async (body: object) => {
    const res = await fetch(`${API}/api/v1/auth/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? '오류') }
    return res.json()
  }

  const saveMemo = async () => {
    setMemoSaving(true)
    try {
      await patch({ self_memo: memo })
      setOrigMemo(memo)
      setMemoSaved(true); setTimeout(() => setMemoSaved(false), 2000)
    } catch { /* ignore */ } finally { setMemoSaving(false) }
  }

  const savePhone = async () => {
    setPhoneError(''); setPhoneSaving(true)
    try {
      await patch({ phone_number: newPhone })
      setProfile(p => p ? { ...p, phone_number: newPhone } : p)
      setPhoneSaved(true); setTimeout(() => setPhoneSaved(false), 2000)
    } catch (e: any) { setPhoneError(e.message) } finally { setPhoneSaving(false) }
  }

  const savePassword = async () => {
    setPwError('')
    if (newPw !== confirmPw) { setPwError('새 비밀번호가 일치하지 않습니다.'); return }
    if (newPw.length < 6)    { setPwError('비밀번호는 6자 이상이어야 합니다.'); return }
    setPwSaving(true)
    try {
      await patch({ current_password: curPw, new_password: newPw })
      setCurPw(''); setNewPw(''); setConfirmPw('')
      setPwSaved(true); setTimeout(() => setPwSaved(false), 2000)
    } catch (e: any) { setPwError(e.message) } finally { setPwSaving(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.textMuted, fontSize: 14 }}>불러오는 중...</p>
    </div>
  )
  if (error || !profile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.danger, fontSize: 14 }}>{error || '오류가 발생했습니다.'}</p>
    </div>
  )

  const memoChanged = memo !== origMemo
  const cardStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`,
    padding: '20px 24px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  }
  const btn = (disabled: boolean, saved: boolean): React.CSSProperties => ({
    padding: '9px 20px', borderRadius: 9, border: 'none',
    background: saved ? C.success : disabled ? '#e5e7eb' : C.primary,
    color: saved || !disabled ? '#fff' : C.textMuted,
    fontSize: 13, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Noto Sans KR', sans-serif" }}>
      {/* 헤더 */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: C.primary, display: 'flex', alignItems: 'center',
        padding: '0 20px', zIndex: 100, boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
      }}>
        <button
          onClick={() => navigate('/patient')}
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '5px 12px', fontFamily: 'inherit' }}
        >← 뒤로</button>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          마이페이지
        </span>
      </header>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '72px 16px 48px' }}>

        {/* 프로필 정보 */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: C.text }}>내 정보</h2>
          <InfoRow label="이름"     value={profile.name} />
          <InfoRow label="생년월일" value={profile.birth_date ?? undefined} />
          <InfoRow label="소속 병원" value={profile.hospital_name ?? undefined} />
          <InfoRow label="담당 의사" value={profile.doctor_name ?? undefined} />
          <InfoRow label="전화번호" value={profile.phone_number} />
        </div>

        {/* 자기 메모 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>나의 특이사항</h2>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textMuted }}>담당 의사에게도 공유되며, AI 맞춤 질문 생성에 활용됩니다</p>
            </div>
            <button onClick={saveMemo} disabled={memoSaving || !memoChanged} style={btn(memoSaving || !memoChanged, memoSaved)}>
              {memoSaving ? '저장 중...' : memoSaved ? '✓ 저장됨' : '저장'}
            </button>
          </div>
          <textarea
            value={memo}
            onChange={e => setMemo(e.target.value)}
            placeholder="평소 특이사항을 자유롭게 적어주세요. (예: 최근 식욕 감소, 수면 부족, 다리 부종 있음)"
            rows={4}
            style={{
              width: '100%', padding: '11px 13px', borderRadius: 10,
              border: `1.5px solid ${memoChanged ? C.primary : C.border}`,
              fontSize: 13, fontFamily: 'inherit', color: C.text,
              resize: 'vertical', outline: 'none', background: '#fafafa',
              lineHeight: 1.7, boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
          />
        </div>

        {/* 전화번호 변경 */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: C.text }}>전화번호 변경</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Field label="새 전화번호" type="tel" value={newPhone}
                onChange={setNewPhone} placeholder="010-0000-0000" />
            </div>
            <button
              onClick={savePhone}
              disabled={phoneSaving || newPhone === profile.phone_number}
              style={btn(phoneSaving || newPhone === profile.phone_number, phoneSaved)}
            >
              {phoneSaving ? '저장 중...' : phoneSaved ? '✓ 저장됨' : '변경'}
            </button>
          </div>
          {phoneError && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.danger }}>{phoneError}</p>}
        </div>

        {/* 비밀번호 변경 */}
        <div style={cardStyle}>
          <h2 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 800, color: C.text }}>비밀번호 변경</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="현재 비밀번호" type="password" value={curPw}
              onChange={setCurPw} placeholder="현재 비밀번호" />
            <Field label="새 비밀번호" type="password" value={newPw}
              onChange={setNewPw} placeholder="6자 이상" />
            <Field label="새 비밀번호 확인" type="password" value={confirmPw}
              onChange={setConfirmPw} placeholder="새 비밀번호 재입력" />
            {pwError && <p style={{ margin: 0, fontSize: 12, color: C.danger }}>{pwError}</p>}
            <button
              onClick={savePassword}
              disabled={pwSaving || !curPw || !newPw || !confirmPw}
              style={{ ...btn(pwSaving || !curPw || !newPw || !confirmPw, pwSaved), alignSelf: 'flex-end' }}
            >
              {pwSaving ? '변경 중...' : pwSaved ? '✓ 변경 완료' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
