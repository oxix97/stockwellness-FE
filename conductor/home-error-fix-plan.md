# 홈 화면 에러 발생 요인 분석 및 대응 계획

## 1. 분석 결과 (에러 취약점)

### 1.1. 런타임 크래시 위험 (Runtime Crash)
- **`getSectorIcon` (HomeCard.tsx)**: `name.toLowerCase()` 호출 시 `name`이 `null`이나 `undefined`일 경우 참조 에러(TypeError)가 발생하여 전체 화면이 크래시될 수 있습니다. 현재 `SupplyCard`와 `Home.tsx` 메인 렌더링 루프에서 `sector.sectorName`을 직접 전달하고 있어 위험 요소입니다.
- **`formatCurrency` (format.ts)**: `value.toLocaleString()` 호출 시 `value`가 `undefined`일 경우 크래시가 발생합니다. 현재 `AssetSummaryCard`에서 기본값(`?? 0`)을 사용하고 있어 안전해 보이나, API 응답 타입이 보장되지 않을 경우 위험할 수 있습니다.

### 1.2. 데이터 정합성 및 UX 저해 요인
- **`formatPercent` (format.ts)**: 숫자가 아닌 값이 들어올 경우 `NaN%`가 화면에 노출될 수 있습니다.
- **`useSector` 훅의 지연 로딩**: `ranking` 데이터는 로드되었으나 `details` (병렬 쿼리)가 아직 초기화되지 않은 짧은 순간에 `details[index]`가 `undefined`가 되어 일시적으로 빈 데이터를 보여줄 수 있습니다. (현재 선택적 체이닝으로 방어는 되어 있으나 UX상 개선 여지 있음)
- **Recharts 미사용 임포트**: `MarketIndexCard.tsx`에서 `recharts` 모듈을 임포트하고 있으나 실제 JSX에서 사용하지 않고 있어 번들 크기에 영향을 줄 수 있습니다.

## 2. 대응 계획 (Strategy)

### 2.1. 유틸리티 함수 방어 코드 강화
- `getSectorIcon`에 `name` 존재 여부 체크 및 `Optional Chaining` 적용.
- `formatCurrency`, `formatPercent`에 비정상적인 값(`NaN`, `null`, `undefined`)에 대한 Fallback 로직 추가.

### 2.2. 컴포넌트 안전성 보강
- `Home.tsx` 및 하위 섹션 컴포넌트에서 데이터 매핑 시 필수 필드(`sectorName`, `fluctuationRate` 등)에 대한 기본값 처리를 강화합니다.
- `SupplyDemandSection` 등에서 `Math.max` 호출 전 데이터 유효성 검증을 강화합니다.

### 2.3. 코드 정리
- `MarketIndexCard.tsx`의 미사용 Recharts 임포트 제거.

## 3. 구현 단계 (Implementation)

1. `src/utils/format.ts` 수정: `formatCurrency`, `formatPercent` 방어 로직 추가.
2. `src/app/components/home/HomeCard.tsx` 수정: `getSectorIcon` 방어 로직 추가.
3. `src/app/components/home/MarketIndexCard.tsx` 수정: 미사용 임포트 제거.
4. (필요 시) `src/hooks/use-sector.ts` 수정: `combinedData` 생성 로직 안정성 보강.

## 4. 검증 계획 (Validation)
- [ ] 단위 테스트를 통해 `format` 유틸리티에 `null`/`undefined` 주입 시 크래시 여부 확인.
- [ ] 홈 화면 진단 도구를 통해 비정상 API 응답 시뮬레이션 시 화면 크래시 여부 확인.
