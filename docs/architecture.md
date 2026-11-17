# 프론트엔드 아키텍처

- 데이터 흐름: 컴포넌트 → `src/hooks/` → `src/api/<domain>.ts` → `src/api/client.ts` → 백엔드.
- 서버 데이터는 TanStack Query, 인증 식별 정보는 Zustand의 기존 패턴을 따른다.
- UI·API 변경 시 로딩·빈 상태·오류·성공·오래된 데이터와 모바일 접근성을 검토한다.
- 사용 라이브러리와 명령은 `package.json`, 실제 소스와 테스트를 기준으로 한다.

[API 계층](api-layer.md), [API 연동](api-integration.md), [테스트](testing.md)를 참조한다.
