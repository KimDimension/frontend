import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

const C = {
  primary:      'var(--capd-primary)',
  primaryLight: 'var(--capd-primary-light)',
  primaryDark:  'var(--capd-primary-dark)',
  bg:           'var(--capd-bg)',
  border:       'var(--capd-border)',
  text:         '#1a1a2e',
  textMuted:    '#6b7280',
  textLight:    '#9ca3af',
  success:      '#16a34a',
  successLight: '#f0fdf4',
  warning:      '#d97706',
  warningLight: '#fffbeb',
  danger:       '#dc2626',
  dangerLight:  '#fef2f2',
}

/* ── 타입 ── */
interface PatientOverview {
  id:                     number
  name:                   string
  phone_number:           string
  total_records:          number
  last_record_date:       string | null
  last_submitted_at:      string | null
  latest_risk_level:      'urgent' | 'caution' | 'normal' | null
  days_since_last_record: number | null
}

interface DrawerProfile {
  id:            number
  name:          string
  phone_number:  string
  birth_date:    string | null
  hospital_name: string | null
  doctor_name:   string | null
  self_memo:     string | null
  joined_at:     string | null
}

type RiskFilter = 'all' | 'urgent' | 'caution' | 'normal' | 'no_record'
type SortKey    = 'name' | 'last_record' | 'risk' | 'total'

const RISK_CFG = {
  urgent:  { label: '🚨 긴급', bg: C.dangerLight,  color: C.danger,  border: '#fca5a5' },
  caution: { label: '⚠️ 주의', bg: C.warningLight, color: C.warning, border: '#fcd34d' },
  normal:  { label: '✓ 정상',  bg: C.successLight, color: C.success, border: '#bbf7d0' },
} as const

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#fde68a', color: C.text, padding: '0 1px', borderRadius: 2, fontWeight: 700 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function DaysTag({ days }: { days: number | null }) {
  if (days === null) return <span style={{ fontSize: 11, color: C.textLight }}>기록 없음</span>
  if (days === 0)    return <span style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>오늘</span>
  if (days === 1)    return <span style={{ fontSize: 11, color: C.success, fontWeight: 600 }}>어제</span>
  const color  = days >= 7 ? C.danger : days >= 3 ? C.warning : C.textMuted
  const bg     = days >= 7 ? C.dangerLight : days >= 3 ? C.warningLight : C.bg
  const border = days >= 7 ? '#fca5a5' : days >= 3 ? '#fcd34d' : C.border
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: '2px 7px' }}>
      {days}일 전{days >= 3 ? ' ⚠' : ''}
    </span>
  )
}

function formatDate(str: string | null) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ minWidth: 80, fontSize: 13, color: C.textMuted, fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: C.text, wordBreak: 'break-all' }}>{value || '—'}</span>
    </div>
  )
}

const MOBILE_BP = 768

/* ── 환자 카드 (모바일) ── */
function PatientCard({ p, query, onClick }: { p: PatientOverview; query: string; onClick: () => void }) {
  const isOverdue = p.days_since_last_record !== null && p.days_since_last_record >= 3
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: `1px solid ${isOverdue ? '#fcd34d' : C.border}`,
        borderRadius: 12, padding: '14px 16px', marginBottom: 8,
        cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.primaryDark }}>
          <Highlight text={p.name} query={query} />
        </span>
        <span style={{ fontSize: 11, color: C.textMuted, background: C.bg, borderRadius: 5, padding: '2px 6px', fontWeight: 600 }}>
          #{String(p.id).padStart(4, '0')}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          {p.latest_risk_level ? (
            <span style={{ background: RISK_CFG[p.latest_risk_level].bg, color: RISK_CFG[p.latest_risk_level].color, border: `1px solid ${RISK_CFG[p.latest_risk_level].border}`, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600 }}>
              {RISK_CFG[p.latest_risk_level].label}
            </span>
          ) : <span style={{ fontSize: 12, color: C.textLight }}>위험도 없음</span>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.textMuted }}><Highlight text={p.phone_number} query={query} /></span>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {p.total_records > 0 ? <><b style={{ color: C.text }}>{p.total_records}</b>건 기록</> : '기록 없음'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: C.textLight }}>
          {p.last_record_date
            ? new Date(p.last_record_date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
            : '기록 없음'}
        </span>
        <DaysTag days={p.days_since_last_record} />
      </div>
    </div>
  )
}

