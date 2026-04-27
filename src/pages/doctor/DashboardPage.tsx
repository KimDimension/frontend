import React, { useEffect, useState, useCallback } from "react";
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
interface PatientInfo {
  id:           number
  name:         string
  phone_number: string
}

interface TodayRecord {
  record_id:           number
  patient_id:          number
  patient_name:        string
  status:              string
  risk_level:          'urgent' | 'caution' | 'normal' | null
  ai_summary:          string | null
  unreviewed_ai_count: number
}

interface DashboardStats {
  total_submitted: number
  pending_count:   number
  approved_count:  number
  total_patients:  number
  records:         TodayRecord[]
  patients:        PatientInfo[]
}

/* ── 위험도 설정 ── */
const RISK_CONFIG = {
  urgent:  { label: '🚨 긴급', bg: C.dangerLight,  color: C.danger,  border: '#fca5a5' },
  caution: { label: '⚠️ 주의', bg: C.warningLight, color: C.warning, border: '#fcd34d' },
  normal:  { label: '✓ 정상',  bg: C.successLight, color: C.success, border: '#bbf7d0' },
} as const

/* ── 날짜 유틸 ── */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function isToday(d: Date): boolean {
  return toDateStr(d) === toDateStr(new Date())
}
function isFuture(d: Date): boolean {
  return toDateStr(d) > toDateStr(new Date())
}
function formatDateKo(d: Date): string {
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
}
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

/* ── 상태 뱃지 ── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    submitted: { label: '미검토',   bg: C.dangerLight,  color: C.danger  },
    reviewed:  { label: '승인 완료', bg: C.successLight, color: C.success },
    rejected:  { label: '반려',     bg: '#f3f4f6',       color: C.textMuted },
  }
  const cfg = map[status] ?? { label: status, bg: '#f3f4f6', color: C.textMuted }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600 }}>
      {cfg.label}
    </span>
  )
}

/* ── 위험도 뱃지 ── */
function RiskBadge({ level }: { level: 'urgent' | 'caution' | 'normal' | null }) {
  if (!level) return <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
  const cfg = RISK_CONFIG[level]
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600 }}>
      {cfg.label}
    </span>
  )
}

/* ── 통계 카드 ── */
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: string
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`,
      padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
        <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color ?? C.text, lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted }}>{sub}</div>}
    </div>
  )
}

/* ── 위험도 도넛 차트 (CSS) ── */
function RiskDonut({ records }: { records: TodayRecord[] }) {
  const withLevel = records.filter(r => r.risk_level)
  const urgent  = withLevel.filter(r => r.risk_level === 'urgent').length
  const caution = withLevel.filter(r => r.risk_level === 'caution').length
  const normal  = withLevel.filter(r => r.risk_level === 'normal').length
  const total   = urgent + caution + normal

  if (total === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100 }}>
        <p style={{ color: C.textLight, fontSize: 12 }}>데이터 없음</p>
      </div>
    )
  }

  const items = [
    { label: '긴급',  count: urgent,  color: C.danger,  bg: C.dangerLight  },
    { label: '주의',  count: caution, color: C.warning, bg: C.warningLight },
    { label: '정상',  count: normal,  color: C.success, bg: C.successLight },
  ]

  return (
    <div>
      {/* 막대 바 */}
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 10, marginBottom: 14 }}>
        {items.map(item => item.count > 0 && (
          <div
            key={item.label}
            title={`${item.label}: ${item.count}명`}
            style={{ width: `${(item.count / total) * 100}%`, background: item.color, transition: 'width 0.5s' }}
          />
        ))}
      </div>
      {/* 범례 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.textMuted }}>{item.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: item.count > 0 ? item.color : C.textLight }}>
                {item.count}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: item.bg, color: item.color,
                borderRadius: 4, padding: '1px 5px',
              }}>
                {total > 0 ? Math.round((item.count / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 제출율 게이지 ── */
function SubmitRate({ submitted, total }: { submitted: number; total: number }) {
  const rate = total > 0 ? Math.round((submitted / total) * 100) : 0
  const color = rate >= 80 ? C.success : rate >= 50 ? C.warning : C.danger

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: C.textMuted }}>전체 환자 기준</span>
        <span style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: '-0.03em' }}>{rate}%</span>
      </div>
      <div style={{ height: 8, background: C.bg, borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${rate}%`, background: color,
          borderRadius: 99, transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
        {submitted}명 제출 / {total}명 전체
      </div>
    </div>
  )
}

/* ── 미니 캘린더 ── */
const WEEKDAYS = ['일','월','화','수','목','금','토']
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

