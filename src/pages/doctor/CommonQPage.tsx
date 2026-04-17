import React from "react";
import { COLOR, card, typography } from "../../styles/doctor";

export default function CommonQPage() {
  return (
    <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={typography.pageTitle}>공통 질문 관리</h1>
        <p style={typography.pageSubtitle}>모든 환자에게 공통으로 적용되는 질문을 관리합니다.</p>
      </div>
      <div style={{ ...card.base, textAlign: "center", padding: "40px 20px", color: COLOR.textMuted, fontSize: 13 }}>
        준비 중입니다.
      </div>
    </main>
  );
}
