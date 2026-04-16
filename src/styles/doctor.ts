import React from "react";

/* =========================================================
   색상 토큰
   ========================================================= */
export const COLOR = {
  primary:     "#2e75b5",
  primaryDark: "#1b508a",
  success:     "#2b8c47",
  successDark: "#236e39",
  danger:      "#cc3333",
  gray:        "#8c8c8c",
  grayLight:   "#dbdbdb",
  grayBg:      "#eff1f5",
  white:       "#ffffff",
  text:        "#1f1f1f",
  textMuted:   "#8c8c8c",
  blue50:      "#edf5ff",
  green50:     "#edfff2",
  blue100:     "#f2f7ff",
  rowAlt:      "#fafafc",
  rowAlt2:     "#f7f7f7",
} as const;

/* =========================================================
   레이아웃
   ========================================================= */
export const layout: { [key: string]: React.CSSProperties } = {
  page: {
    flex: 1,
    overflowY: "auto",
    padding: 24,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
};

/* =========================================================
   타이포그래피
   ========================================================= */
export const typography: { [key: string]: React.CSSProperties } = {
  pageTitle: {
    color: COLOR.text,
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  pageSubtitle: {
    color: COLOR.textMuted,
    fontSize: 11,
    marginTop: 4,
    margin: 0,
  },
  cardTitle: {
    color: COLOR.text,
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
    marginBottom: 10,
  },
  label: {
    color: COLOR.textMuted,
    fontSize: 11,
    margin: 0,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
  },
  qaQuestion: {
    color: COLOR.textMuted,
    fontSize: 10,
    margin: 0,
    marginTop: 12,
  },
  qaAnswer: {
    color: COLOR.text,
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
    marginTop: 2,
  },
};

/* =========================================================
   카드
   ========================================================= */
export const card: { [key: string]: React.CSSProperties } = {
  base: {
    backgroundColor: COLOR.white,
    borderRadius: 8,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    padding: "16px 16px 20px",
  },
  header: {
    padding: "16px 20px 8px",
  },
  title: {
    color: COLOR.text,
    fontSize: 13,
    fontWeight: 700,
    margin: 0,
  },
};

/* =========================================================
   테이블
   ========================================================= */
export const table: { [key: string]: React.CSSProperties } = {
  root: {
    width: "100%",
    borderCollapse: "collapse",
  },
  thDark: {
    backgroundColor: COLOR.primaryDark,
    color: COLOR.white,
    fontSize: 9,
    fontWeight: 700,
    padding: "6px 10px",
    textAlign: "left",
  },
  thLight: {
    backgroundColor: COLOR.grayLight,
    color: COLOR.text,
    fontSize: 9,
    fontWeight: 700,
    padding: "6px 10px",
    textAlign: "left",
  },
  thGray: {
    backgroundColor: COLOR.grayLight,
    color: COLOR.text,
    fontSize: 10,
    fontWeight: 700,
    padding: "7px 16px",
    textAlign: "left",
  },
  tdLabel: {
    backgroundColor: COLOR.blue100,
    fontSize: 9,
    padding: "8px 10px",
    color: COLOR.text,
  },
  tdEven: {
    backgroundColor: COLOR.white,
    fontSize: 9,
    padding: "8px 10px",
    color: COLOR.text,
  },
  tdOdd: {
    backgroundColor: COLOR.rowAlt2,
    fontSize: 9,
    padding: "8px 10px",
    color: COLOR.text,
  },
  tdNormal: {
    padding: "13px 16px",
    fontSize: 12,
    color: COLOR.text,
  },
  rowEven: { backgroundColor: COLOR.white },
  rowOdd:  { backgroundColor: COLOR.rowAlt },
};

/* =========================================================
   버튼
   ========================================================= */
export const btn: { [key: string]: React.CSSProperties } = {
  primary: {
    backgroundColor: COLOR.primary,
    color: COLOR.white,
    fontSize: 11,
    fontWeight: 700,
    padding: "5px 14px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  success: {
    backgroundColor: COLOR.success,
    color: COLOR.white,
    fontSize: 11,
    fontWeight: 700,
    padding: "10px 20px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  ghost: {
    backgroundColor: COLOR.grayLight,
    color: COLOR.text,
    fontSize: 11,
    fontWeight: 700,
    padding: "6px 14px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
};

/* =========================================================
   상태 배지
   ========================================================= */
export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  submitted: { label: "미검토",   color: COLOR.danger  },
  reviewed:  { label: "승인 완료", color: COLOR.success },
  rejected:  { label: "반려",     color: COLOR.gray    },
};

/* =========================================================
   콘텐츠 박스 (AI 요약, EMR)
   ========================================================= */
export const contentBox: { [key: string]: React.CSSProperties } = {
  ai: {
    backgroundColor: COLOR.blue50,
    borderRadius: 4,
    padding: "12px 14px",
    fontSize: 11,
    color: COLOR.text,
    lineHeight: 1.7,
  },
  emr: {
    backgroundColor: COLOR.green50,
    borderRadius: 4,
    padding: "12px 14px",
    fontSize: 10,
    color: COLOR.text,
    lineHeight: 2,
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
};
