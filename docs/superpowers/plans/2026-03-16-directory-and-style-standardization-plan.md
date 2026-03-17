# 🚀 유지보수성 향상을 위한 디렉토리 및 스타일 표준화 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트의 유지보수성과 가독성을 높이기 위해 혼합 방식(Mixed Approach)의 디렉토리 구조를 재정립하고, 시멘틱 컬러 시스템을 구축합니다.

**Architecture:** 전역 유틸리티와 도메인 유틸리티를 분리하고, 하드코딩된 색상을 테마 상수로 추상화하여 Tailwind 4.0과 연동합니다.

**Tech Stack:** React 19, Tailwind CSS 4.0, TypeScript

---

## ## Chunk 1: 기초 인프라 및 스타일 시스템 구축

### Task 1: 시멘틱 테마 상수 정의 및 폴더 생성

**Files:**
- Create: `src/styles/theme.ts`
- Create: `src/api/utils/.gitkeep`
- Create: `src/utils/format.ts`
- Create: `src/utils/calculate.ts`

- [ ] **Step 1: `src/styles/theme.ts` 작성**
- [ ] **Step 2: 폴더 구조 생성 및 유틸리티 파일 초기화**
- [ ] **Step 3: 커밋**
  - `git add src/styles/theme.ts src/utils/ && git commit -m "style: #7 시멘틱 테마 상수 정의 및 디렉토리 구조 재편성"`

### Task 2: Tailwind CSS 4.0 테마 연동

**Files:**
- Modify: `src/styles/index.css`

- [ ] **Step 1: `src/styles/index.css`에 CSS 변수 및 @theme 정의 추가**
- [ ] **Step 2: 커밋**
  - `git add src/styles/index.css && git commit -m "style: #7 시멘틱 컬러와 Tailwind 4.0 테마 연동"`

---

## ## Chunk 2: 전역 유틸리티 구현 및 1차 적용

### Task 3: 전역 포맷팅 유틸리티 구현

**Files:**
- Modify: `src/utils/format.ts`

- [ ] **Step 1: 통화 및 퍼센트 포맷터 작성**
- [ ] **Step 2: 커밋**
  - `git add src/utils/format.ts && git commit -m "refactor: #8 전역 데이터 포맷팅 유틸리티 구현"`

### Task 4: 홈 화면(`Home.tsx`) 리팩토링 및 검증

**Files:**
- Modify: `src/app/components/screens/Home.tsx`

- [ ] **Step 1: 하드코딩된 색상 및 포맷팅 로직 교체**
- [ ] **Step 2: 커밋**
  - `git add src/app/components/screens/Home.tsx && git commit -m "refactor: #12 홈 화면 코드 표준화 및 리팩토링 적용"`
