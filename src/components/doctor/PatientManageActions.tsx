import { useState } from 'react'
import { getHospitals, getDoctors } from '../../api/auth'
import type { Hospital, DoctorSummary } from '../../types'
import { useToast } from '../../hooks/useToast'
import { apiFetch } from '../../api/apiFetch'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const C = {
  primary:     'var(--capd-primary)',
  border:      'var(--capd-border)',
  text:        '#1a1a2e',
  textMuted:   '#6b7280',
  success:     '#16a34a',
  danger:      '#dc2626',
  dangerLight: '#fef2f2',
}

const token = () => localStorage.getItem('access_token') ?? ''

/**
 * 인수인계 + 담당 해제 액션 (현재 담당 환자 전용).
 * PatientDrawer / PatientDetailPage 양쪽에서 재사용.
 *
 * onDone: 인수인계/담당해제 성공 후 호출 (목록 새로고침·드로어 닫기·페이지 이동 등).
 */
export function PatientManageActions({ patientId, patientName, isCurrentPatient, onDone }: {
  patientId: number | string
  patientName: string
  isCurrentPatient: boolean
  onDone?: () => void
}) {
  const errToast      = useToast(3000)
  const handoverToast = useToast(2500)
  const [discharging,       setDischarging]       = useState(false)
  const [showHandover,      setShowHandover]      = useState(false)
  const [handoverHospitals, setHandoverHospitals] = useState<Hospital[]>([])
  const [handoverDoctors,   setHandoverDoctors]   = useState<DoctorSummary[]>([])
  const [handoverHosp,      setHandoverHosp]      = useState<number | ''>('')
  const [handoverDoc,       setHandoverDoc]       = useState<number | ''>('')
  const [handoverLoading,   setHandoverLoading]   = useState(false)

  if (!isCurrentPatient) return null

  const openHandover = async () => {
    setShowHandover(true)
    if (handoverHospitals.length === 0) {
      const h = await getHospitals().catch(() => [])
      setHandoverHospitals(h)
    }
  }

  const handleHandoverHosp = async (id: number | '') => {
    setHandoverHosp(id); setHandoverDoc('')
    if (!id) { setHandoverDoctors([]); return }
    const docs = await getDoctors(Number(id)).catch(() => [])
    setHandoverDoctors(docs)
  }

  const handleHandover = async () => {
    if (!handoverDoc) { errToast.show('인수할 의사를 선택해주세요.'); return }
    if (!window.confirm(`${patientName} 환자를 선택한 의사에게 인수인계하시겠습니까?\n이 작업은 즉시 적용됩니다.`)) return
    setHandoverLoading(true)
    try {
      const res = await apiFetch(`${API}/api/v1/patients/${patientId}/handover`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_doctor_id: handoverDoc }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? '인수인계 실패')
      handoverToast.show(`✓ ${data.message ?? '인수인계 완료'}`)
      setTimeout(() => { onDone?.() }, 1200)
    } catch (e: any) { errToast.show(e.message) } finally { setHandoverLoading(false) }
  }

  const handleDischarge = async () => {
    if (!window.confirm(`${patientName} 환자의 담당을 해제하시겠습니까?\n\n담당 해제 후에는 이 환자가 기록을 제출할 수 없게 됩니다.`)) return
    setDischarging(true)
    try {
      const res = await apiFetch(`${API}/api/v1/patients/${patientId}/discharge`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? '담당 해제 실패')
      onDone?.()
    } catch (e: any) { errToast.show(e.message) } finally { setDischarging(false) }
  }

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 인수인계 */}
      <div style={{ background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe', padding: '14px 18px' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>인수인계</h3>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
          다른 의사에게 이 환자를 즉시 이관합니다.<br />
          이관 후 현재 담당이 자동으로 해제됩니다.
        </p>
        {!showHandover ? (
          <button onClick={openHandover}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>
            🔄 인수인계
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>병원 선택</label>
              <select value={handoverHosp} onChange={e => handleHandoverHosp(Number(e.target.value) || '')}
                style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit' }}>
                <option value="">병원을 선택하세요</option>
                {handoverHospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>인수할 의사</label>
              <select value={handoverDoc} onChange={e => setHandoverDoc(Number(e.target.value) || '')}
                disabled={!handoverHosp}
                style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: 'inherit', opacity: !handoverHosp ? 0.6 : 1 }}>
                <option value="">{handoverHosp ? '의사를 선택하세요' : '먼저 병원을 선택하세요'}</option>
                {handoverDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowHandover(false); setHandoverHosp(''); setHandoverDoc('') }}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${C.border}`, background: '#fff', fontSize: 12, fontWeight: 600, color: C.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                취소
              </button>
              <button onClick={handleHandover} disabled={handoverLoading || !handoverDoc}
                style={{ flex: 2, padding: '8px', borderRadius: 8, border: 'none', background: (!handoverDoc || handoverLoading) ? '#e5e7eb' : '#2563eb', color: (!handoverDoc || handoverLoading) ? C.textMuted : '#fff', fontSize: 12, fontWeight: 700, cursor: (!handoverDoc || handoverLoading) ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                {handoverLoading ? '처리 중...' : '이관하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 담당 해제 */}
      <div style={{ background: C.dangerLight, borderRadius: 12, border: '1px solid #fca5a5', padding: '14px 18px' }}>
        <h3 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 800, color: C.danger }}>담당 해제</h3>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>
          담당을 해제하면 이 환자는 기록을 제출할 수 없게 됩니다.<br />
          재연결은 환자의 요청 후 승인을 통해 가능합니다.
        </p>
        <button onClick={handleDischarge} disabled={discharging}
          style={{ background: C.danger, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: discharging ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', opacity: discharging ? 0.6 : 1 }}>
          {discharging ? '처리 중...' : '🔓 담당 해제'}
        </button>
      </div>

      {/* 토스트 */}
      {(errToast.message || handoverToast.message) && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: handoverToast.message ? C.success : '#1f2937',
          color: '#fff', borderRadius: 10, padding: '10px 20px',
          fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)', zIndex: 1000,
        }}>
          {handoverToast.message || errToast.message}
        </div>
      )}
    </div>
  )
}

export default PatientManageActions
