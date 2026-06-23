# CAPD Frontend

> **복막투석 AI 기록 검토 시스템 — 웹 클라이언트**

복막투석(CAPD) 환자의 일일 기록 입력·조회와 AI 생성 후속 질문을 제공하는 의료 지원 웹 인터페이스입니다.

🔗 [백엔드 레포](https://github.com/KimDimension/backend) · [AI 레포](https://github.com/KimDimension/ai)

---

## 시스템 개요

```
환자 기록 입력 (Frontend)
        ↓
  FastAPI Backend
        ↓
규칙 기반 탐지 (KDIGO 가이드라인)
        ↓
부족 시 → RAG (pgvector) → Qwen2.5-3B → 맞춤 후속 질문 생성
        ↓
  결과 화면 표시 (Frontend)
```

---

## 주요 기능

- **일일 기록 입력** — 복막투석 일지(투석액 교환량, 배출량, 체중, 혈압 등) 폼 입력
- **AI 후속 질문 조회** — 백엔드 분석 결과(규칙 탐지 + RAG 생성 질문) 화면 표시
- **기록 이력 조회** — 환자별 일별 기록 목록 및 상세 조회
- **반응형 UI** — 병원 현장에서 태블릿·PC 모두 사용 가능

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **언어** | TypeScript |
| **Framework** | React · Vite (또는 Next.js — 환경에 따라 기재) |
| **스타일링** | Tailwind CSS |
| **HTTP** | Axios |
| **배포** | Docker · GCP Cloud Run |

---

## 시작하기

### 요구 사항

- Node.js 18+
- 백엔드 API 서버 실행 중

### 환경 변수

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 설치 및 실행

```bash
npm install
npm run dev
```

### 빌드 & Docker

```bash
npm run build

# Docker 이미지 빌드
docker build -t capd-frontend .
docker run -p 3000:3000 capd-frontend
```

---

## 프로젝트 구조

```
src/
├── api/          # API 호출 함수 (백엔드 연동)
├── components/   # 공통 UI 컴포넌트
├── pages/        # 라우트별 페이지 (기록 입력 / 결과 / 이력)
├── hooks/        # Custom Hooks
├── types/        # TypeScript 타입 정의
└── utils/        # 공통 유틸
```

---

## 관련 레포

| 레포 | 설명 |
|------|------|
| [backend](https://github.com/KimDimension/backend) | FastAPI · PostgreSQL+pgvector · RAG 파이프라인 |
| [ai](https://github.com/KimDimension/ai) | Qwen2.5 모델 서빙 · sentence-transformers |

---

## 팀

**KimDimension (CAPD)** — 복막투석 AI 기록 검토 시스템 개발팀
