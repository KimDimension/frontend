import { useState } from 'react'
import type { DailyRecordCreate, ExchangeRecord } from '../../api/records'
import styles from './RecordForm.module.css'

// ── 빈 교환 기록 초기값 ──────────────────────────────────────
const emptyExchange = (session_number: number): ExchangeRecord => ({
  session_number,
  exchange_time: '',
  drainage_volume: undefined,
  infusion_concentration: undefined,
  infusion_weight: undefined,
  ultrafiltration: undefined,
})

const SESSIONS = [1, 2, 3, 4, 5]

// ── 오늘 날짜 YYYY-MM-DD ─────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0]

interface Props {
  onSubmit: (data: DailyRecordCreate) => void
  isLoading: boolean
}

export default function RecordForm({ onSubmit, isLoading }: Props) {
  // 교환 기록 (5회차)
  const [exchanges, setExchanges] = useState<ExchangeRecord[]>(
    SESSIONS.map(emptyExchange)
  )

  // 기타 기록
  const [turbidPeritoneal, setTurbidPeritoneal] = useState(false)
  const [weight, setWeight] = useState('')
  const [bpSystolic, setBpSystolic] = useState('')
  const [bpDiastolic, setBpDiastolic] = useState('')
  const [urineCount, setUrineCount] = useState('')
  const [fastingGlucose, setFastingGlucose] = useState('')
  const [memo, setMemo] = useState('')

  // ── 교환 기록 셀 변경 핸들러 ────────────────────────────────
  const handleExchange = (
    sessionIdx: number,
    field: keyof ExchangeRecord,
    value: string
  ) => {
    setExchanges((prev) => {
      const next = [...prev]
      const rec = { ...next[sessionIdx] }
      if (field === 'exchange_time') {
        rec.exchange_time = value
      } else {
        const num = value === '' ? undefined : parseFloat(value)
        ;(rec as Record<string, unknown>)[field] = num
      }
      next[sessionIdx] = rec
      return next
    })
  }

  // ── 제수량 합계 자동 계산 ────────────────────────────────────
  const totalUltrafiltration = exchanges.reduce(
    (sum, ex) => sum + (ex.ultrafiltration ?? 0),
    0
  )

  // ── 제출 ─────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const validExchanges = exchanges.filter(
      (ex) =>
        ex.exchange_time ||
        ex.drainage_volume !== undefined ||
        ex.infusion_concentration !== undefined ||
        ex.infusion_weight !== undefined ||
        ex.ultrafiltration !== undefined
    )

    const payload: DailyRecordCreate = {
      record_date: todayStr(),
      turbid_peritoneal: turbidPeritoneal,
      weight: weight ? parseFloat(weight) : undefined,
      blood_pressure:
        bpSystolic && bpDiastolic ? `${bpSystolic}/${bpDiastolic}` : undefined,
      urine_count: urineCount ? parseInt(urineCount, 10) : undefined,
      total_ultrafiltration: totalUltrafiltration || undefined,
      fasting_blood_glucose: fastingGlucose ? parseFloat(fastingGlucose) : undefined,
      memo: memo || undefined,
      exchange_records: validExchanges,
    }

    onSubmit(payload)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>

      {/* ── 교환 기록 테이블 ──────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>투석 교환 기록</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.rowHeader}>항목</th>
                {SESSIONS.map((n) => (
                  <th key={n} className={styles.colHeader}>{n}회차</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 교환 시간 */}
              <tr>
                <td className={styles.rowLabel}>교환 시간</td>
                {exchanges.map((ex, i) => (
                  <td key={i} className={styles.cell}>
                    <input
                      type="time"
                      className={styles.cellInput}
                      value={ex.exchange_time ?? ''}
                      onChange={(e) => handleExchange(i, 'exchange_time', e.target.value)}
                    />
                  </td>
                ))}
              </tr>
              {/* 배액량 */}
              <tr>
                <td className={styles.rowLabel}>배액량 (g)</td>
                {exchanges.map((ex, i) => (
                  <td key={i} className={styles.cell}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      placeholder="—"
                      min="0"
                      value={ex.drainage_volume ?? ''}
                      onChange={(e) => handleExchange(i, 'drainage_volume', e.target.value)}
                    />
                  </td>
                ))}
              </tr>
              {/* 주입액 농도 */}
              <tr>
                <td className={styles.rowLabel}>주입액 농도 (%)</td>
                {exchanges.map((ex, i) => (
                  <td key={i} className={styles.cell}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      placeholder="—"
                      step="0.5"
                      min="0"
                      max="5"
                      value={ex.infusion_concentration ?? ''}
                      onChange={(e) =>
                        handleExchange(i, 'infusion_concentration', e.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
              {/* 주입액 중량 */}
              <tr>
                <td className={styles.rowLabel}>주입액 중량 (g)</td>
                {exchanges.map((ex, i) => (
                  <td key={i} className={styles.cell}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      placeholder="—"
                      min="0"
                      value={ex.infusion_weight ?? ''}
                      onChange={(e) => handleExchange(i, 'infusion_weight', e.target.value)}
                    />
                  </td>
                ))}
              </tr>
              {/* 제수량 */}
              <tr>
                <td className={styles.rowLabel}>제수량 (g)</td>
                {exchanges.map((ex, i) => (
                  <td key={i} className={styles.cell}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      placeholder="—"
                      value={ex.ultrafiltration ?? ''}
                      onChange={(e) => handleExchange(i, 'ultrafiltration', e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 기타 기록 ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>기타 기록</h2>
        <div className={styles.otherGrid}>

          {/* 복막액 혼탁 여부 */}
          <div className={styles.field}>
            <label className={styles.label}>복막액 혼탁 여부</label>
            <div className={styles.toggleRow}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${!turbidPeritoneal ? styles.toggleActive : ''}`}
                onClick={() => setTurbidPeritoneal(false)}
              >
                정상
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${turbidPeritoneal ? styles.toggleActiveWarn : ''}`}
                onClick={() => setTurbidPeritoneal(true)}
              >
                혼탁
              </button>
            </div>
          </div>

          {/* 체중 */}
          <div className={styles.field}>
            <label className={styles.label}>체중 (kg)</label>
            <input
              type="number"
              className={styles.input}
              placeholder="예) 62.5"
              step="0.1"
              min="0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          {/* 혈압 */}
          <div className={styles.field}>
            <label className={styles.label}>혈압 (mmHg)</label>
            <div className={styles.bpRow}>
              <input
                type="number"
                className={styles.bpInput}
                placeholder="수축기"
                min="0"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
              />
              <span className={styles.bpSlash}>/</span>
              <input
                type="number"
                className={styles.bpInput}
                placeholder="이완기"
                min="0"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
              />
            </div>
          </div>

          {/* 소변 횟수 */}
          <div className={styles.field}>
            <label className={styles.label}>소변 횟수</label>
            <input
              type="number"
              className={styles.input}
              placeholder="예) 3"
              min="0"
              value={urineCount}
              onChange={(e) => setUrineCount(e.target.value)}
            />
          </div>

          {/* 제수량 합계 (자동 계산) */}
          <div className={styles.field}>
            <label className={styles.label}>제수량 합계 (g)</label>
            <input
              type="number"
              className={`${styles.input} ${styles.readOnly}`}
              value={totalUltrafiltration || ''}
              placeholder="교환 기록에서 자동 계산"
              readOnly
            />
          </div>

          {/* 공복혈당 */}
          <div className={styles.field}>
            <label className={styles.label}>공복혈당 (mg/dL)</label>
            <input
              type="number"
              className={styles.input}
              placeholder="예) 105"
              min="0"
              value={fastingGlucose}
              onChange={(e) => setFastingGlucose(e.target.value)}
            />
          </div>

        </div>

        {/* 메모 */}
        <div className={`${styles.field} ${styles.memoField}`}>
          <label className={styles.label}>메모 (특이사항)</label>
          <textarea
            className={styles.textarea}
            placeholder="특이사항이 있으면 입력해 주세요."
            rows={3}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </section>

      {/* ── 제출 버튼 ─────────────────────────────────────────── */}
      <div className={styles.submitArea}>
        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? '제출 중...' : '기록 제출하기 →'}
        </button>
        <p className={styles.submitNote}>* 제출 후 후속 설문이 이어집니다.</p>
      </div>
    </form>
  )
}