function MiniCalendar({ selectedDate, onSelect }: {
  selectedDate: Date
  onSelect: (d: Date) => void
}) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(selectedDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())

  // selectedDate가 바뀌면 캘린더 뷰도 맞춤
  useEffect(() => {
    setViewYear(selectedDate.getFullYear())
    setViewMonth(selectedDate.getMonth())
  }, [selectedDate])

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth)
  const firstDayOfWeek = getFirstDayOfMonth(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1
    // 미래 달로는 못 넘어감 (현재 달까지만)
    if (nextY > today.getFullYear() || (nextY === today.getFullYear() && nextM > today.getMonth())) return
    setViewYear(nextY); setViewMonth(nextM)
  }
  const isNextDisabled = (
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth())
  )

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // 6행 맞추기
  while (cells.length % 7 !== 0) cells.push(null)

  const selStr = toDateStr(selectedDate)
  const todStr = toDateStr(today)

  return (
    <div style={{ userSelect: 'none' }}>
      {/* 월 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          onClick={prevMonth}
          style={{ width: 28, height: 28, border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: C.textMuted, fontFamily: 'inherit' }}
        >‹</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{viewYear}년 {MONTH_NAMES[viewMonth]}</span>
        <button
          onClick={nextMonth}
          disabled={isNextDisabled}
          style={{
            width: 28, height: 28, border: `1px solid ${C.border}`, borderRadius: 6,
            background: isNextDisabled ? '#f9fafb' : '#fff',
            cursor: isNextDisabled ? 'default' : 'pointer',
            fontSize: 14, color: isNextDisabled ? C.textLight : C.textMuted, fontFamily: 'inherit',
          }}
        >›</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700,
            color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : C.textLight,
            padding: '2px 0',
          }}>{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const cellDate = new Date(viewYear, viewMonth, day)
          const cellStr  = toDateStr(cellDate)
          const future   = isFuture(cellDate)
          const isSelected = cellStr === selStr
          const isTod      = cellStr === todStr
          const isSun      = idx % 7 === 0
          const isSat      = idx % 7 === 6

          return (
            <button
              key={day}
              disabled={future}
              onClick={() => !future && onSelect(cellDate)}
              style={{
                width: '100%', aspectRatio: '1', border: 'none', borderRadius: 8,
                fontSize: 12, fontWeight: isSelected || isTod ? 700 : 400,
                cursor: future ? 'default' : 'pointer',
                background: isSelected
                  ? 'var(--capd-primary)'
                  : isTod
                  ? 'var(--capd-primary-light)'
                  : 'transparent',
                color: isSelected
                  ? '#fff'
                  : future
                  ? '#d1d5db'
                  : isTod
                  ? 'var(--capd-primary-dark)'
                  : isSun
                  ? '#ef4444'
                  : isSat
                  ? '#3b82f6'
                  : C.text,
                transition: 'background 0.12s',
                fontFamily: 'inherit',
                position: 'relative',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* 오늘로 돌아가기 */}
      {selStr !== todStr && (
        <button
          onClick={() => onSelect(today)}
          style={{
            width: '100%', marginTop: 10, padding: '6px 0',
            border: `1px solid var(--capd-border)`, borderRadius: 8,
            background: '#fff', color: 'var(--capd-primary-dark)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >오늘로 이동</button>
      )}
    </div>
  )
}

/* ── 메인 ── */
export default function DashboardPage() {
  const navigate = useNavigate()
  const [patients,    setPatients]    = useState<PatientInfo[]>([])
  const [stats,       setStats]       = useState<DashboardStats | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [hoveredRow,  setHoveredRow]  = useState<number | null>(null)
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  const fetchData = useCallback((targetDate: Date) => {
    const token = localStorage.getItem('access_token')
    if (!token) { navigate('/login'); return }
    setLoading(true); setError('')

    const dateParam = toDateStr(targetDate)

    Promise.all([
      fetch(`${API}/api/v1/patients`,                           { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API}/api/v1/dashboard?record_date=${dateParam}`, { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(async ([pRes, dRes]) => {
        if (pRes.status === 401 || dRes.status === 401) { localStorage.clear(); navigate('/login'); return }
        if (!pRes.ok || !dRes.ok) throw new Error('서버 오류')
        const [pData, dData] = await Promise.all([pRes.json(), dRes.json()])
        setPatients(pData as PatientInfo[])
        setStats(dData as DashboardStats)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [navigate])

  useEffect(() => { fetchData(currentDate) }, [fetchData, currentDate])

  /* 기록 맵: patient_id → record */
  const recordMap = new Map<number, TodayRecord>()
  stats?.records.forEach(r => recordMap.set(r.patient_id, r))

  /* 정렬: 긴급 → 미검토(submitted) → 승인됨 → 미제출 */
  const sortedPatients = [...patients].sort((a, b) => {
    const ra = recordMap.get(a.id)
    const rb = recordMap.get(b.id)
    const rank = (r: TodayRecord | undefined) => {
      if (!r) return 3
      if (r.risk_level === 'urgent') return 0
      if (r.status === 'submitted') return 1
      return 2
    }
    return rank(ra) - rank(rb) || a.name.localeCompare(b.name, 'ko')
  })

  const pendingCount   = stats?.pending_count  ?? 0
  const approvedCount  = stats?.approved_count ?? 0
  const totalPatients  = patients.length
  const totalSubmitted = stats?.total_submitted ?? 0
  const allRecords     = stats?.records ?? []

  return (
    <main style={{ padding: '28px 32px' }}>

      {/* 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.04em' }}>대시보드</h1>
        <div style={{ fontSize: 13, color: C.textMuted, marginTop: 3 }}>{formatDateKo(currentDate)}</div>
      </div>

      {/* 통계 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard icon="📋" label="제출된 기록" value={totalSubmitted} sub="건" />
        <StatCard icon="🔍" label="미검토" value={pendingCount} sub="건" color={pendingCount > 0 ? C.warning : undefined} />
        <StatCard icon="✅" label="승인 완료" value={approvedCount} sub="건" color={C.success} />
        <StatCard icon="👥" label="총 환자 수" value={totalPatients} sub="명" />
      </div>

      {/* 2열 레이아웃: 환자 테이블 (좌) + 사이드패널 (우) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* ── 좌: 환자 테이블 ── */}
        <div>
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>
              {isToday(currentDate) ? '오늘 제출된 기록' : `${toDateStr(currentDate)} 기록`}
            </h2>
            {loading && <span style={{ fontSize: 12, color: C.textMuted }}>불러오는 중...</span>}
          </div>

          {error ? (
            <div style={{ padding: '20px 16px', color: C.danger, fontSize: 13 }}>오류: {error}</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: C.bg }}>
                    {['환자명', '전화번호', '상태', '위험도', 'AI 질문', 'AI 요약', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '11px 14px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: C.textMuted, whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPatients.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                        {loading ? '불러오는 중...' : '등록된 환자가 없습니다.'}
                      </td>
                    </tr>
                  ) : sortedPatients.map(p => {
                    const rec = recordMap.get(p.id) ?? null
                    return (
                      <tr
                        key={p.id}
                        style={{
                          borderTop: `1px solid ${C.border}`,
                          background: hoveredRow === p.id ? C.bg : '#fff',
                          transition: 'background 0.1s',
                          cursor: rec ? 'pointer' : 'default',
                        }}
                        onMouseEnter={() => setHoveredRow(p.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => {
                          if (rec) navigate('/doctor/record', { state: { recordId: rec.record_id, patientName: p.name } })
                        }}
                      >
                        <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</td>
                        <td style={{ padding: '12px 14px', fontSize: 12, color: C.textMuted }}>{p.phone_number}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {rec ? <StatusBadge status={rec.status} /> : <span style={{ fontSize: 12, color: C.textLight }}>미제출</span>}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <RiskBadge level={rec?.risk_level ?? null} />
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {rec && rec.unreviewed_ai_count > 0 ? (
                            <span
                              onClick={e => { e.stopPropagation(); navigate('/doctor/ai-questions') }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                background: C.warningLight, color: C.warning,
                                border: `1px solid #fcd34d`,
                                borderRadius: 6, padding: '3px 8px',
                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              }}
                            >⚡ {rec.unreviewed_ai_count}건</span>
                          ) : (
                            <span style={{ fontSize: 12, color: C.textLight }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: 220 }}>
                          {rec?.ai_summary ? (
                            <p style={{ margin: 0, fontSize: 11, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                              {rec.ai_summary}
                            </p>
                          ) : (
                            <span style={{ fontSize: 12, color: C.textLight }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {rec ? (
                            <button
                              style={{
                                padding: '5px 12px', border: `1px solid ${C.border}`,
                                borderRadius: 8, background: C.primaryLight, color: C.primaryDark,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                              }}
                              onClick={e => { e.stopPropagation(); navigate('/doctor/record', { state: { recordId: rec.record_id, patientName: p.name } }) }}
                            >보기</button>
                          ) : (
                            <button
                              style={{
                                padding: '5px 12px', border: `1px solid ${C.border}`,
                                borderRadius: 8, background: '#f9fafb', color: C.textMuted,
                                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                              }}
                              onClick={e => { e.stopPropagation(); navigate(`/doctor/patients/${p.id}`, { state: { patientName: p.name } }) }}
                            >과거 기록</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 우: 사이드 패널 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 캘린더 카드 */}
          <div style={{
            background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`,
            padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>📅 날짜 선택</div>
            <MiniCalendar
              selectedDate={currentDate}
              onSelect={(d) => setCurrentDate(d)}
            />
          </div>

          {/* 위험도 분포 카드 */}
          <div style={{
            background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`,
            padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>
              🎯 위험도 분포
              <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted, marginLeft: 6 }}>
                (AI 분석 완료 {allRecords.filter(r => r.risk_level).length}명)
              </span>
            </div>
            <RiskDonut records={allRecords} />
          </div>

          {/* 제출율 카드 */}
          <div style={{
            background: '#fff', borderRadius: 14, border: `1px solid ${C.border}`,
            padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>📊 기록 제출율</div>
            <SubmitRate submitted={totalSubmitted} total={totalPatients} />
          </div>

        </div>
      </div>
    </main>
  )
}
