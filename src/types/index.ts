// ── 공통 Enum ──────────────────────────────────────────────
export type UserRole = 'patient' | 'doctor' | 'admin'
export type RecordStatus = 'pending' | 'approved' | 'rejected'

// ── 인증 ───────────────────────────────────────────────────
export interface User {
  id: number
  name: string
  role: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: number
  name: string
  role: UserRole
}

// ── 교환기록 (ExchangeRecord) ──────────────────────────────
export interface ExchangeRecord {
  session_number: number   // 회차 (1~5)
  fill_volume_ml: number
  dwell_time_min: number
  drain_volume_ml: number
  drain_color: string
  drain_clarity: string
}

// ── 일일기록 (DailyRecord) ─────────────────────────────────
export interface DailyRecordCreate {
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  weight_kg?: number
  urine_output_ml?: number
  body_temp_celsius?: number
  symptoms?: string
  notes?: string
  exchanges: ExchangeRecord[]
}

export interface DailyRecordResponse {
  id: number
  patient_id: number
  submitted_at: string
  status: RecordStatus
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  weight_kg?: number
  urine_output_ml?: number
  body_temp_celsius?: number
  symptoms?: string
  notes?: string
  exchanges: ExchangeRecord[]
}

// ── 대시보드 ───────────────────────────────────────────────
export interface RecordRow {
  record_id: number
  patient_name: string
  submitted_at: string
  status: RecordStatus
  unreviewed_ai_count: number
}

export interface DashboardData {
  today: string
  total_submitted: number
  pending_count: number
  approved_count: number
  total_patients: number
  records: RecordRow[]
}

// ── 질문 ───────────────────────────────────────────────────
export interface CommonQuestion {
  id: number
  doctor_id: number
  content: string
  created_at: string
}

export interface AIQuestion {
  id: number
  record_id: number
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
