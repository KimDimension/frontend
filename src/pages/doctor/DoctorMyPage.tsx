import React, { useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router'
import { useToast } from '../../hooks/useToast'
import { formatPhone } from '../../utils/helpers'
import { apiFetch } from '../../api/apiFetch'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const C = {
  primary:      'var(--capd-primary)',
  primaryLight: 'var(--capd-primary-light)',
  bg:           'var(--capd-bg)',
  border:       '#e5e7eb',
  text:         '#1a1a2e',
  textMuted:    '#6b7280',
  textLight:    '#9ca3af',
  success:      '#16a34a',
  danger:       '#dc2626',
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  border: `0.5px solid ${C.border}`,
  overflow: 'hidden',
  marginBottom: 14,
}

const rowSt: React.CSSProperties = {
  display: 'flex',
  borderTop: `0.5px solid ${C.border}`,
}

const labelSt: React.CSSProperties = {
  width: 110,
  flexShrink: 0,
  padding: '12px 16px',
  fontSize: 13,
  color: C.textMuted,
}

const valueSt: React.CSSProperties = {
  flex: 1,
  padding: '12px 8px',
  fontSize: 13,
  color: C.text,
  fontWeight: 500,
}

const dimSt: React.CSSProperties = {
  ...valueSt,
  color: C.textLight,
  fontWeight: 400,
}

interface DoctorProfile {
  id: number; name: string; phone_number: string
  birth_date: string | null; license_number: string | null
  hospital_name: string | null; role: string
}

export default function DoctorMyPage() {
  const navigate   = useNavigate()
  const [profile,  setProfile]  = useState<DoctorProfile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [err,      setErr]      = useState('')

  const [editMode,       setEditMode]       = useState(false)
  const [showPwSection,  setShowPwSection]  = useState(false)
  const [curPw,          setCurPw]          = useState('')
  const [newPw,          setNewPw]          = useState('')
  const [confirmPw,      setConfirmPw]      = useState('')
  const [saving,         setSaving]         = useState(false)
  const saveToast = useToast(2000)
  const [formError,      setFormError]      = useState('')

  const token = () => localStorage.getItem('access_token') ?? ''

  useEffect(() => {
    apiFetch(`${API}/api/v1/auth/me/profile`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => { if (r.status === 401) { useAuthStore.getState().logout(); navigate('/login'); return null } return r.json() })
      .then(d => { if (d) setProfile(d) })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [navigate])

  const patch = async (body: object) => {
    const res = await apiFetch(`${API}/api/v1/auth/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? '오류') }
    return res.json()
  }

  const openEdit = () => {
    setCurPw(''); setNewPw(''); setConfirmPw('')
    setShowPwSection(false); setFormError(''); setEditMode(true)
  }

  const cancelEdit = () => { setEditMode(false); setFormError('') }

  const handleSave = async () => {
    setFormError('')
    if (!curPw) { setFormError('현재 비밀번호를 입력해주세요.'); return }
    if (showPwSection) {
      if (!newPw) { setFormError('새 비밀번호를 입력해주세요.'); return }
      if (newPw.length < 6) { setFormError('비밀번호는 6자 이상이어야 합니다.'); return }
      if (newPw !== confirmPw) { setFormError('새 비밀번호가 일치하지 않습니다.'); return }
    }
    if (!showPwSection) { setEditMode(false); return }

    const body: Record<string, any> = { current_password: curPw }
    if (showPwSection && newPw) body.new_password = newPw

    setSaving(true)
    try {
      await patch(body)
      saveToast.show('saved')
      setEditMode(false)
    } catch (e: any) { setFormError(e.message) } finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding: 40, color: C.textMuted, fontSize: 14 }}>불러오는 중...</div>
  if (err || !profile) return <div style={{ padding: 40, color: C.danger, fontSize: 14 }}>{err || '오류가 발생했습니다.'}</div>

  const initials = profile.name?.[0] ?? 'D'

  return (
    <div style={{ padding: '28px 24px', maxWidth: 640, fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.04em' }}>마이페이지</h1>
      </div>

      {/* ── 프로필 + 수정 통합 카드 */}
      <div style={card}>
        {/* 헤더 */}
        <div style={{ background: '#fafafa', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `0.5px solid ${C.border}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{profile.name} 선생님</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>신장분과전문의</div>
          </div>
          <button
            onClick={editMode ? cancelEdit : openEdit}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', border: `0.5px solid ${C.border}`, borderRadius: 20, background: 'transparent', cursor: 'pointer', fontSize: 13, color: C.textMuted, fontFamily: 'inherit' }}
          >
            {editMode ? '✕ 닫기' : '✏ 수정'}
          </button>
        </div>

        {/* 보기 모드 */}
        {!editMode && (
          <div>
            <div style={rowSt}><span style={labelSt}>이름</span><span style={valueSt}>{profile.name}</span></div>
            <div style={rowSt}><span style={labelSt}>생년월일</span><span style={valueSt}>{profile.birth_date ?? '—'}</span></div>
            <div style={rowSt}><span style={labelSt}>자격번호</span><span style={valueSt}>{profile.license_number ?? '—'}</span></div>
            <div style={rowSt}><span style={labelSt}>소속 병원</span><span style={valueSt}>{profile.hospital_name ?? '—'}</span></div>
            <div style={rowSt}><span style={labelSt}>전화번호</span><span style={valueSt}>{formatPhone(profile.phone_number)}</span></div>
          </div>
        )}

        {/* 수정 모드 */}
        {editMode && (
          <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* 모든 항목 변경 불가 */}
            <div style={rowSt}><span style={labelSt}>이름</span><span style={dimSt}>{profile.name} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
            <div style={rowSt}><span style={labelSt}>생년월일</span><span style={dimSt}>{profile.birth_date ?? '—'} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
            <div style={rowSt}><span style={labelSt}>자격번호</span><span style={dimSt}>{profile.license_number ?? '—'} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
            <div style={rowSt}><span style={labelSt}>소속 병원</span><span style={dimSt}>{profile.hospital_name ?? '—'} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
            <div style={rowSt}><span style={labelSt}>전화번호</span><span style={dimSt}>{formatPhone(profile.phone_number)} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>

            {/* 비밀번호 변경 토글 */}
            <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 14, marginTop: 6 }}>
              <button
                onClick={() => setShowPwSection(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.text, fontFamily: 'inherit' }}
              >
                <span>🔒 비밀번호 변경</span>
                <span style={{ fontSize: 12, color: C.textMuted, transform: showPwSection ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▾</span>
              </button>
              {showPwSection && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호 (6자 이상)"
                    style={{ padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="새 비밀번호 확인"
                    style={{ padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
                </div>
              )}
            </div>

            {/* 현재 비밀번호 */}
            <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 14, marginTop: 8 }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: C.textMuted }}>변경사항을 저장하려면 현재 비밀번호를 입력하세요</p>
              <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="현재 비밀번호"
                style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', color: C.text, background: '#fff', outline: 'none' }} />
            </div>

            {formError && <p style={{ margin: '8px 0 0', fontSize: 12, color: C.danger }}>{formError}</p>}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={cancelEdit} style={{ flex: 1, padding: '10px', border: `0.5px solid ${C.border}`, borderRadius: 20, background: 'transparent', cursor: 'pointer', fontSize: 13, color: C.textMuted, fontFamily: 'inherit' }}>취소</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 20, background: saving ? '#e5e7eb' : C.primary, color: saving ? C.textMuted : '#fff', fontSize: 13, fontWeight: 500, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      {saveToast.message && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, zIndex: 999 }}>
          ✓ 저장되었습니다
        </div>
      )}
    </div>
  )
}
