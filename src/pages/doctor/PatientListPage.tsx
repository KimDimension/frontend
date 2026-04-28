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
  id:                    number
  name:                  string
  phone_number:          string
  total_records:         number
  last_record_date:      string | null
  last_submitted_at:     string | null
  latest_risk_level:     'urgent' | 'caution' | 'normal' | null
  days_since_last_record: number | null
}

type RiskFilter = 'all' | 'urgent' | 'caution' | 'normal' | 'no_record'
type SortKey    = 'name' | 'last_record' | 'risk' | 'total'

/* ── 위험도 설정 ── */
const RISK_CFG = {
  urgent:  { label: '🚨 긴급', bg: C.dangerLight,  color: C.danger,  border: '#fca5a5' },
  caution: { label: '⚠️ 주의', bg: C.warningLight, color: C.warning, border: '#fcd34d' },
  normal:  { label: '✓ 정상',  bg: C.successLight, color: C.success, border: '#bbf7d0' },
} as const

/* ── 검색어 하이라이트 ── */
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

/* ── 마지막 제출 경과일 표시 ── */
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
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 8,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* 1행: 이름 + 환자번호 + 위험도 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.primaryDark }}>
          <Highlight text={p.name} query={query} />
        </span>
        <span style={{ fontSize: 11, color: C.textMuted, background: C.bg, borderRadius: 5, padding: '2px 6px', fontWeight: 600 }}>
          #{String(p.id).padStart(4, '0')}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          {p.latest_risk_level ? (
            <span style={{
              background: RISK_CFG[p.latest_risk_level].bg,
              color:      RISK_CFG[p.latest_risk_level].color,
              border:     `1px solid ${RISK_CFG[p.latest_risk_level].border}`,
              borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600,
            }}>{RISK_CFG[p.latest_risk_level].label}</span>
          ) : (
            <span style={{ fontSize: 12, color: C.textLight }}>위험도 없음</span>
          )}
        </div>
      </div>

      {/* 2행: 전화번호 + 총 기록 수 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          <Highlight text={p.phone_number} query={query} />
        </span>
        <span style={{ fontSize: 12, color: C.textMuted }}>
          {p.total_records > 0
            ? <><b style={{ color: C.text }}>{p.total_records}</b>건 기록</>
            : '기록 없음'}
        </span>
      </div>

      {/* 3행: 마지막 기록일 + 경과일 */}
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

/* ── 메인 ── */
export default function PatientListPage() {
  const navigate = useNavigate()
  const [patients,  setPatients]  = useState<PatientOverview[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [query,     setQuery]     = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [sortKey,   setSortKey]   = useState<SortKey>('name')
  const [sortDesc,  setSortDesc]  = useState(false)
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < MOBILE_BP)
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

  /* ── 필터 + 정렬 ── */
  const filtered = useMemo(() => {
    let list = patients
    // 검색
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.phone_number.includes(q))
    }
    // 위험도 필터
    if (riskFilter !== 'all') {
      if (riskFilter === 'no_record') list = list.filter(p => !p.total_records)
      else list = list.filter(p => p.latest_risk_level === riskFilter)
    }
    // 정렬
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

  /* ── 요약 수치 ── */
  const stats = useMemo(() => ({
    total:    patients.length,
    urgent:   patients.filter(p => p.latest_risk_level === 'urgent').length,
    caution:  patients.filter(p => p.latest_risk_level === 'caution').length,
    overdue:  patients.filter(p => p.days_since_last_record !== null && p.days_since_last_record >= 3).length,
    noRecord: patients.filter(p => !p.total_records).length,
  }), [patients])

  /* ── 정렬 토글 ── */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(d => !d)
    else { setSortKey(key); setSortDesc(false) }
  }
  const sortIcon = (key: SortKey) => sortKey !== key ? '↕' : sortDesc ? '↓' : '↑'

  const RISK_FILTER_TABS: { key: RiskFilter; label: string; count: number; color?: string }[] = [
    { key: 'all',       label: '전체',    count: stats.total   },
    { key: 'urgent',    label: '🚨 긴급', count: stats.urgent,  color: C.danger  },
    { key: 'caution',   label: '⚠️ 주의', count: stats.caution, color: C.warning },
    { key: 'no_record', label: '기록 없음', count: stats.noRecord },
  ]

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

        {/* 위험도 필터 탭 */}
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
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: active ? 'rgba(255,255,255,0.25)' : C.bg,
                  color: active ? '#fff' : C.textMuted,
                  borderRadius: 10, padding: '1px 5px',
                }}>{tab.count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div style={{ padding: 20, color: C.danger, fontSize: 13, background: '#fff', borderRadius: 14, border: `1px solid ${C.border}` }}>오류: {error}</div>
      )}

      {/* 로딩 */}
      {!error && loading && (
        <div style={{ padding: '40px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>불러오는 중...</div>
      )}

      {/* 빈 상태 */}
      {!error && !loading && filtered.length === 0 && (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13, background: '#fff', borderRadius: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          {query ? `"${query}"와 일치하는 환자가 없습니다` : '등록된 환자가 없습니다'}
        </div>
      )}

      {/* 환자 목록 */}
      {!error && !loading && filtered.length > 0 && (
        isMobile ? (
          /* ── 카드 ── */
          <>
            {filtered.map(p => (
              <PatientCard
                key={p.id}
                p={p}
                query={query}
                onClick={() => navigate(`/doctor/patients/${p.id}`, { state: { patientName: p.name } })}
              />
            ))}
          </>
        ) : (
          /* ── 테이블 ── */
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
                  const hovered = hoveredId === p.id
                  const isOverdue = p.days_since_last_record !== null && p.days_since_last_record >= 3
                  return (
                    <tr key={p.id}
                      style={{ borderTop: `1px solid ${C.border}`, background: hovered ? C.bg : '#fff', transition: 'background 0.1s', cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => navigate(`/doctor/patients/${p.id}`, { state: { patientName: p.name } })}
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
                        <button onClick={() => navigate(`/doctor/patients/${p.id}`, { state: { patientName: p.name } })}
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
    </main>
  )
}
