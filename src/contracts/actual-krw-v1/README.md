# ACTUAL_KRW_V1 — BE-01/FE-01 공통 계약 전달 묶음

작성일: 2026-10-03 · 제품 정책: 승인 · 기술 계약: **1.0.0 기술 계약 동결 / BE·FE 수락 완료**

[제품 계약](../../specs/2026-10-03-actual-investment-p0-decisions.md) · [OpenAPI](openapi.json) · [생성 TypeScript 타입](types.generated.ts) · [FE 참조 alias](types.reference.ts) · [fixture 목록](fixtures/manifest.json) · [금융 golden fixture](golden-ledger.json) · [스키마 검증 스크립트](verify.mjs)

## 목적·범위·동결 상태

사용자가 기록한 거래가 BE의 원장·계산 결과와 FE의 화면에서 동일한 단위·날짜·상태·버전으로 표현되도록 한다. 승인된 금융 의미를 바꾸지 않고 구현자가 합의할 수 있는 계약과 합성 검증 데이터를 제공한다. P0-A 계약과 P0-B 의존 계약을 함께 준비하되 후자를 실제 공급 가능 API라고 선언하지 않는다.

현재는 PO 산출물 작성과 로컬 정적 검증까지 완료했다. 이 작업 공간에서 BE/FE 소유자의 기술 수락 또는 구현·런타임 검증을 대신하지 않는다. 하위 저장소 앱 코드를 수정하지 않았다. BE-01의 서버 계약 동결·FE-01의 client/types/query 격리 구현 전체가 완료된 것은 아니다. BE F01–F03 및 FE F01–F02의 최종 수락을 확인해 2026-10-03 `1.0.0`으로 동결했다. F04/F05 실제 앱 구현·검증은 이후 완료 조건이다. 제품 정책은 이미 ACTUAL_KRW_V1이며 재승인을 반복 요구하지 않는다.

## 대조한 기존 코드와 호환성

- BE `global/common/response/ApiResponse.java`: success/status/code/message/data/timestamp/traceId/errors, `NON_NULL` envelope. 성공은 S000(200)/S001(201), 생성 시간은 LocalDateTime이다.
- BE `global/error/ErrorCode.java`, `GlobalExceptionHandler.java`: G001 입력, G003 미발견, G004 내부 오류, A001/A003/A004 인증. 신규 actual 도메인 I001–I009는 기존 목록과 충돌하지 않는 **후보**, 미구현이다.
- BE `config/SecurityConfig.java`: 기존 portfolios/watchlist/members 등만 authenticated, 나머지는 permitAll. 신규 actual 모든 경로(카탈로그 포함)의 인증 matcher 추가를 필수 인계 조건으로 둔다.
- BE PortfolioValuationResponse는 기존 Number·HALF_UP와 각 스케일을 사용한다. 신규 actual string·HALF_EVEN으로 바꾸면서 기존 응답의 의미·반올림을 변경하지 않는다.
- FE `src/api/client.ts`: baseURL=/api, 호출은 /v1/...; 성공은 data unwrap, 401 재발급 재시도. 통신용 fixture는 envelope 전체, 컴포넌트용 fixture는 그 data를 사용한다. 민감한 원장 요청의 재시도는 기존 idempotency key를 유지해야 한다.
- FE `src/types/api.ts`: operation 기반 생성 타입, 기존 금융 Number. 신규 타입은 동일 생성 흐름에 별도로 편입하고 DecimalString canonical 값을 유지한다. 기존 타입을 광역 교체하지 않는다.
- 공통 명세의 localStorage 요청 인터셉터 설명보다 실제 accessToken store 주입 코드가 기준이다. 이번 작업은 인증 로직을 변경하지 않는다.

## 경로·요청·응답 후보

Base URL `/api/v1`; 모든 신규 operation Bearer 인증. FE client에서는 아래 경로에 `/v1`을 붙여 기존 `/api` base를 사용한다.

