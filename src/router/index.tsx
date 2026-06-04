import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import DoctorRegisterPage from "../pages/auth/DoctorRegisterPage";
import PatientRegisterPage from "../pages/auth/PatientRegisterPage";
import { DoctorLayout } from "../pages/doctor/Layout";
import DashboardPage from "../pages/doctor/DashboardPage";
import RecordDetailPage from "../pages/doctor/RecordDetailPage";
import PatientRecordsPage from "../pages/doctor/PatientRecordsPage";
import PatientListPage from "../pages/doctor/PatientListPage";
import PatientDetailPage from "../pages/doctor/PatientDetailPage";
import CommonQPage from "../pages/doctor/CommonQPage";
import AIReviewPage from "../pages/doctor/AIReviewPage";
import PatientApprovalPage from "../pages/doctor/PatientApprovalPage";
import RecordListPage from "../pages/patient/RecordListPage";
import RecordSubmitPage from "../pages/patient/RecordSubmitPage";
import CommonSurveyPage from "../pages/patient/CommonSurveyPage";
import AiSurveyPage from "../pages/patient/AiSurveyPage";
import SurveyDonePage from "../pages/patient/SurveyDonePage";
import PatientMyPage from "../pages/patient/PatientMyPage";
import DoctorMyPage from "../pages/doctor/DoctorMyPage";

// 준비 중 placeholder
const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: "2rem", textAlign: "center", fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif" }}>
    <h2>{title}</h2>
    <p style={{ color: "#8c8c8c", marginTop: 8 }}>준비 중입니다.</p>
  </div>
);

// 로그인 필요 라우트 보호 + role 검증
function PrivateRoute({ children, role }: { children: React.ReactNode; role?: 'doctor' | 'patient' }) {
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("user_role");
  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  // ── 회원가입 ───────────────────────────────────────────────────
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/register/doctor",
    element: <DoctorRegisterPage />,
  },
  {
    path: "/register/patient",
    element: <PatientRegisterPage />,
  },
  // ── 의사 ──────────────────────────────────────────────────
  {
    path: "/doctor",
    element: <PrivateRoute role="doctor"><DoctorLayout><DashboardPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/record",
    element: <PrivateRoute role="doctor"><DoctorLayout><RecordDetailPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/patients",
    element: <PrivateRoute role="doctor"><DoctorLayout><PatientListPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/patients/:patientId",
    element: <PrivateRoute role="doctor"><DoctorLayout><PatientDetailPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/patients/:patientId/records",
    element: <PrivateRoute role="doctor"><DoctorLayout><PatientRecordsPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/approve",
    element: <PrivateRoute role="doctor"><DoctorLayout><PatientApprovalPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/common-questions",
    element: <PrivateRoute role="doctor"><DoctorLayout><CommonQPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/ai-questions",
    element: <PrivateRoute role="doctor"><DoctorLayout><AIReviewPage /></DoctorLayout></PrivateRoute>,
  },
  {
    path: "/doctor/mypage",
    element: <PrivateRoute role="doctor"><DoctorLayout><DoctorMyPage /></DoctorLayout></PrivateRoute>,
  },
  // ── 환자 ──────────────────────────────────────────────────
  {
    path: "/patient",
    element: <PrivateRoute role="patient"><RecordListPage /></PrivateRoute>,
  },
  {
    path: "/patient/record",
    element: <PrivateRoute role="patient"><RecordSubmitPage /></PrivateRoute>,
  },
  {
    path: "/patient/survey/common",
    element: <PrivateRoute role="patient"><CommonSurveyPage /></PrivateRoute>,
  },
  {
    path: "/patient/survey/ai",
    element: <PrivateRoute role="patient"><AiSurveyPage /></PrivateRoute>,
  },
  {
    path: "/patient/survey/done",
    element: <PrivateRoute role="patient"><SurveyDonePage /></PrivateRoute>,
  },
  {
    path: "/patient/mypage",
    element: <PrivateRoute role="patient"><PatientMyPage /></PrivateRoute>,
  },
]);


export default router;
