import React from "react";
import { COLOR, card, typography } from "../../styles/doctor";

export default function AIReviewPage() {
  return (
    <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={typography.pageTitle}>AI 맞춤 질문 검토</h1>
        <p style={typography.pageSubtitle}>AI가 생성한 환자별 맞춤 질문을 검토하고 승인합니다.</p>
      </div>
      <div style={{ ...card.base, textAlign: "center", padding: "40px 20px", color: COLOR.textMuted, fontSize: 13 }}>
        준비 중입니다.
      </div>
    </main>
  );
}