| 단계 | 메서드·경로 | 요청 | 성공 data/HTTP |
|---|---|---|---|
| A | GET /investment-accounts | 없음 | Account[] / 200 |
| A | POST /investment-accounts | AccountCreate, Idempotency-Key | Account / 201 |
| A | GET /investment-accounts/{accountId} | 없음 | Account / 200 |
| A | PATCH /investment-accounts/{accountId} | AccountRename, If-Match, Idempotency-Key | Account / 200 |
| A | GET /investment-accounts/{accountId}/ledger | page=0,size=20,view=ACTIVE 또는 ALL | LedgerPage / 200 |
| A | POST /investment-accounts/{accountId}/ledger | LedgerInput, If-Match, Idempotency-Key | MutationReceipt / 201 |
| A | POST /investment-accounts/{accountId}/ledger/{entryId}/corrections | reason+replacement, 두 헤더 | MutationReceipt / 201 |
| A | POST /investment-accounts/{accountId}/ledger/{entryId}/cancellations | reason, 두 헤더 | MutationReceipt / 201 |
| A | GET /investment-accounts/{accountId}/summary | 없음 | Summary / 200 |
| A | GET /investment-accounts/{accountId}/holdings | 없음 | Holdings / 200 |
| B | GET /comparison-targets | 없음 | Catalog / 200 |
| B | POST /investment-accounts/{accountId}/comparisons | period,targets(1–2개,중복금지) | Comparison / 200 |

개인 계정 응답은 Cache-Control: no-store이며 ETag/304를 제공하지 않는다. If-Match는 응답 본문의 accountVersion을 quoted decimal로 보낸 낙관적 잠금 토큰이다. 가격·timestamp가 변하는 전체 표현의 HTTP validator로 해석하지 않는다. accountVersion은 이름·원장 쓰기에 증가하고 ledgerVersion은 원장 변경에만 증가한다. calculationVersion은 평가 결과가 반영한 ledgerVersion이며 미완료는 null이다. ledgerVersion과 calculationVersion이 다르면 새 금융 결과를 정상 최신값으로 반환하지 않는다.

소유자 조회 범위 밖 account/entry와 없는 account/entry는 동일 G003·404다. 신규 actual 조회가 타인 존재를 드러내지 않도록 owner 조건을 조회에 적용한다. 기존 portfolio 403 동작을 바꾸는 요청은 아니다. entry가 account에 속하는지도 검사한다. 개인 cache key에는 인증 사용자/계정/요청조건/ledgerVersion/policyVersion을 포함한다. 서버가 클라이언트 memberId를 소유권 근거로 받지 않는다.

원장 기본 정렬은 occurredOn DESC, sequence DESC, entryId DESC; 재생은 발생일+순번 ASC다. ACTIVE는 현재 유효 거래만, ALL은 취소/대체 이력을 포함한다. 페이지를 넘기는 사이 ledgerVersion이 달라지면 FE는 이전 페이지를 무효화하고 첫 페이지부터 다시 읽는다. summary/holdings가 다른 ledgerVersion, calculationVersion, policyVersion, asOfDate 또는 marketDataVersion이면 결합 표시하지 않고 재조회한다. “같은 화면”이라는 이유로 버전 일치를 추정하지 않는다.

`ReadMeta.marketDataVersion`은 가격과 기업행위 평가 입력의 불변 snapshot 식별자다. 같은 ledgerVersion/asOfDate라도 종가·기업행위 입력이 정정되면 변경된다. BE는 동일 snapshot으로 summary/holdings를 계산하고 FE는 위 전체 조합이 같을 때만 결합한다. 식별자는 opaque string이며 클라이언트가 값을 계산/증가시키지 않는다. 가격이 필요 없는 빈 원장/현금전용 결과는 null일 수 있다. 가격 일부/전체가 누락된 snapshot도 평가 입력 버전이 있으면 해당 식별자를 제공하며 null을 신규 정상 평가로 간주하지 않는다. 시장 입력 갱신 중 새금융값을 만들지 않고 재계산 상태/사유를 제공한다. polling/refetch 결과의 식별자가 바뀌면 관련 금융 결과를 재조회한다. 서버 생성·보존 방식은 BE 책임이다.

보유 목록은 수량>0인 종목을 symbol ASC로 반환하고 전량 매도 종목은 원장에 남는다. 현금은 별도 필드다. GET summary는 현재 완료 EOD 기준의 평가이며 과거 평가 조회나 기초보유 입력 API를 추가하지 않는다. 거래일은 LocalDate(KRX 일정 검증), 신규 감사 createdAt은 offset 포함 ISO 시간이다. 기존 envelope timestamp는 timezone 없는 생성 시각이며 가격 기준일로 사용하지 않는다.

## DTO·null·decimal

