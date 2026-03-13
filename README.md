# 🌿 Stockwellness (스탁웰니스)
> **"주식 시장이 잠든 사이, 당신의 포트폴리오는 더 건강해집니다."**

Stockwellness는 요동치는 장중의 소음에서 벗어나, **하루의 장이 마감된 후(Post-Market)** 자신의 투자 성과를 차분하게 복기하고 포트폴리오의 건강 상태를 점검하는 **'포트폴리오 애프터 케어(After-Care)'** 서비스입니다.

---

## ✨ 서비스 핵심 가치

*   **🌙 Closing Ritual:** 장 마감 후 업데이트된 데이터를 기반으로 하루의 매매를 복기하고 내일의 전략을 세웁니다.
*   **🩺 Health Diagnosis:** 자산 배분, 리스크, 수익률을 종합 분석하여 직관적인 '건강 점수'와 등급을 부여합니다.
*   **🧪 Strategy Lab:** 복잡한 코딩 없이 클릭 몇 번으로 나만의 투자 전략을 과거 데이터로 검증(Backtest)합니다.
*   **🧘 Healing UX:** 눈이 편안한 그린 톤의 UI와 부드러운 애니메이션으로 투자 피로도를 낮춘 금융 경험을 제공합니다.

---

## 🛠 기술 스택 (Technical Stack)

*   **Core:** `React 19`, `Vite 6`, `TypeScript 5.9`
*   **UI/UX:** `Tailwind CSS 4.0`, `Framer Motion`, `Radix UI`
*   **State:** `TanStack Query v5` (Server), `Zustand` (Global/Auth)
*   **Form:** `React Hook Form`
*   **Charts:** `Recharts`
*   **Infra:** `Docker`, `Nginx`, `GitHub Actions`

---

## 🏁 시작하기 (Getting Started)

### 1. 사전 요구사항 (Prerequisites)
*   **Node.js:** v20.x 이상 권장
*   **Package Manager:** `npm` (또는 `yarn`, `pnpm`)

### 2. 환경 변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 다음 변수를 설정합니다.
```bash
# API 서버 주소
VITE_API_BASE_URL=https://api.stockwellness.com

# 앱 명칭 (기본값: Stockwellness)
VITE_APP_NAME=Stockwellness
```

### 3. 설치 및 실행
```bash
# 의존성 설치
npm install

# 로컬 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 📁 프로젝트 구조 (Project Structure)

*   `src/api/`: API 클라이언트 및 엔드포인트 함수 (Axios 기반)
*   `src/app/components/ui/`: 아토믹 디자인 기반의 공통 UI 컴포넌트
*   `src/app/components/screens/`: 각 경로(Route)별 독립적인 페이지 화면
*   `src/hooks/`: 비즈니스 로직 및 API 연동 캡슐화 (Custom Hooks)
*   `src/store/`: 인증 정보 및 글로벌 UI 상태 관리 (Zustand)
*   `src/styles/`: Tailwind CSS 테마 및 글로벌 스타일

---

## 📐 개발 가이드라인 (Development Guidelines)

### 1. 컴포넌트 작성 원칙
*   **관심사 분리:** UI 렌더링은 `components`에서, 비즈니스 로직 및 데이터 패칭은 `hooks`에서 담당합니다.
*   **Atomic UI 활용:** 새로운 UI를 만들 때 `src/app/components/ui`에 있는 기존 컴포넌트를 우선적으로 조합하여 작성합니다.
*   **파일명 규칙:** 컴포넌트는 `PascalCase.tsx`, 훅은 `use-camelCase.ts` 형식을 따릅니다.

### 2. 디자인 시스템 및 UI 규칙
*   **레이아웃:** 절대 좌표(`absolute`) 사용을 지양하고, `Flex`와 `Grid` 기반의 반응형 레이아웃을 기본으로 합니다.
*   **타이포그래피:** 기본 폰트 크기는 `14px`를 기준으로 하며, 중요한 지표는 포인트 컬러를 사용합니다.
*   **데이터 포맷:** 날짜 형식은 항상 `Jun 10`과 같이 월/일 영문 약어 형식을 따릅니다.
*   **컴포넌트 제약:**
    *   하단 툴바(Bottom Toolbar)는 최대 4개의 아이템만 허용합니다.
    *   칩(Chips)은 의미 있는 비교를 위해 3개 이상의 세트로 구성합니다.
    *   드롭다운(Dropdown) 메뉴는 선택지가 3개 이상일 때만 사용합니다.

### 3. 상태 관리 및 API 통신
*   **서버 상태:** 모든 API 데이터는 `TanStack Query`를 통해 관리하며, 캐싱 및 로딩/에러 처리를 일관되게 적용합니다.
*   **전역 상태:** 인증(`Auth`) 및 테마와 같이 전역적으로 공유가 필요한 상태에 한해서만 `Zustand`를 사용합니다.
*   **에러 핸들링:** 사용자 경험을 위해 `ErrorBoundary`와 `sonner`(토스트 알림)를 적극 활용합니다.
