# 🚀 유지보수성 향상을 위한 표준화 구현 계획 (2단계)

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 핵심 주식 계산 로직을 중앙화하고, API 통신 패턴을 표준화하며, 공통 UI 컴포넌트를 추출하여 프로젝트 전반의 가독성을 높입니다.

**Architecture:** 순수 함수 기반의 계산 유틸리티 구축, Axios 인터셉터 고도화, 원자적(Atomic) 디자인 원칙을 적용한 공통 컴포넌트 추출.

**Tech Stack:** React 19, React Query 5, Axios, Tailwind CSS 4.0

---

## ## Chunk 3: 비즈니스 로직 및 API 표준화

### Task 5: 핵심 주식 계산 로직 중앙화

**Files:**
- Modify: `src/utils/calculate.ts`

- [ ] **Step 1: 수익률 및 등락 계산 함수 작성**
- [ ] **Step 2: 커밋**
  - `git add src/utils/calculate.ts && git commit -m "refactor: #9 핵심 주식 계산 로직 중앙화"`

### Task 6: API 통신 패턴 표준화

**Files:**
- Modify: `src/api/client.ts`
- Create: `src/api/utils/error-handler.ts`

- [ ] **Step 1: Axios 인터셉터 에러 처리 고도화**
- [ ] **Step 2: 커밋**
  - `git add src/api/ && git commit -m "refactor: #10 API 통신 패턴 및 에러 핸들링 표준화"`

---

## ## Chunk 4: 공통 UI 컴포넌트 추출 및 전역 적용

### Task 7: 공통 UI 컴포넌트 추출

**Files:**
- Create: `src/app/components/shared/label/PriceTrendLabel.tsx`
- Create: `src/app/components/shared/card/DashboardCard.tsx`

- [ ] **Step 1: `PriceTrendLabel` 컴포넌트 구현 (상승/하락 색상 및 아이콘 자동 적용)**
- [ ] **Step 2: `DashboardCard` 컴포넌트 구현 (공통 카드 레이아웃)**
- [ ] **Step 3: 커밋**
  - `git add src/app/components/shared/ && git commit -m "refactor: #11 공통 UI 컴포넌트 라이브러리 추출"`

### Task 8: 전체 화면 마이그레이션 및 최종 클린업

**Files:**
- Modify: `src/app/components/screens/Portfolio.tsx`
- Modify: `src/app/components/screens/StockDetail.tsx`

- [ ] **Step 1: `Portfolio` 화면에 신규 패턴 적용**
- [ ] **Step 2: `StockDetail` 화면에 신규 패턴 적용**
- [ ] **Step 3: 커밋**
  - `git add src/app/components/screens/ && git commit -m "refactor: #12 전체 화면 표준화 적용 및 코드 클린업"`