DTO의 필수 필드/enum/nullable 규칙은 OpenAPI components와 생성 타입이 기준이다. 기존 envelope에서 data/traceId 생략은 허용하지만 성공 data는 항상 있고, 신규 DTO의 nullable 금융 값은 필드 생략 없이 JSON null로 직렬화한다. DTO에 envelope의 NON_NULL 설정이 전파되지 않는지 BE 직렬화 테스트가 필요하다.

각 금융 값은 `{value: DecimalString | null, reason: Reason | null}`이다. 값이 있으면 reason=null, 값이 없으면 reason 필수다. 수량은 QuantityValue, 금액/비율/Sharpe/성과 지수는 FinancialValue를 사용한다. 차트 point는 성공 시리즈의 동일 관측 구간만 제공하므로 소수6 값이 필수다. 실패 시리즈는 points=[]이며 모든 metrics에 null+사유다.

- 입력: 정수 주/원 string, 양수 필드는 0 거절. `001`, `+1`, `1e3`, `1.0`, 쉼표·공백·숫자 JSON은 거절한다. fee/tax는 "0" 명시 가능, 종목은 검색이 반환한 symbol 그대로 사용한다.
- 출력: 수량은 정수 string, 다른 금융값은 소수6 고정·HALF_EVEN. 음수0을 정규화한다. 부호 허용은 순입금(netDeposits)·손익·수익률·Sharpe이며 현금/수량/원가/가격/배분은 비음수, MDD는 [-100,0]이다. 부호/범위 상호 조건은 스키마 외 semantic 테스트도 필요하다.
- 내부: 계산 scale18 HALF_EVEN, 응답/표시 값을 다시 계산 입력으로 쓰지 않는다. FE는 decimal-aware formatting을 사용한다. 차트 number 변환만 별도로 허용하며 finite·범위 검증, 툴팁/표/수정요청 원문 보존이 필수다.

### 수치·요청 한도 후보 — F02

| 항목 | 기술 검토 후보 | 처리 |
|---|---|---|
| 입력/응답 금액 정수부 | 최대13자리, 입력0..9,999,999,999,999 | 실제 필드 양수/비음수 규칙 추가 |
| 보유 수량 | 최대9자리, 0..999,999,999주 | 거래 입력은 >0, 전량매도 잔여0 |
| 응답 금액/pct/Sharpe/지수 | 정수부13+소수6 | 계산 범위 초과는 null/NUMERIC_RANGE_EXCEEDED; 클램프 금지 |
| 내부 계산 | scale18, 정수부 최소 product/aggregate 수용 | DB precision/scale은 BE 설계; 기존 portfolio column 승계 금지 |
| 단일 거래·현재 잔액 | 거래 곱·비용·매도순액과 모든 prefix cash/Q/C 범위 검사 | 현금·수량·잔여원가 한도 초과는 I008/rollback |
| 평생 누적 집계 | 정확 BigDecimal 원본 재생, 임의13/22자리 cap 없음 | 누적 표시 범위 초과만으로 거래 거절 금지; 해당 출력만 null/NUMERIC_RANGE_EXCEEDED |
| ID/버전 | 0 또는1..Number.MAX_SAFE_INTEGER 숫자 | DB Long 전체범위를 무제한 JSON Number로 보내지 않음; 소유자 검토 |
| 이름/증권사 메모/사유 | 50/100/200 Unicode code point | 아래 동일 White_Space 집합 trim·code point 길이, FE/BE 일치 |
| 페이지/동일일 순번 | page0..2147483647,size1..100,sequence1..1,000,000 | size 기본20; 순번 충돌은409 |
| 비교 대상 | 1..2,KOSPI/KOSDAQ,중복금지 | 미지원 code는400 |

이 표는 승인된 금융 공식이 아닌 운영상 기술 수용범위의 후보다. 실제 저장·집계·차트 허용범위를 BE/FE 소유자가 수락해야 동결된다. 예상 가능한 투자 사용자 범위를 제한하는 제품 영향이 발견되면 PO에 반환한다. 입력 상한을 확정된 제품 승인으로 오인하지 않는다. JSON string이 JS number보다 큰 값을 표현할 수 있어도 차트에서 안전한 범위를 자동 보장하지 않는다.

### 문자 정규화와 화면 반올림 — 재검토 후보

