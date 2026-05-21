# 구글 애드센스(AdSense) 하이브리드 연동 설계 (Spec)

## 1. 개요 (Overview)
본 문서는 Stockwellness 프론트엔드에 구글 애드센스를 통합하기 위한 최종 설계를 정의합니다. 수동 배치(Manual Placement)의 정교한 UX 제어와 구글 AI 자동 광고(Auto Ads)의 수익성 극대화를 결합한 **하이브리드 전략**을 채택합니다.

## 2. 연동 전략: 하이브리드(Hybrid)

### 2.1 수동 배치 (정밀 제어)
사용자의 시선이 집중되는 핵심 영역에 고정적으로 배치하여 가독성을 해치지 않으면서 노출을 확보합니다.
*   **인피드(In-feed):** 홈 화면 랭킹 리스트, 검색 결과 리스트 중간에 삽입.
*   **인아티클(In-article):** 종목 상세 페이지의 메인 차트와 재무 데이터 섹션 사이에 삽입.

### 2.2 자동 광고 (수익 최적화)
구글 AI가 페이지 구조를 분석하여 최적의 시점과 위치에 추가 광고를 노출합니다.
*   **모바일 앵커 광고:** 화면 하단에 띠 형태로 상주.
*   **전면 광고(Vignette):** 페이지 전환 시 사용자 흐름을 방해하지 않는 선에서 노출.

## 3. 상세 설계 (Technical Design)

### 3.1 설정 관리 (`src/config/adsense.ts`)
애드센스 클라이언트 ID 및 슬롯 ID를 중앙 집중식으로 관리합니다.
```typescript
export const ADSENSE_CONFIG = {
  clientId: "ca-pub-XXXXXXXXXXXX",
  slots: {
    homeInFeed: "1111111111",     // 홈 화면 랭킹 리스트용
    searchInFeed: "2222222222",   // 검색 결과 리스트용
    detailInArticle: "3333333333" // 종목 상세 본문용
  },
  isDevelopment: import.meta.env.DEV
};
```

### 3.2 공통 광고 컴포넌트 (`src/app/components/shared/AdUnit.tsx`)
광고 유닛을 캡슐화하고 레이아웃 안정성을 확보합니다.
*   **CLS(Cumulative Layout Shift) 방지:** `type`별로 `min-height`를 명시적으로 설정하여 광고 로드 전 공간 확보.
    *   `in-feed`: `min-height: 120px`
    *   `in-article`: `min-height: 280px`
*   **스켈레톤(Skeleton):** 광고 로딩 중 배경색이 있는 박스 또는 스켈레톤 UI 노출.
*   **개발 모드 대응:** `isDevelopment`가 true일 경우 실제 광고 요청 대신 'Ad Placeholder' 텍스트가 포함된 테스트용 UI 렌더링.

### 3.3 주입 유틸리티 (`src/utils/array-inject.ts`)
리스트 데이터 사이에 광고 객체를 동적으로 삽입하는 헬퍼 함수를 구현합니다.
```typescript
export function injectAds<T>(items: T[], interval: number = 4): (T | { isAd: true })[] {
  const result: (T | { isAd: true })[] = [];
  items.forEach((item, index) => {
    result.push(item);
    if ((index + 1) % interval === 0) {
      result.push({ isAd: true });
    }
  });
  return result;
}
```

### 3.4 엔트리 포인트 통합 (`index.html`)
구글 애드센스 기본 스크립트를 비동기(`async`)로 로드하여 초기 렌더링 성능 저하를 방지합니다.

## 4. 보안 및 운영 가이드라인

*   **부정 클릭 방지:** 개발 환경에서는 실제 광고를 노출하지 않으며, 운영 환경에서도 직접적인 클릭 테스트를 금지합니다.
*   **정책 준수:** 버튼, 입력란 등 주요 상호작용 UI 요소와 광고 사이에 충분한 여백(최소 20px)을 확보하여 오클릭을 방지합니다.
*   **성능 모니터링:** 광고 로드가 Lighthouse 성능 점수(특히 LCP, CLS)에 미치는 영향을 주기적으로 모니터링합니다.

## 5. 단계별 구현 계획
1.  애드센스 설정 파일 및 주입 유틸리티 생성
2.  `AdUnit` 공통 컴포넌트 구현 (스켈레톤 및 개발 모드 포함)
3.  `Home`, `Search` 화면 리스트 주입 로직 적용
4.  `StockDetail` 차트 영역 하단 고정 배치
5.  `index.html` 스크립트 추가 및 전체 동작 확인