/* ═══════════════════════ 환자 상세 드로어 ═══════════════════════ */
function PatientDrawer({ patientId, onClose, navigate }: {
  patientId: number; onClose: () => void; navigate: ReturnType<typeof useNavigate>
}) {
  const [profile,  setProfile]  = useState<DrawerProfile | null>(null)
  const [note,     setNote]     = useState('')
  const [origNote, setOrigNote] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [err,      setErr]      = useState('')

  const token = () => localStorage.getItem('access_token') ?? ''

  useEffect(() => {
    setLoading(true); setErr(''); setProfile(null)
    const t = token()
    Promise.all([
      fetch(`${API}/api/v1/patients/${patientId}/profile`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => { if (!r.ok) throw new Error('프로필 오류'); return r.json() }),
      fetch(`${API}/api/v1/patients/${patientId}/note`, { headers: { Authorization: `Bearer ${t}` } })
        .then(r => { if (!r.ok) throw new Error('메모 오류'); return r.json() }),
    ])
      .then(([profileData, noteData]) => {
        setProfile(profileData)
        const c = noteData.content ?? ''
        setNote(c); setOrigNote(c)
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false))
  }, [patientId])

  const handleSaveNote = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/v1/patients/${patientId}/note`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note }),
      })
      if (!res.ok) throw new Error('저장 실패')
      setOrigNote(note); setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e: any) { alert(e.message) } finally { setSaving(false) }
  }

  const noteChanged = note !== origNote

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.28)',
          zIndex: 300,
        }}
      />

      {/* 드로어 패널 */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(480px, 92vw)',
        background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        zIndex: 301,
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.22s ease',
      }}>
        {/* 드로어 헤더 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '5px 12px', cursor: 'pointer', fontSize: 13, color: C.textMuted,
              fontFamily: 'inherit',
            }}
          >✕ 닫기</button>
          {profile && (
            <>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{profile.name} 환자</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>환자 상세 정보</div>
              </div>
              <button
                onClick={() => { onClose(); navigate(`/doctor/patients/${patientId}/records`, { state: { patientName: profile.name } }) }}
                style={{
                  marginLeft: 'auto',
                  background: C.primary, color: '#fff', border: 'none',
                  borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap',
                }}
              >
                기록 보기 →
              </button>
            </>
          )}
        </div>

        {/* 드로어 내용 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {loading && <p style={{ color: C.textMuted, fontSize: 13 }}>불러오는 중...</p>}
          {err     && <p style={{ color: C.danger,    fontSize: 13 }}>오류: {err}</p>}

          {!loading && !err && profile && (
            <>
              {/* 기본 정보 */}
              <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 18px', marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: C.text }}>기본 정보</h3>
                <InfoRow label="이름"     value={profile.name} />
                <InfoRow label="생년월일"  value={profile.birth_date ? formatDate(profile.birth_date + 'T00:00:00') : null} />
                <InfoRow label="전화번호"  value={profile.phone_number} />
                <InfoRow label="통원 병원" value={profile.hospital_name} />
                <InfoRow label="담당 의사" value={profile.doctor_name} />
                <InfoRow label="가입일"    value={profile.joined_at ? formatDate(profile.joined_at) : null} />
              </div>

              {/* 환자 자기 메모 */}
              <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 18px', marginBottom: 14 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: C.text }}>
                  환자 자기 메모
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: C.textMuted }}>환자 직접 작성</span>
                </h3>
                {profile.self_memo ? (
                  <p style={{ margin: 0, fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{profile.self_memo}</p>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: C.textMuted, fontStyle: 'italic' }}>작성된 메모가 없습니다.</p>
                )}
              </div>

              {/* 의사 메모 */}
              <div style={{ background: C.bg, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>의사 메모</h3>
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textMuted }}>환자에게 비공개 · AI 질문 생성에 활용</p>
                  </div>
                  <button
                    onClick={handleSaveNote}
                    disabled={saving || !noteChanged}
                    style={{
                      background: saved ? C.success : noteChanged ? C.primary : '#e5e7eb',
                      color: noteChanged || saved ? '#fff' : C.textMuted,
                      border: 'none', borderRadius: 7, padding: '6px 14px',
                      cursor: noteChanged ? 'pointer' : 'default',
                      fontSize: 12, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
                    }}
                  >
                    {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
                  </button>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="이 환자에 대한 임상 메모를 입력하세요."
                  rows={4}
                  style={{
                    width: '100%', padding: '11px 13px', borderRadius: 10,
                    border: `1.5px solid ${noteChanged ? C.primary : C.border}`,
                    fontSize: 13, fontFamily: 'inherit', color: C.text,
                    resize: 'vertical', outline: 'none', background: '#fafafa',
                    lineHeight: 1.7, boxSizing: 'border-box', transition: 'border-color 0.15s',
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}

/* ═══════════════════════ 메인 ═══════════════════════ */
export default function PatientListPage() {
  const navigate = useNavigate()
  const [patients,   setPatients]   = useState<PatientOverview[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [query,      setQuery]      = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortKey,    setSortKey]    = useState<SortKey>('name')
  const [sortDesc,   setSortDesc]   = useState(false)
  const [hoveredId,  setHoveredId]  = useState<number | null>(null)
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < MOBILE_BP)
  const [drawerPatientId, setDrawerPatientId] = useState<number | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BP)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { navigate('/login'); return }
    fetch(`${API}/api/v1/patients/overview`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401) { localStorage.clear(); navigate('/login'); return null }
        if (!res.ok) throw new Error('서버 오류')
        return res.json()
      })
      .then(data => { if (data) setPatients(data) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [navigate])

  const filtered = useMemo(() => {
    let list = patients
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone_number.includes(q))
    }
    if (riskFilter !== 'all') {
      if (riskFilter === 'no_record') list = list.filter(p => !p.total_records)
      else list = list.filter(p => p.latest_risk_level === riskFilter)
    }
    const RISK_RANK: Record<string, number> = { urgent: 0, caution: 1, normal: 2 }
    list = [...list].sort((a, b) => {
      let diff = 0
      if (sortKey === 'name')        diff = a.name.localeCompare(b.name, 'ko')
      if (sortKey === 'last_record') diff = (b.last_record_date ?? '').localeCompare(a.last_record_date ?? '')
      if (sortKey === 'risk')        diff = (RISK_RANK[a.latest_risk_level ?? ''] ?? 9) - (RISK_RANK[b.latest_risk_level ?? ''] ?? 9)
      if (sortKey === 'total')       diff = b.total_records - a.total_records
      return sortDesc ? -diff : diff
    })
    return list
  }, [patients, query, riskFilter, sortKey, sortDesc])

  const stats = useMemo(() => ({
    total:    patients.length,
    urgent:   patients.filter(p => p.latest_risk_level === 'urgent').length,
    caution:  patients.filter(p => p.latest_risk_level === 'caution').length,
    overdue:  patients.filter(p => p.days_since_last_record !== null && p.days_since_last_record >= 3).length,
    noRecord: patients.filter(p => !p.total_records).length,
  }), [patients])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(d => !d)
    else { setSortKey(key); setSortDesc(false) }
  }
  const sortIcon = (key: SortKey) => sortKey !== key ? '↕' : sortDesc ? '↓' : '↑'

  const RISK_FILTER_TABS: { key: RiskFilter; label: string; count: number; color?: string }[] = [
    { key: 'all',       label: '전체',    count: stats.total },
    { key: 'urgent',    label: '🚨 긴급', count: stats.urgent,  color: C.danger  },
    { key: 'caution',   label: '⚠️ 주의', count: stats.caution, color: C.warning },
    { key: 'no_record', label: '기록 없음', count: stats.noRecord },
  ]

  const openDrawer = (id: number) => setDrawerPatientId(id)
  const pad = isMobile ? '16px' : '28px 32px'

  return (
    <main style={{ padding: pad, minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: isMobile ? 14 : 22 }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 900, color: C.text, letterSpacing: '-0.04em' }}>담당 환자 관리</h1>
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 12, marginBottom: isMobile ? 14 : 22 }}>
        {[
          { label: '총 환자',     value: stats.total,   icon: '👥', color: undefined },
          { label: '긴급 (최근)', value: stats.urgent,  icon: '🚨', color: C.danger  },
          { label: '주의 (최근)', value: stats.caution, icon: '⚠️', color: C.warning },
          { label: '3일+ 미제출', value: stats.overdue, icon: '📋', color: stats.overdue > 0 ? C.warning : undefined },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: isMobile ? '12px 14px' : '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span style={{ fontSize: 11, color: C.textMuted }}>{c.label}</span>
            </div>
            <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, color: c.color ?? C.text, letterSpacing: '-0.03em', lineHeight: 1 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* 검색 + 필터 바 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: C.textMuted, pointerEvents: 'none' }}>🔍</span>
            <input
              ref={searchRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="환자 이름 또는 전화번호 검색..."
              style={{
                width: '100%', paddingLeft: 32, paddingRight: query ? 32 : 12,
                paddingTop: 8, paddingBottom: 8,
                border: `1px solid ${query ? 'var(--capd-primary)' : C.border}`,
                borderRadius: 9, fontSize: 13, outline: 'none',
                background: '#fff', color: C.text, fontFamily: 'inherit',
                boxSizing: 'border-box',
                boxShadow: query ? '0 0 0 3px var(--capd-primary-light)' : 'none',
                transition: 'all 0.15s',
              }}
            />
            {query && (
              <button onClick={() => { setQuery(''); searchRef.current?.focus() }}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 14, padding: 0 }}>✕</button>
            )}
          </div>
          <span style={{ fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap' }}>{filtered.length}명 표시</span>
        </div>

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {RISK_FILTER_TABS.map(tab => {
            const active = riskFilter === tab.key
            return (
              <button key={tab.key} onClick={() => setRiskFilter(tab.key)} style={{
                padding: '6px 11px', borderRadius: 8,
                border: `1px solid ${active ? 'var(--capd-primary)' : C.border}`,
                background: active ? 'var(--capd-primary)' : '#fff',
                color: active ? '#fff' : tab.color ?? C.textMuted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {tab.label}
                <span style={{ fontSize: 10, fontWeight: 700, background: active ? 'rgba(255,255,255,0.25)' : C.bg, color: active ? '#fff' : C.textMuted, borderRadius: 10, padding: '1px 5px' }}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div style={{ padding: 20, color: C.danger, fontSize: 13, background: '#fff', borderRadius: 14, border: `1px solid ${C.border}` }}>오류: {error}</div>
      )}

      {!error && loading && (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>불러오는 중...</div>
      )}

      {!error && !loading && filtered.length === 0 && (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13, background: '#fff', borderRadius: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          {query ? `"${query}"와 일치하는 환자가 없습니다` : '등록된 환자가 없습니다'}
        </div>
      )}

      {!error && !loading && filtered.length > 0 && (
        isMobile ? (
          <>
            {filtered.map(p => (
              <PatientCard key={p.id} p={p} query={query} onClick={() => openDrawer(p.id)} />
            ))}
          </>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '14%' }} />
                <col style={{ width: '8%'  }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: C.bg }}>
                  {[
                    { label: '환자명',      key: 'name'        as SortKey },
                    { label: '환자번호',    key: null },
                    { label: '전화번호',    key: null },
                    { label: '최근 위험도', key: 'risk'        as SortKey },
                    { label: '총 기록 수',  key: 'total'       as SortKey },
                    { label: '마지막 기록', key: 'last_record' as SortKey },
                    { label: '경과일',      key: null },
                    { label: '',            key: null },
                  ].map((h, i) => (
                    <th key={i} onClick={h.key ? () => handleSort(h.key!) : undefined}
                      style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap', cursor: h.key ? 'pointer' : 'default', userSelect: 'none' }}>
                      {h.label}{h.key && <span style={{ marginLeft: 4, opacity: 0.5 }}>{sortIcon(h.key)}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const hovered   = hoveredId === p.id
                  const isOverdue = p.days_since_last_record !== null && p.days_since_last_record >= 3
                  return (
                    <tr key={p.id}
                      style={{ borderTop: `1px solid ${C.border}`, background: hovered ? C.bg : '#fff', transition: 'background 0.1s', cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => openDrawer(p.id)}
                    >
                      <td style={{ padding: '13px 12px', fontWeight: 700, fontSize: 14, color: C.primaryDark }}>
                        <Highlight text={p.name} query={query} />
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        <span style={{ fontSize: 11, background: C.bg, color: C.textMuted, borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                          #{String(p.id).padStart(4, '0')}
                        </span>
                      </td>
                      <td style={{ padding: '13px 12px', fontSize: 12, color: C.textMuted }}>
                        <Highlight text={p.phone_number} query={query} />
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        {p.latest_risk_level ? (
                          <span style={{ background: RISK_CFG[p.latest_risk_level].bg, color: RISK_CFG[p.latest_risk_level].color, border: `1px solid ${RISK_CFG[p.latest_risk_level].border}`, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600 }}>
                            {RISK_CFG[p.latest_risk_level].label}
                          </span>
                        ) : <span style={{ fontSize: 12, color: C.textLight }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 12px' }}>
                        {p.total_records > 0
                          ? <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{p.total_records}<span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400, marginLeft: 2 }}>건</span></span>
                          : <span style={{ fontSize: 12, color: C.textLight }}>기록 없음</span>}
                      </td>
                      <td style={{ padding: '13px 12px', fontSize: 12, color: C.textMuted }}>
                        {p.last_record_date
                          ? new Date(p.last_record_date + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
                          : <span style={{ color: C.textLight }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 12px' }}><DaysTag days={p.days_since_last_record} /></td>
                      <td style={{ padding: '13px 12px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openDrawer(p.id)}
                          style={{ padding: '5px 12px', border: `1px solid ${C.border}`, borderRadius: 7, background: isOverdue ? C.warningLight : C.primaryLight, color: isOverdue ? C.warning : C.primaryDark, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          상세 보기 →
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* 우측 슬라이드 드로어 */}
      {drawerPatientId !== null && (
        <PatientDrawer
          patientId={drawerPatientId}
          onClose={() => setDrawerPatientId(null)}
          navigate={navigate}
        />
      )}
    </main>
  )
}