이름·brokerLabel·정정 사유는 Unicode White_Space의 고정 집합(U+0009–000D,0020,0085,00A0,1680,2000–200A,2028,2029,202F,205F,3000)으로 양 끝만 trim한다. trim 뒤 이름/사유가 비면 G001, brokerLabel이 비면 null로 정규화한다. 그 뒤 Unicode code point 수로 길이를 검증하며 NFC나 문자열 내부 whitespace 변환을 도입하지 않는다. zero-width space/BOM은 이 trim 집합에 추가하지 않는다. schema minLength만으로 공백 이름을 수락하지 않도록 semantic fixture를 별도로 둔다.

표시는 서버 canonical 소수6 출력값을 권위 입력으로 HALF_EVEN(금액 원단위/평균단가·pct2자리) 반올림한다. 숨겨진 scale18로 직접 표시한 값과 서버6자리→화면 반올림값을 같다고 주장하지 않는다. 표시/tooltip은 decimal 원문 기준 formatter로 처리하고 차트만 좌표 근사 number를 사용한다. 좌표는 finite·명세정수부 범위를 확인하고 클램프·0-fill하지 않는다. 근사 좌표가 원문과 exact round-trip이라고 검증하지 않는다. 원장 입력·금융 계산으로 재사용하지 않는다.

## mutation·재시도·오류 후보

If-Match는 accountVersion의 quoted decimal string이다. Idempotency-Key는16..64 ASCII 영숫자/underscore/hyphen. key의 범위는 인증 사용자+계정(생성은 사용자)+operation이다. 동일 key/동일 canonical body/원래 If-Match 재전송은 처음 status/body를 반환한다. 재전송 시 현재 버전이 이미 증가해도 중복 쓰지 않도록 owner 검사 후 저장된 동일 요청을 먼저 확인하고 버전 검사는 새 요청에 적용한다. 서로 다른 body/If-Match로 key를 재사용하면409다. 새로운 사용자가 이전 사용자의 key로 응답을 재사용할 수 없다.

원장 mutation은 전체 검증/무효화·대체 기록/버전 증가가 원자적이다. 같은 accountVersion의 동시 두 요청은 하나만 성공한다. 과거 정정에 의존하는 모든 후속 이력을 검증하며 실패 시 원본과 버전을 유지한다. 취소된/대체된 entry의 새 정정은409, 동일 key 재전송은 기존 성공 결과다. account 생성/이름 수정의 idempotency 보존기간·정규화 세부사항은 F03에서 BE 검토한다. 소유자의 로그아웃 후에도 key만으로 개인정보가 반환되면 안 된다.

| HTTP·code 후보 | 의미 | 사용자/FE 동작 |
|---|---|---|
| 400 G001 | grammar/범위/enum/필수 헤더/미래일/거래일·통화·배당순액 오류 | 안전한 field errors, 입력 보존 |
| 401 A001/A003/A004 | 인증/만료/무효 | 기존 재발급/로그인 흐름, mutation key 유지 |
| 404 G003 | 없거나 소유권 범위 밖 account/entry | 같은 메시지, 존재 노출 없음 |
| 409 I001 | 버전 충돌 | 최신 accountVersion 조회, 사용자 변경 내용 보존 |
| 409 I002 | idempotency 다른 요청 재사용 | 새 요청 확인 후 새 key; 자동 무한 재시도 금지 |
| 409 I003/I004 | 현금/보유 초과 | 원장 유지, 해당 오류 표시 |
| 409 I005 | 기업행위 영향 등 원장 검토 필요 | 영향 범위 안내, 정상 내역 접근 유지 |
| 409 I006 | 같은 발생일 순번 충돌 | 순서 변경 재입력 |
| 409 I007 | 비활성 entry 정정/취소 | 최신 내역 조회 |
| 409 I008 | 원장/후속 결과 수치 범위 초과 | 부분 저장 없음, 범위 설명 |
| 409 I009 | 파생 결과 재계산 중에 허용되지 않는 추가 변경 | 최신 상태 확인; 허용 범위는 F03 |
| 500 G004 | 예기치 않은 서버 장애 | 원시 예외 없이 안전한 오류/traceId |

I 코드는 신규 예약 후보이며 현재 ErrorCode에 존재하지 않는다. 비밀값뿐 아니라 원장 전체/개인 투자 숫자를 errors.value에 복사하지 않는다. fixture의 rejected value는 safe placeholder로 축약하며 길이 제한을 적용한다. 상태·semantic null은 HTTP200 성공 응답 안에서 표현하고 가격/비교 이력 없음을 서버500으로 만들지 않는다. 외부 공급 장애는 해당 데이터 상태/사유로 구분하며 API 자체 오류를 빈 성공으로 위장하지 않는다.

