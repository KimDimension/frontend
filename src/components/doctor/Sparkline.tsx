import { useState } from 'react'

export interface TrendPoint {
  record_date: string
  weight: number | null
  total_ultrafiltration: number | null
  blood_pressure: string | null
  risk_level: string | null
}

const MUTED = '#6b7280'

/**
 * 최근 추이 스파크라인 (hover 툴팁 + 시작/중간/끝 날짜 눈금).
 * PatientDrawer / PatientDetailPage 양쪽에서 재사용.
 */
export function Sparkline({ data, field, color, label, unit }: {
  data: TrendPoint[]
  field: 'weight' | 'total_ultrafiltration'
  color: string; label: string; unit: string
}) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null)

  const filtered = data
    .filter(d => d[field] !== null)
    .map(d => ({ value: d[field] as number, date: d.record_date }))

  if (filtered.length < 2) return (
    <div style={{ fontSize: 11, color: MUTED, padding: '4px 0' }}>{label}: 데이터 부족</div>
  )

  const pts = filtered.map(d => d.value)
  const avg = pts.reduce((a, b) => a + b, 0) / pts.length
  const W = 200, CHART_H = 42, DATE_H = 14, PAD = 4
  const TOTAL_H = CHART_H + DATE_H

  const minV = Math.min(...pts), maxV = Math.max(...pts)
  const rangeV = maxV - minV || 1
  const xs = pts.map((_, i) => PAD + (i / (pts.length - 1)) * (W - PAD * 2))
  const ys = pts.map(v => CHART_H - PAD - ((v - minV) / rangeV) * (CHART_H - PAD * 2))
  const polyPts = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')

  const axisIndices = filtered.length <= 2
    ? [0, filtered.length - 1]
    : [0, Math.round((filtered.length - 1) / 2), filtered.length - 1]
  const uniqueAxisIndices = [...new Set(axisIndices)]

  const fmtDate = (s: string) => {
    const p = s.split('-')
    return p.length >= 3 ? `${parseInt(p[1])}/${parseInt(p[2])}` : s
  }

  const ttIdx = tooltip?.idx
  const ttX = ttIdx !== undefined ? xs[ttIdx] : null
  const ttY = ttIdx !== undefined ? ys[ttIdx] : null
  const ttVal = ttIdx !== undefined ? filtered[ttIdx].value : null
  const ttDate = ttIdx !== undefined ? filtered[ttIdx].date : null

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>
          <span style={{ fontSize: 10, fontWeight: 500, color: MUTED, marginRight: 2 }}>평균</span>
          {avg.toFixed(1)} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${TOTAL_H}`} style={{ width: '100%', height: TOTAL_H, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`sg-${field}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <polygon points={`${xs[0].toFixed(1)},${CHART_H} ${polyPts} ${xs[xs.length - 1].toFixed(1)},${CHART_H}`} fill={`url(#sg-${field})`} />
        <polyline points={polyPts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />

        {uniqueAxisIndices.map(idx => {
          const anchor = idx === 0 ? 'start' : idx === filtered.length - 1 ? 'end' : 'middle'
          return (
            <g key={`tick-${idx}`}>
              <line x1={xs[idx]} y1={CHART_H} x2={xs[idx]} y2={CHART_H + 3} stroke="#d1d5db" strokeWidth={0.8} />
              <text x={xs[idx]} y={TOTAL_H - 1} textAnchor={anchor} fontSize={10} fill="#6b7280" fontWeight={500}>
                {fmtDate(filtered[idx].date)}
              </text>
            </g>
          )
        })}

        {xs.map((x, i) => (
          <g key={i} onMouseEnter={() => setTooltip({ idx: i })} onMouseLeave={() => setTooltip(null)} style={{ cursor: 'crosshair' }}>
            <circle cx={x} cy={ys[i]} r={10} fill="transparent" />
            <circle cx={x} cy={ys[i]} r={i === xs.length - 1 ? 3.5 : 2} fill={color} stroke="#fff" strokeWidth={1} />
          </g>
        ))}

        {tooltip !== null && ttX !== null && ttY !== null && ttVal !== null && ttDate !== null && (() => {
          const valStr = `${ttVal.toFixed(1)} ${unit}`
          const dateStr = fmtDate(ttDate)
          const BOX_W = 62, BOX_H = 28
          let bx = ttX - BOX_W / 2
          if (bx < 0) bx = 0
          if (bx + BOX_W > W) bx = W - BOX_W
          const by = Math.max(2, ttY - BOX_H - 7)
          return (
            <g style={{ pointerEvents: 'none' }}>
              <line x1={ttX} y1={by + BOX_H + 1} x2={ttX} y2={ttY - 4} stroke={color} strokeWidth={0.8} strokeDasharray="2,2" opacity={0.55} />
              <rect x={bx} y={by} width={BOX_W} height={BOX_H} rx={4} fill="rgba(26,26,46,0.88)" />
              <text x={bx + BOX_W / 2} y={by + 11} textAnchor="middle" fontSize={9.5} fill="#fff" fontWeight="700">{valStr}</text>
              <text x={bx + BOX_W / 2} y={by + 22} textAnchor="middle" fontSize={11} fill="rgba(200,210,230,0.95)">{dateStr}</text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

export default Sparkline
