import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { btn, card, COLOR, STATUS_MAP, table, typography } from "../../styles/doctor";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/* ── 타입 ─────────────────────────────────────────────── */
interface RecordRow {
  record_id:           number;
  patient_name:        string;
  submitted_at:        string;
  status:              string;
  unreviewed_ai_count: number;
}

interface DashboardData {
  today:           string;
  total_submitted: number;
  pending_count:   number;
  approved_count:  number;
  total_patients:  number;
  records:         RecordRow[];
}

/* ── 통계 카드 ────────────────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={card.base}>
      <p style={typography.label}>{label}</p>
      <p style={{ ...typography.value, color }}>{value}</p>
    </div>
  );
}

/* ── 상태 배지 ────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: COLOR.gray };
  return <span style={{ color: s.color, fontWeight: 700, fontSize: 12 }}>{s.label}</span>;
}

/* ── 메인 ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { navigate("/login"); return; }

    fetch(`${API}/api/v1/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) { localStorage.clear(); navigate("/login"); return null; }
        if (!res.ok) throw new Error("서버 오류");
        return res.json();
      })
      .then((json) => { if (json) setData(json); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <div style={{ padding: 24, color: COLOR.textMuted, fontSize: 13 }}>불러오는 중...</div>;
  if (error)   return <div style={{ padding: 24, color: COLOR.danger,    fontSize: 13 }}>오류: {error}</div>;

  const stats = [
    { label: "오늘 제출",  value: `${data?.total_submitted ?? 0}건`, color: COLOR.primary     },
    { label: "미검토",     value: `${data?.pending_count   ?? 0}건`, color: COLOR.danger      },
    { label: "승인 완료",  value: `${data?.approved_count  ?? 0}건`, color: COLOR.success     },
    { label: "총 환자 수", value: `${data?.total_patients  ?? 0}명`, color: COLOR.primaryDark },
  ];

  return (
    <>
      <style>{`.view-btn:hover { background-color: ${COLOR.primaryDark} !important; }`}</style>

      <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={typography.pageTitle}>대시보드</h1>
          <p style={typography.pageSubtitle}>{data?.today} 기준</p>
        </div>

        {/* 통계 카드 4개 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "20px 0 16px" }}>
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>

        {/* 테이블 카드 */}
        <div style={{ ...card.base, padding: 0, overflow: "hidden" }}>
          <div style={card.header}>
            <p style={card.title}>오늘 제출된 기록</p>
          </div>
          <table style={table.root}>
            <thead>
              <tr>
                {["환자명", "제출 시간", "상태", "미검토 항목", ""].map((h) => (
                  <th key={h} style={table.thGray}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.records?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "20px", textAlign: "center", fontSize: 12, color: COLOR.textMuted }}>
                    오늘 제출된 기록이 없습니다.
                  </td>
                </tr>
              ) : (
                data?.records?.map((row, idx) => (
                  <tr key={row.record_id} style={idx % 2 === 0 ? table.rowEven : table.rowOdd}>
                    <td style={table.tdNormal}>{row.patient_name}</td>
                    <td style={table.tdNormal}>
                      {new Date(row.submitted_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={table.tdNormal}><StatusBadge status={row.status} /></td>
                    <td style={table.tdNormal}>
                      {row.unreviewed_ai_count > 0 ? `${row.unreviewed_ai_count}개` : "-"}
                    </td>
                    <td style={table.tdNormal}>
                      <button
                        className="view-btn"
                        style={btn.primary}
                        onClick={() => navigate("/doctor/record", { state: { recordId: row.record_id, patientName: row.patient_name } })}
                      >
                        보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