## 두 상태 축과 계산 가능성

1. 입력 요청 실패는 정상 원장의 ledgerStatus를 INVALID로 바꾸지 않는다.
2. 승인된 mutation 뒤 즉시 계산 완료면 VALID 또는 REVIEW_REQUIRED/INVALID, 비동기이면 RECALCULATING이다. RECALCULATING에서는 새 결과에 의존하는 금융 필드는 null이다. previous calculationVersion을 최신으로 위장하지 않는다.
3. 갱신 완료 후 원장 재검증: 불변식 손상 INVALID > 기업행위/커버리지 미확인 REVIEW_REQUIRED > VALID. 갱신 중 RECALCULATING을 우선 표시하더라도 ledgerIssues는 남긴다.
4. valuationStatus는 필요한 가격이 모두 확보 COMPLETE, 일부 PARTIAL, 전부 미확보 UNAVAILABLE다. 필요한 가격0개는 COMPLETE. 가격 상태 COMPLETE와 계산 가능성은 다르다.
5. 기업행위는 영향 종목/기간/필드를 ledgerIssues에 기록한다. 독립 값/정상 과거 기간/무관 종목은 유지하고 의존 합계는 null로 차단한다. 사건이 현금에도 영향을 줄 수 있으면 cashBalance까지 차단한다. 미확인 사건을 수기 가짜 거래로 보정하지 않는다.
6. 실제 null 사유가 복수이면 ledgerIssues에 전체 사유를 제공하고 각 field reason은 무결성→재계산→필요 가격 누락→수치 범위→지표 관측조건 순으로 선택한다. 구체 전이·우선순위 기술 수락은 F03에 남긴다.

REVIEW_REQUIRED/COMPLETE, VALID/PARTIAL, RECALCULATING/COMPLETE를 각각 fixture로 제공했다. summary와 holdings 계산 시 허용 독립 필드와 의존 필드는 제품 계약의 산식에 따라 결정하며 ‘원장 조회 가능’을 ‘금융값 검증 완료’로 해석하지 않는다.

## P0-B 비교 계약

`metadata.returnMethod=ESTIMATED_DAILY_TWR`, `flowTimingAssumption=BEGINNING_OF_DAY`는 account 방법이다. benchmark는 공급자가 검증한 gross TR 시리즈다. 계정은 기록된 수수료/세금 차감·순배당 현금 유지, 시장 기준은 비용/세금 미차감·배당재투자다. FE에 이 두 기준을 명시한다.

period는1M/3M/6M/1Y/ALL. 요청/유효 기간·축소 사유는 공통 metadata다. 성공 account와 성공 benchmark의 날짜 배열은 동일하며 최소2관측점, 시작일 값0%다. 실패 대상은 사유·points=[]·null metrics를 반환한다. 계정 자체가 계산 불가면 모든 비교 성공을 차단하고 효과 범위=null로 반환한다. 가용 benchmark만 먼저 그려 실제 비교가 성공한 것처럼 표시하지 않는다.

창 내부 거래일 누락은 보간/제로 fill/교집합 제거로 숨기지 않는다. 실패 benchmark를 제외해 공통 구간을 재산출하되 account 실패는 필수 계열 실패다. 365일 미만 CAGR,20일 수익 미만 volatility/Sharpe,SD0 Sharpe는 null+사유다. MDD는 누적 수익지수 기반 음수 pct이며 input cash flow 변화로 계산하지 않는다. Rf는0% 가정, 연율252, calendar365 metadata가 포함된다.

catalog AVAILABLE은 provider/seriesId·이용권한·TR 검증·실제 availableFrom/To가 확인된 경우만 가능하다. 현재 fixture는 BLOCKED catalog와 **합성** 비교 성공/부분실패를 함께 제공한다. 합성 fixture를 데이터 수집·라이선스·비교 출시의 증거로 쓰지 않는다. 공급 실패는 P0-B를 보류하고 P0-A를 일괄 차단하지 않는다.

## FE 전달 규칙

