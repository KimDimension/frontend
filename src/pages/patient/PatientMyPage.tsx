import React, { useEffect, useState } from 'react'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router'
import { useToast } from '../../hooks/useToast'
import { formatPhone, calcAge } from '../../utils/helpers'
import {
  getHospitals, getDoctors,
  patientConnectRequest, getMyPendingRequest, cancelMyRequest, patientDischargeRequest,
} from '../../api/auth'
import type { Hospital, DoctorSummary } from '../../types'
import { apiFetch } from '../../api/apiFetch'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const MOBILE_BP = 768

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

interface PatientProfile {
  id: number; name: string; phone_number: string
  birth_date: string | null; hospital_name: string | null
  doctor_name: string | null; doctor_id: number | null
  doctor_phone: string | null; doctor_hospital: string | null
  self_memo: string | null; role: string
  gender: string | null; address: string | null
}
interface PendingReq {
  id: number; request_type: string; doctor_name: string | null; status: string
}

const selectSt: React.CSSProperties = {
  padding: '9px 12px', borderRadius: 9, border: `1px solid ${C.border}`,
  fontSize: 13, fontFamily: 'inherit', color: C.text, background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box',
}

export default function PatientMyPage() {
  const navigate  = useNavigate()
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BP)
  const [profile,  setProfile]  = useState<PatientProfile | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [err,      setErr]      = useState('')

  const [editMode,    setEditMode]    = useState(false)
  const [memo,        setMemo]        = useState('')
  const [address,     setAddress]     = useState('')
  const [showPwSection, setShowPwSection] = useState(false)
  const [curPw,       setCurPw]       = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirmPw,   setConfirmPw]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const saveToast = useToast(2000)
  const errToast  = useToast(3000)
  const [formError, setFormError] = useState('')

  const [pendingReq,     setPendingReq]     = useState<PendingReq | null>(null)
  const [connectMode,    setConnectMode]    = useState(false)
  const [hospitals,      setHospitals]      = useState<Hospital[]>([])
  const [doctors,        setDoctors]        = useState<DoctorSummary[]>([])
  const [selHospital,    setSelHospital]    = useState<number | ''>('')
  const [selDoctor,      setSelDoctor]      = useState<number | ''>('')
  const [connectLoading, setConnectLoading] = useState(false)
  const [connectError,   setConnectError]   = useState('')

  const token = () => localStorage.getItem('access_token') ?? ''

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    apiFetch(`${API}/api/v1/auth/me/profile`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then(r => { if (r.status === 401) { useAuthStore.getState().logout(); navigate('/login'); return null } return r.json() })
      .then(d => { if (!d) return; setProfile(d); setMemo(d.self_memo ?? ''); setAddress(d.address ?? '') })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
    getMyPendingRequest().then(r => setPendingReq(r.request)).catch(() => {})
    getHospitals().then(setHospitals).catch(() => {})
  }, [navigate])

  const patchProfile = async (body: object) => {
    const res = await apiFetch(`${API}/api/v1/auth/me`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? '오류') }
    return res.json()
  }

  const openEdit = () => {
    if (!profile) return
    setMemo(profile.self_memo ?? '')
    setAddress(profile.address ?? '')
    setCurPw(''); setNewPw(''); setConfirmPw('')
    setShowPwSection(false); setFormError(''); setEditMode(true)
  }

  const cancelEdit = () => { setEditMode(false); setFormError('') }

  const handleSave = async () => {
    if (!profile) return
    setFormError('')
    if (!curPw) { setFormError('현재 비밀번호를 입력해주세요.'); return }
    if (showPwSection) {
      if (!newPw) { setFormError('새 비밀번호를 입력해주세요.'); return }
      if (newPw.length < 6) { setFormError('비밀번호는 6자 이상이어야 합니다.'); return }
      if (newPw !== confirmPw) { setFormError('새 비밀번호가 일치하지 않습니다.'); return }
    }
    const body: Record<string, any> = { current_password: curPw }
    if (memo !== (profile.self_memo ?? '')) body.self_memo = memo
    if (address !== (profile.address ?? '')) body.address = address
    if (showPwSection && newPw) body.new_password = newPw

    setSaving(true)
    try {
      await patchProfile(body)
      setProfile(p => p ? { ...p, self_memo: memo, address } : p)
      saveToast.show('saved')
      setEditMode(false)
    } catch (e: any) { setFormError(e.message) } finally { setSaving(false) }
  }

  const handleHospitalChange = async (id: number | '') => {
    setSelHospital(id); setSelDoctor('')
    if (!id) { setDoctors([]); return }
    try { setDoctors(await getDoctors(Number(id))) } catch { setDoctors([]) }
  }

  const handleConnectRequest = async () => {
    if (!selDoctor) { setConnectError('담당 의사를 선택해주세요.'); return }
    setConnectLoading(true); setConnectError('')
    try {
      await patientConnectRequest(Number(selDoctor))
      const r = await getMyPendingRequest(); setPendingReq(r.request)
      setConnectMode(false); setSelHospital(''); setSelDoctor('')
    } catch (e: any) { setConnectError(e?.response?.data?.detail ?? '신청에 실패했습니다.') }
    finally { setConnectLoading(false) }
  }

  const handleCancelRequest = async () => {
    if (!pendingReq || !window.confirm('신청을 취소하시겠습니까?')) return
    setConnectLoading(true)
    try { await cancelMyRequest(pendingReq.id); setPendingReq(null) }
    catch (e: any) { errToast.show(e?.response?.data?.detail ?? '취소에 실패했습니다.') }
    finally { setConnectLoading(false) }
  }

  const handleDischargeRequest = async () => {
    if (!window.confirm('담당 해제 요청을 보내시겠습니까?')) return
    setConnectLoading(true)
    try {
      await patientDischargeRequest()
      const r = await getMyPendingRequest(); setPendingReq(r.request)
    } catch (e: any) { errToast.show(e?.response?.data?.detail ?? '요청에 실패했습니다.') }
    finally { setConnectLoading(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.textMuted, fontSize: 14 }}>불러오는 중...</p>
    </div>
  )
  if (err || !profile) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: C.danger, fontSize: 14 }}>{err || '오류가 발생했습니다.'}</p>
    </div>
  )

  const age = calcAge(profile.birth_date)
  const genderLabel = profile.gender === 'm' ? '남성' : profile.gender === 'f' ? '여성' : null
  const initials = profile.name?.[0] ?? 'P'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Noto Sans KR', sans-serif" }}>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 56, background: C.primary, display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 100, boxShadow: '0 2px 8px rgba(124,58,237,0.25)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '5px 12px', fontFamily: 'inherit' }}>
          ← 뒤로
        </button>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: '-0.03em', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>마이페이지</span>
      </header>

      <main style={{ paddingTop: 72, paddingBottom: 48, paddingLeft: isMobile ? 16 : 32, paddingRight: isMobile ? 16 : 32, maxWidth: 640, margin: '0 auto' }}>

        {/* ── 프로필 + 수정 통합 카드 */}
        <div style={card}>
          {/* 헤더 */}
          <div style={{ background: '#fafafa', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                CAPD 환자{age !== null ? ` · 만 ${age}세` : ''}
              </div>
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
              <div style={rowSt}><span style={labelSt}>성별</span><span style={valueSt}>{genderLabel ?? '—'}</span></div>
              <div style={rowSt}><span style={labelSt}>통원 병원</span><span style={valueSt}>{profile.hospital_name ?? '—'}</span></div>
              <div style={rowSt}><span style={labelSt}>전화번호</span><span style={valueSt}>{formatPhone(profile.phone_number)}</span></div>
              <div style={rowSt}><span style={labelSt}>거주지</span><span style={profile.address ? valueSt : dimSt}>{profile.address || '—'}</span></div>
              <div style={rowSt}><span style={labelSt}>나의 특이사항</span><span style={profile.self_memo ? valueSt : dimSt}>{profile.self_memo || '—'}</span></div>
            </div>
          )}

          {/* 수정 모드 */}
          {editMode && (
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* 변경 불가 항목 */}
              <div style={rowSt}><span style={labelSt}>이름</span><span style={dimSt}>{profile.name} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
              <div style={rowSt}><span style={labelSt}>생년월일</span><span style={dimSt}>{profile.birth_date ?? '—'} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
              <div style={rowSt}><span style={labelSt}>성별</span><span style={dimSt}>{genderLabel ?? '—'} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
              <div style={rowSt}><span style={labelSt}>통원 병원</span><span style={dimSt}>{profile.hospital_name ?? '—'} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>
              <div style={rowSt}><span style={labelSt}>전화번호</span><span style={dimSt}>{formatPhone(profile.phone_number)} <span style={{ fontSize: 11 }}>(변경 불가)</span></span></div>

              {/* 수정 가능 항목 */}
              <div style={{ ...rowSt, alignItems: 'flex-start', paddingTop: 8, paddingBottom: 8 }}>
                <span style={{ ...labelSt, paddingTop: 12 }}>거주지</span>
                <div style={{ flex: 1, padding: '8px 8px 8px 0' }}>
                  <input
                    type="text" value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="거주지를 입력하세요"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', color: C.text, background: '#fff', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ ...rowSt, alignItems: 'flex-start', paddingTop: 8, paddingBottom: 8 }}>
                <span style={{ ...labelSt, paddingTop: 12 }}>나의 특이사항</span>
                <div style={{ flex: 1, padding: '8px 8px 8px 0' }}>
                  <textarea
                    value={memo} onChange={e => setMemo(e.target.value)}
                    placeholder="담당 의사에게 공유됩니다" rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', fontSize: 13, border: `0.5px solid ${C.border}`, borderRadius: 8, fontFamily: 'inherit', color: C.text, background: '#fff', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>

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

              {/* 현재 비밀번호 확인 */}
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

        {/* ── 담당 의사 카드 */}
        <div style={card}>
          <div style={{ padding: '14px 24px', borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: C.textMuted }}>담당 의사</span>
          </div>
          <div style={{ padding: '16px 24px' }}>
            {profile.doctor_name && !pendingReq && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#059669', flexShrink: 0 }}>
                    {profile.doctor_name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{profile.doctor_name} 선생님</div>
                    {profile.doctor_hospital && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{profile.doctor_hospital}</div>}
                    {profile.doctor_phone && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 1 }}>{formatPhone(profile.doctor_phone)}</div>}
                  </div>
                </div>
                <button onClick={handleDischargeRequest} disabled={connectLoading}
                  style={{ width: '100%', padding: '9px', border: `0.5px solid #fca5a5`, borderRadius: 20, background: 'transparent', fontSize: 13, color: C.danger, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {connectLoading ? '처리 중...' : '담당 해제 요청'}
                </button>
              </>
            )}
            {pendingReq && (
              <>
                <div style={{ background: '#fffbeb', border: '0.5px solid #fcd34d', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>
                    {pendingReq.request_type === 'connect' ? '⏳ 연결 신청 대기 중' : '⏳ 해제 요청 대기 중'}
                  </div>
                  {pendingReq.doctor_name && <div style={{ fontSize: 13, color: C.text }}>의사: {pendingReq.doctor_name}</div>}
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>담당 의사의 승인을 기다리는 중입니다.</div>
                </div>
                <button onClick={handleCancelRequest} disabled={connectLoading}
                  style={{ width: '100%', padding: '9px', border: `0.5px solid ${C.border}`, borderRadius: 20, background: 'transparent', fontSize: 13, color: C.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {connectLoading ? '취소 중...' : '신청 취소'}
                </button>
              </>
            )}
            {!profile.doctor_name && !pendingReq && !connectMode && (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
                  담당 의사가 없습니다. 연결하면 기록 제출 및 AI 분석을 이용할 수 있습니다.
                </p>
                <button onClick={() => setConnectMode(true)}
                  style={{ width: '100%', padding: '9px', border: `0.5px solid ${C.primary}`, borderRadius: 20, background: 'transparent', fontSize: 13, color: C.primary, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                  + 담당 의사 연결 신청
                </button>
              </>
            )}
            {connectMode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: C.textMuted }}>병원 선택</label>
                  <select value={selHospital} onChange={e => handleHospitalChange(Number(e.target.value) || '')} style={selectSt}>
                    <option value="">병원을 선택하세요</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 12, color: C.textMuted }}>담당 의사 선택</label>
                  <select value={selDoctor} onChange={e => setSelDoctor(Number(e.target.value) || '')}
                    disabled={!selHospital} style={{ ...selectSt, opacity: !selHospital ? 0.6 : 1 }}>
                    <option value="">{selHospital ? '담당 의사를 선택하세요' : '먼저 병원을 선택하세요'}</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                {connectError && <p style={{ margin: 0, fontSize: 12, color: C.danger }}>{connectError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setConnectMode(false); setConnectError(''); setSelHospital(''); setSelDoctor('') }}
                    style={{ flex: 1, padding: '9px', border: `0.5px solid ${C.border}`, borderRadius: 20, background: 'transparent', fontSize: 13, color: C.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
                  <button onClick={handleConnectRequest} disabled={connectLoading || !selDoctor}
                    style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 20, background: (connectLoading || !selDoctor) ? '#e5e7eb' : C.primary, color: (connectLoading || !selDoctor) ? C.textMuted : '#fff', fontSize: 13, cursor: (connectLoading || !selDoctor) ? 'default' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                    {connectLoading ? '신청 중...' : '연결 신청'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {saveToast.message && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a2e', color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, zIndex: 999 }}>
            ✓ 저장되었습니다
          </div>
        )}
        {errToast.message && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.danger, color: '#fff', borderRadius: 10, padding: '10px 20px', fontSize: 13, zIndex: 999 }}>
            {errToast.message}
          </div>
        )}
      </main>
    </div>
  )
}
