# 포트폴리오 및 백테스팅 화면 코드 리뷰 계획

## 1. 개요
서비스의 핵심 가치인 '자산 배분 시뮬레이션'과 '포트폴리오 관리'의 구현 무결성을 검증하고, 복잡한 계산 및 차트 렌더링 로직의 최적화 상태를 점검함.

## 2. 주요 검토 대상
### [포트폴리오 화면]
- **CRUD 로직**: 포트폴리오 생성, 수정, 삭제 시의 TanStack Query 캐시 무효화(`invalidateQueries`) 및 낙관적 업데이트 적용 여부.
- **자산 배분 차트**: Recharts를 이용한 자산 비중 시각화의 정확성 및 반응형 대응.
- **데이터 일관성**: 서버 응답 데이터(`PortfolioResponse`)와 UI 상태 간의 매핑 로직.

### [백테스팅 화면]
- **설정(Setup)**: Zod를 이용한 백테스트 파라미터(기간, 초기 자본, 리밸런싱 주기 등) 유효성 검사.
- **결과(Result)**: 수익률 차트(Drawdown, CAGR)의 정확성과 대량 데이터 렌더링 성능.
- **공통**: 복잡한 비즈니스 로직의 훅(`use-portfolio`, `use-backtest`) 분리 및 추상화 수준.

## 3. 세부 조사 단계
### 1단계: 코드 및 명세 리서치
- [x] `src/app/components/screens/Portfolio.tsx`, `BacktestSetup.tsx`, `BacktestResult.tsx` 구조 파악.
- [x] `src/hooks/use-portfolio.ts`, `use-backtest.ts` 비즈니스 로직 분석.
- [x] `src/api/portfolio.ts` API 계약 확인.

### 2단계: UI/UX 및 안정성 검토
- [x] 입력 폼의 유효성 검사 피드백(Error 메시지, 버튼 활성화 상태).
- [x] 데이터 페칭 중 Skeleton UI 또는 Loading Spinner 적용 여부.
- [x] 에러 발생 시 ErrorBoundary 또는 Toast 알림 처리.

### 3단계: 성능 및 아키텍처 검토
- [x] 차트 컴포넌트의 불필요한 리렌더링 방지(`useMemo`, `React.memo`).
- [x] 대형 백테스트 데이터 처리 시의 메인 스레드 점유율 및 최적화 가능성.

### 4단계: 결과 보고 및 수정 계획
- [x] `code-review.md`에 결함(BLOCKER/MAJOR/MINOR) 병합.
- [x] 수정 우선순위 설정 및 작업 착수.