생성 타입은 참조용 `types.generated.ts`이며 실제 FE 생성 schema.ts를 덮어쓰지 않았다. 편입은 해당 저장소의 sync-api 규칙을 따른다. 후보 actual 단독 문서를 기존 schema.d.ts 생성 입력으로 대체하지 않는다. F01 기술 인계 후보는 actual 타입을 별도 src/types/actual-schema.d.ts 출력으로 생성해 별도 alias 모듈로 소비하고 기존 schema.d.ts·operation을 보존하는 방식이다. 기존 schema와 통합 생성하는 방식을 선택한다면 모든 기존 operation 보존 테스트가 필요하며 final 선택은 FE 소유자가 수락한다. canonical 금융 값은 string; TypeScript alias만으로 런타임 검증이 보장되지 않으므로 response/fixture 경계에서 grammar 검사 필요성을 FE가 결정한다.

query key는 사용자 식별 범위+ACTUAL+accountId+operation+조건을 포함한다. 요청 시 사용자/계정을 고정하고 계정 전환/로그아웃/기간 변경 시 이전 응답이 새 선택을 덮지 않도록 취소 또는 결과 무효화한다. mutation 이후 ledgerVersion을 확인해 원장·summary·holdings·comparison을 무효화하고 같은버전이 준비되기 전 최신 합계로 결합하지 않는다. API 호출 위치는 기존 component→hooks→api→client 경계를 따른다.

P0-A의 holdingReturnRatePct는 보유 미실현/잔여 원가다. 계정 전체 TWR나 benchmark 상대성과를 대신하지 않는다. P0-B 전 미제공 account 지표를 로컬에서 합성하지 않는다. 모바일360/390px의 로딩/빈/오류/성공·정정 증거는 FE 구현 단계에서 확인해야 한다.

## 검증과 기술 소유자 수락 체크리스트

| 키 | 소유자 | 필요한 수락/증거 | 현재 |
|---|---|---|---|
| F01 | BE+FE | 경로/operation/DTO·명시 null/envelope·소유권404/I코드/생성기 호환 | 로컬 대조·schema/type 생성 검증 완료, 소유자 수락 미완료 |
| F02 | BE+FE | 수치/길이 최댓값·정밀도·aggregate overflow·formatter/chart 안전 범위 | 후보/정적 fixture 준비, 저장·시각화 검증 미완료 |
| F03 | BE | version/ETag·idempotency 유지·전이/영향 우선순위·원자성 | 명세/fixture 준비, 구현 증거 미완료 |
| F04 | BE | matcher·타인/not-found 동등 응답·decimal/null 직렬화·golden 자동suite | 소스 대조/정적 golden 검증, 서버 테스트 미완료 |
| F05 | FE | operation 타입 편입·canonical decimal·query/사용자 격리·모바일 | 참조 타입·fixture 준비, 앱 편입/모바일 미완료 |

F01–F03 소유자 기술 수락 뒤 계약을 동결할 수 있다. F04/F05는 해당 BE/FE Issue의 구현 인수 조건이며 계약 문서 동결만으로 완료 처리하지 않는다. 기술 선택이 승인된 금융/권한/호환 의미를 바꾸면 PO에 반환하고, 범위 안의 저장/컴포넌트 설계는 소유자가 판단한다.

로컬 실행(기존 FE node_modules의 Ajv/TypeScript 사용, 의존성 설치 없음):

```bash
node docs/contracts/actual-krw-v1/verify.mjs
python3 docs/contracts/actual-krw-v1/verify-golden.py
node stockwellness-front/node_modules/typescript/bin/tsc --noEmit --skipLibCheck --target ES2022 docs/contracts/actual-krw-v1/types.generated.ts
```

검증 범위는 OpenAPI→TypeScript 생성, JSON schema의 정상/거절 fixture, 참조 무결성, 금융 golden 예제의 독립 산술 대조다. 정식 OpenAPI 전문 lint, 서버/API 런타임·auth matcher·HTTP 직렬화·DB overflow·client 캐시·브라우저/모바일·TR 공급권한은 미검증이다. 이 문서 단계에서 화면 실행은 N/A(앱 변경 없음)지만 실제 출시 증거를 N/A로 처리하지 않는다. 검증 기록은 [verification.md](verification.md)에 남긴다.


## 0.3 BE 검토 반영 — 공동 수락 대기

