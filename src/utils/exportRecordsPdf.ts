import { apiFetch } from '../api/apiFetch'
import { formatPhone } from './helpers'

const API = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * 환자 기록 요약지를 새 창으로 열고 인쇄(PDF 저장) 다이얼로그를 띄운다.
 * PatientDrawer / PatientDetailPage 양쪽에서 재사용.
 */
export async function openRecordsExportPdf(
  patientId: number | string,
  pdfStart: string,
  pdfEnd: string,
  onError?: (msg: string) => void,
): Promise<void> {
  const params = new URLSearchParams()
  if (pdfStart) params.set('start_date', pdfStart)
  if (pdfEnd)   params.set('end_date', pdfEnd)

  const res = await apiFetch(`${API}/api/v1/patients/${patientId}/records-export?${params}`, {})
  if (!res.ok) { onError?.('내보내기 실패'); return }
  const d = await res.json()

  const labels   = d.records.map((r: any) => r.record_date)
  const weights  = d.records.map((r: any) => r.weight ?? null)
  const systolic = d.records.map((r: any) => {
    if (!r.blood_pressure) return null
    const m = String(r.blood_pressure).match(/^(\d+)/)
    return m ? Number(m[1]) : null
  })
  const uf      = d.records.map((r: any) => r.total_ultrafiltration ?? null)
  const glucose = d.records.map((r: any) => r.fasting_blood_glucose ?? null)

  const riskCount = { 긴급: 0, 주의: 0, 정상: 0 }
  d.records.forEach((r: any) => {
    if (r.risk_level === '긴급') riskCount.긴급++
    else if (r.risk_level === '주의') riskCount.주의++
    else if (r.risk_level === '정상') riskCount.정상++
  })

  const chartDataJson = JSON.stringify({ labels, weights, systolic, uf, glucose })

  const rows = d.records.map((r: any) => `<tr>
    <td>${r.record_date}</td>
    <td>${r.weight ?? '—'}</td>
    <td>${r.blood_pressure ?? '—'}</td>
    <td>${r.total_ultrafiltration ?? '—'}</td>
    <td>${r.fasting_blood_glucose ?? '—'}</td>
    <td>${r.turbid_peritoneal ? '탁함' : '맑음'}</td>
    <td class="risk-${r.risk_level}">${r.risk_level || '—'}</td>
    <td style="max-width:120px;word-break:break-all">${r.memo || '—'}</td>
  </tr>`).join('')

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>CAPD — ${d.patient.name}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
*{box-sizing:border-box}
body{font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-size:12px;color:#1a1a2e;margin:28px 32px}
h1{font-size:18px;font-weight:900;margin:0 0 2px;color:#3b0764}
.subtitle{color:#7c3aed;font-size:12px;font-weight:700;margin-bottom:10px}
.info{color:#6b7280;font-size:11px;margin-bottom:20px;line-height:2;border-left:3px solid #7c3aed;padding-left:10px}
.section-title{font-size:13px;font-weight:800;color:#1a1a2e;margin:24px 0 12px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}
.risk-summary{display:flex;gap:12px;margin-bottom:20px}
.risk-card{flex:1;border-radius:8px;padding:10px 14px;text-align:center}
.risk-card .num{font-size:22px;font-weight:900;line-height:1.2}
.risk-card .lbl{font-size:10px;font-weight:700;margin-top:2px}
.risk-card.urgent{background:#fef2f2;color:#dc2626}
.risk-card.caution{background:#fffbeb;color:#d97706}
.risk-card.normal{background:#f0fdf4;color:#16a34a}
.risk-card.none{background:#f3f4f6;color:#6b7280}
.charts{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.chart-box{border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#fafafa}
.chart-label{font-size:10px;font-weight:700;color:#6b7280;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px}
canvas{width:100%!important;height:120px!important}
table{width:100%;border-collapse:collapse}
th{background:#f3f4f6;padding:7px 8px;text-align:left;font-size:11px;font-weight:700;border:1px solid #e5e7eb}
td{padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;vertical-align:top}
tr:nth-child(even) td{background:#f9fafb}
.risk-긴급{color:#dc2626;font-weight:700}
.risk-주의{color:#d97706;font-weight:700}
.risk-정상{color:#16a34a}
.footer{margin-top:16px;color:#9ca3af;font-size:10px;text-align:right}
@media print{
  body{margin:12px 16px}
  .charts{grid-template-columns:1fr 1fr 1fr}
  @page{size:A4;margin:15mm}
}
</style>
</head><body>
<h1>CAPD 일일 기록 요약지</h1>
<div class="subtitle">${d.patient.name} 환자</div>
<div class="info">
  생년월일: ${d.patient.birth_date ?? '—'} &nbsp;|&nbsp; 성별: ${d.patient.gender ?? '—'} &nbsp;|&nbsp; 연락처: ${formatPhone(d.patient.phone_number)}<br>
  병원: ${d.patient.hospital ?? '—'} &nbsp;|&nbsp; 담당의: ${d.doctor_name}<br>
  조회 기간: ${pdfStart || '전체'} ~ ${pdfEnd || '전체'} &nbsp;|&nbsp; 기록 수: ${d.records.length}건
</div>

<div class="section-title">위험도 분포</div>
<div class="risk-summary">
  <div class="risk-card urgent">
    <div class="num">${riskCount.긴급}</div>
    <div class="lbl">🔴 긴급</div>
  </div>
  <div class="risk-card caution">
    <div class="num">${riskCount.주의}</div>
    <div class="lbl">🟠 주의</div>
  </div>
  <div class="risk-card normal">
    <div class="num">${riskCount.정상}</div>
    <div class="lbl">🟢 정상</div>
  </div>
  <div class="risk-card none">
    <div class="num">${d.records.length - riskCount.긴급 - riskCount.주의 - riskCount.정상}</div>
    <div class="lbl">— 미분류</div>
  </div>
</div>

<div class="section-title">추세 그래프</div>
<div class="charts">
  <div class="chart-box">
    <div class="chart-label">체중 (kg)</div>
    <canvas id="chartWeight"></canvas>
  </div>
  <div class="chart-box">
    <div class="chart-label">혈압 수축기 (mmHg)</div>
    <canvas id="chartBP"></canvas>
  </div>
  <div class="chart-box">
    <div class="chart-label">제수량 (mL)</div>
    <canvas id="chartUF"></canvas>
  </div>
  <div class="chart-box">
    <div class="chart-label">공복혈당 (mg/dL)</div>
    <canvas id="chartGlucose"></canvas>
  </div>
</div>

<div class="section-title">상세 기록</div>
<table>
  <thead><tr>
    <th>날짜</th><th>체중(kg)</th><th>혈압</th><th>제수량(mL)</th>
    <th>혈당(mg/dL)</th><th>투석액</th><th>위험도</th><th>메모</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">내보내기: ${new Date().toLocaleString('ko-KR')}</div>

<script>
(function() {
  var data = ${chartDataJson};
  var labels = data.labels;
  var commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { font: { size: 9 }, maxRotation: 45, autoSkip: true, maxTicksLimit: 8 }, grid: { display: false } },
      y: { ticks: { font: { size: 9 } }, grid: { color: '#f0f0f0' } }
    },
    elements: { point: { radius: 3, hitRadius: 5 }, line: { tension: 0.3 } }
  };
  function mkChart(id, label, vals, color) {
    new Chart(document.getElementById(id), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{ label: label, data: vals, borderColor: color, backgroundColor: color + '22',
          fill: true, spanGaps: true, borderWidth: 2 }]
      },
      options: commonOpts
    });
  }
  mkChart('chartWeight',  '체중',     data.weights,  '#7c3aed');
  mkChart('chartBP',      '수축기혈압', data.systolic, '#dc2626');
  mkChart('chartUF',      '제수량',   data.uf,       '#2563eb');
  mkChart('chartGlucose', '공복혈당', data.glucose,  '#d97706');
  setTimeout(function(){ window.print(); }, 800);
})();
<\/script>
</body></html>`

  const win = window.open('', '_blank')
  if (win) { win.document.write(html); win.document.close() }
}
