import React from "react";
import { createBrowserRouter, Navigate } from "react-router";

import LoginPage        from "../pages/auth/LoginPage";
import { DoctorLayout } from "../pages/doctor/Layout";
import DashboardPage    from "../pages/doctor/DashboardPage";
import RecordDetailPage from "../pages/doctor/RecordDetailPage";
import RecordSubmitPage from "../pages/patient/RecordSubmitPage";
import SurveyPage       from "../pages/patient/SurveyPage";
import SurveyDonePage   from "../pages/patient/SurveyDonePage";

/* ── 준비 중 placeholder ─────────────────────────────── */
const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>
    <h2>{title}</h2>
    <p style={{ color: "#8c8c8c", marginTop: 8 }}>준비 중입니다.</p>
  </div>
);

/* ── 로그인 보호 ─────────────────────────────────────── */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* ── 의사 레이아웃 + 로그인 보호 래퍼 ──────────────── */
function DoctorRoute({ children }: { children: React.ReactNode }) {
  return (
    <PrivateRoute>
      <DoctorLayout>{children}</DoctorLayout>
    </PrivateRoute>
  );
}

const router = createBrowserRouter([
  { path: "/",      element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },

  // ── 의사 ────────────────────────────────────────────
  {
    path: "/doctor",
    element: <DoctorRoute><DashboardPage /></DoctorRoute>,
  },
  {
    path: "/doctor/record",
    element: <DoctorRoute><RecordDetailPage /></DoctorRoute>,
  },
  {
    path: "/doctor/common-questions",
    element: <DoctorRoute><PlaceholderPage title="공통 질문" /></DoctorRoute>,
  },
  {
    path: "/doctor/ai-questions",
    element: <DoctorRoute><PlaceholderPage title="AI 맞춤 질문" /></DoctorRoute>,
  },

  // ── 환자 ────────────────────────────────────────────
  { path: "/patient",            element: <Navigate to="/patient/record" replace /> },
  { path: "/patient/record",     element: <PrivateRoute><RecordSubmitPage /></PrivateRoute> },
  { path: "/patient/survey",     element: <PrivateRoute><SurveyPage /></PrivateRoute> },
  { path: "/patient/survey/done",element: <PrivateRoute><SurveyDonePage /></PrivateRoute> },
]);

export default router;