- 기존 인증 필터 호환을 위해 ErrorEnvelope.traceId는 선택적이며 null을 허용한다. 실제 인증 응답 테스트는 구현 저장소에서 수행한다.
- page는 Spring int 범위(0..2147483647), offset은 checked long이다. If-Match는 따옴표 포함 최대18자이며 safe integer 범위를 별도 검증한다.
- ALL 원장은 원본과 대체 레코드를 보존한다. lastChangedAt/lastChangeType은 해당 레코드의 최신 상태 전이이며 변경 없음은 null이다. changeReason은 해당 전이 사유를 표시한다. actor·변경시각·원본 입력을 내부 append-only 감사 이벤트에 보존하며 사용자 응답에 불필요한 actor 개인정보를 노출하지 않는다.
- 실제 계정 입력 경계에서 숫자의 문자열 강제변환, unknown/duplicate JSON key, 거래종류와 무관한 필드를 거절한다. 필수 헤더 누락은 G001이며 원시 파싱 예외를 노출하지 않는다. 기존 simulation 바인딩은 보존한다.
- idempotency fingerprint는 member/account/operation/key 범위에서 targetEntryId, canonical body, policyVersion, original If-Match를 포함한다. 성공 receipt는 원장·감사 기록의 승인된 보존기간에 연동하며 별도 단기 TTL로 중복 방지 보장을 없애지 않는다. 오류는 성공 receipt로 저장하지 않는다.
- 계정 단위 소유권 잠금과 하나의 DB transaction으로 receipt 확인 → version 확인 → 상태/전체 후속 재생 → 감사·원장 기록 → version 증가 → receipt 저장을 수행한다. 성공 replay는 version을 증가시키지 않는다.
- RECALCULATING은 새로운 원장 쓰기 I009, INVALID는 I005; 읽기·이름 변경·성공 replay는 허용한다. REVIEW_REQUIRED는 영향 없는 거래만 허용하고 영향 거래는 I005다. 평가 worker는 ledger/policy/marketDataVersion이 현재와 일치할 때만 결과를 게시한다.
- netDeposits는 음수가 가능하다. 가격 상승에 따른 표시 범위 초과는 원장을 INVALID로 만들지 않고 영향 값만 null/NUMERIC_RANGE_EXCEEDED로 표현한다. 2026-10-03 사용자 승인으로 평생 누적값의 표시 한도 초과만을 이유로 정상 거래를 거절하지 않는다. 누적값은 원본 재생으로 정확히 보존하며 표시 범위 초과 값은 null/NUMERIC_RANGE_EXCEEDED다.


### 버전·정규화·상태 표시 세부 규칙 — BE 재수락 대상

새 계정 accountVersion/ledgerVersion은 0이다. 새로운 성공 rename은 동일 이름이어도 accountVersion만 1 증가하며, 성공 ledger mutation은 두 버전을 1 증가시킨다. 동일 성공 receipt 재전송은 증가하지 않는다. safe integer 상한에서 증가가 불가능하면 새 쓰기는 I008이며 기존 상태를 유지한다.

fingerprint용 DTO canonical JSON은 필드 순서를 고정하고 UTF-8로 직렬화한다. JSON 송신 key 순서/불필요한 whitespace는 제거하되 금융 문자열·symbol·date·Idempotency-Key·If-Match는 임의 trim/수치 변환하지 않는다. 이름/brokerLabel/reason은 위 고정 White_Space 목록으로 양끝 정규화 후 code point 길이를 검사한다. brokerLabel 생략/null/trim 후 빈 값은 canonical null로 같다. NFC·대소문자·내부 공백은 보존한다. 정규화 전에 schema maxLength를 적용해 정상 정규화 값을 거절하지 않도록 실제 입력 검사 순서를 테스트한다.

인증 → owner/대상 account 소속 → 엄격 입력·헤더 검증 → 성공 receipt 확인 → 새 요청의 현재 version/상태/도메인 검증 순서다. 유효하지 않은 경로 ID는 G001로 거절할 수 있으며 타인 리소스 존재 여부를 구분해 노출하지 않는다. 오류 receipt는 저장하지 않고 동일 key의 다음 유효 요청은 재판정한다. 성공 status/body/envelope timestamp는 처음 결과를 영속 보존해 replay한다.

