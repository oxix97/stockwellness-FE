# Specification: Watchlist API Integration & UI Implementation

## 1. Overview
사용자가 자신의 관심 종목을 그룹별로 분류하고, 각 종목의 현재가, 등락률, RSI 및 AI 통찰(Insight)을 한눈에 파악할 수 있는 Watchlist(관심 종목) 기능을 구현합니다. 백엔드 API 명세(`watchlist.md`)를 기반으로 프론트엔드 연동 및 모바일 친화적인 UI를 구축합니다.

## 2. Functional Requirements
- **그룹 관리 (Group Management):**
  - 새로운 관심 종목 그룹을 생성할 수 있어야 합니다. (`POST /groups`)
  - 기존 그룹 목록을 조회할 수 있어야 합니다. (`GET /groups`)
  - 그룹의 이름을 수정할 수 있어야 합니다. (`PATCH /groups/{groupId}`)
  - 그룹을 삭제할 수 있어야 합니다. (`DELETE /groups/{groupId}`)
- **종목 관리 (Item Management):**
  - 선택된 그룹에 새로운 종목(티커)을 추가할 수 있어야 합니다. (`POST /groups/{groupId}/items`)
  - 그룹 내 특정 종목을 삭제할 수 있어야 합니다. (`DELETE /groups/{groupId}/items/{ticker}`)
- **메모 및 목록 표시 (Note Editing & List Display):**
  - 추가된 각 종목에 대한 사용자 개인 메모를 수정할 수 있어야 합니다. (`PATCH /groups/{groupId}/items/{ticker}/note`)
  - 그룹 내 종목 리스트 조회 시, 각 종목의 현재가, 등락률, RSI 지표, AI 통찰 등을 표시해야 합니다. (`GET /groups/{groupId}/items`)

## 3. Non-Functional Requirements & UI/UX
- **UI/UX (그룹 네비게이션):** 모바일 사용자 경험(UX)을 고려하여 여러 관심 그룹 간의 이동은 화면 하단에서 올라오는 **바텀 시트(Bottom Sheet)** 형태로 구현합니다.
- **상태 업데이트 (Mutation UX):** 종목 추가/삭제, 그룹 변경 등 데이터 변경(Mutation) 작업 발생 시 **낙관적 업데이트(Optimistic Updates)** 방식을 적용하여, 즉각적인 UI 반응성을 확보하고 API 호출 실패 시 원래 상태로 롤백합니다.
- **에러 핸들링:** API 통신 중 에러 발생 시 (e.g., 존재하지 않는 그룹 ID, 인증 실패 등) `sonner` 토스트 알림을 통해 사용자에게 적절한 안내 메시지를 제공합니다.
- **인증:** 모든 API 요청 헤더에 `Authorization: Bearer {JWT_TOKEN}`이 자동으로 포함되도록 기존 인터셉터 로직을 준수합니다.

## 4. Acceptance Criteria
- [ ] 그룹 생성, 조회, 수정, 삭제가 모두 정상적으로 동작한다.
- [ ] 특정 그룹에 종목을 추가하고, 종목 리스트에서 해당 종목의 상세 정보(RSI, AI 인사이트 등)가 정확히 표시된다.
- [ ] 종목 삭제 및 메모 수정 기능이 정상적으로 동작한다.
- [ ] 바텀 시트를 통해 사용자 관심 그룹을 원활하게 변경할 수 있다.
- [ ] 항목 추가/삭제, 그룹명 변경 시 UI가 즉시 반영(Optimistic Update)되며, 네트워크를 의도적으로 끊었을 때 에러 토스트 표시 및 이전 상태로 롤백된다.

## 5. Out of Scope
- 종목 검색 시 실시간 자동완성 기능 개선 (별도의 Search 트랙으로 분리)
- 종목 상세 페이지(차트 등) 렌더링 (이 트랙에서는 리스트 표시까지만 구현)