RECALCULATING의 새 버전 summary/holding 금융 값은 null/RECALCULATING이며 원시 원장은 조회 가능하다. REVIEW_REQUIRED에서는 실제 영향을 받는 값만 null이고 독립 검증된 다른 종목·필드와 거래는 유지한다. 이유 우선순위는 해당 필드의 무결성/검토 사유 → 재계산 → 가격 누락 → 범위 초과 → 관측 부족이다. 같은 우선순위 사유가 여럿이면 OpenAPI reason enum 순서로 결정하고 ledgerIssues에는 전체 원인을 남긴다. stale worker는 ledgerVersion/policyVersion/marketDataVersion 조건부 게시로 폐기한다.


### BE 저장형 및 누적값 정책 — 사용자 승인

BE 기술 소유자가 수락한 저장형은 원본 원화 numeric(13,0), 원본 수량 numeric(9,0) 또는 동일 CHECK BIGINT, 현재 잔여원가·종목원가·평균단가를 저장하면 numeric(31,18), 현재 현금은 numeric(13,0)이다. 단일 중간 곱을 저장할 필요가 있는 경우에만 numeric(40,18)을 사용할 수 있다. 중간 계산은 정확 BigDecimal로 수행하며 불필요한 중간 컬럼을 만들지 않는다. 저장 전 정확한 BigDecimal 범위 검사와 DB CHECK로 묵시 반올림/잘림을 막는다. numeric(40,18)을 평생 누적값 무제한 저장으로 해석하지 않는다.

누적값 확대 보존 선택 시 BE 권고는 불변 원본 원장을 정확 BigDecimal로 재생하고 고정 precision 컬럼을 누적값의 권위 저장소로 사용하지 않는 방식이다. 파생 cache가 필요하면 canonical plain decimal의 가변 표현으로 보존한다. 2026-10-03 사용자 승인에 따른 누적값 확대 보존 정책이며, 실제 구현·검증은 BE 소유자가 수행한다. 출력 한도와 내부 누적값을 구분하고, 모든 prefix의 현금/수량/원가 범위 및 정정 후 후속 재생을 계속 검사한다.


## 누적 정책 승인 및 필드별 적용 — 2026-10-03

사용자가 권장안을 승인했다. 승인 대상은 누적값 표시 한도 초과로 정상 거래를 거절하지 않고 정확한 내부 누적값을 유지하는 정책이다. 입력 scalar/단일 거래/현재 cash·보유수량·잔여원가의 기존 제한은 계속 적용한다.

| 범위 | 내부/쓰기 규칙 | API 출력 규칙 |
|---|---|---|
| 원본 원화 입력·거래 수량 | 각각13/9자리, strict canonical; 기존 양수/비음수 검사 | 원본 보존 |
| 단일 매수비용·매도순액·배당순액, 각 prefix cash·종목 및 계정 costBasis | 기존 금액 상한 M=9999999999999, 현금/원가 비음수; 종목 보유 Q<=999999999 | 유효값 canonical6/수량정수 |
| cumulativeBuyAmount·누적 입금/출금·netDeposits·realizedPnl·netDividendIncome·totalPnl | 정확 BigDecimal 재생, 임의 cumulative precision cap으로 쓰기 제한하지 않음; signed 필드는 부호 보존 | 소수6 HALF_EVEN 후 정수부13 초과면 해당 값만 null/NUMERIC_RANGE_EXCEEDED |
| EOD 평가금액/NAV·수익률 등 조회 파생 | 출력 범위 초과로 원장을 INVALID로 바꾸거나 거래를 소급 실패시키지 않음 | 정확 원값으로 독립 계산 가능하면 값 제공, 출력 불가 필드만 null/사유; null 표시값을 산식 입력으로 사용 금지 |

정정/취소는 전체 후속 prefix를 재생해 기존 현금·수량·원가 안전성을 검증한다. 누적 표시 범위 초과는 수정 실패의 이유가 아니다. 고정 DB precision의 묵시 반올림/절삭으로 누적값을 변경하지 않는다. 원장 원본·감사 event가 권위 데이터며 파생 가변 cache는 선택적이다.

## 정식 기술 계약 동결 기록 — 1.0.0

2026-10-03 누적 정책 사용자 승인과 BE F01/F02/F03·FE F01/F02 최종 수락을 보고서 원본에서 확인했다. 0.3.0-review와 HTTP 구조는 동일하며 누적 정책을 확정하고 버전을1.0.0으로 승격했다. 기술 동결은 앱/서버/DB/모바일 인수 통과가 아니다. 후속 BE-02부터 순서대로 별도 개발 채팅에서 구현한다.
