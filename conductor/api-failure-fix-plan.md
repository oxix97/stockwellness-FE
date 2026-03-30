# API 실패 원인 분석 및 해결 결과 (API Failure Fix Result)

## 1. 최종 분석 결과
로컬과 배포 환경의 동작 불일치는 다음 세 가지 설정 미흡으로 인해 발생했습니다.
- **Nginx 요청 처리**: 프론트엔드 Nginx의 `try_files` 설정으로 인해 상위 프록시가 가로채지 못한 API 요청이 `index.html`로 폴백됨.
- **환경 변수 주입**: Vite 빌드 시점에 `VITE_API_BASE_URL`이 주입되지 않아 클라이언트가 올바른 경로를 인지하지 못함.
- **네트워크 및 요청 제한**: 인프라 표준과 다른 네트워크 명칭 및 기본 요청 크기 제한(1MB)으로 인한 통신 장애 위험.

## 2. 적용된 수정 사항
| 구분 | 수정 내용 | 목적 |
|---|---|---|
| **Nginx** | `client_max_body_size 10M;` 추가 | 대용량 백테스팅 데이터 처리 허용 |
| **Dockerfile** | `ARG VITE_API_BASE_URL=/api` 추가 | 빌드 시 상대 경로 주입 (인프라 사양 준수) |
| **Docker Compose** | `networks: stockwellness-net (external)` | 인프라 공통 네트워크 연동 및 통일 |
| **CD Workflow** | `build-args` 추가 및 `IMAGE_TAG` 웹훅 전송 | 빌드 시 환경 변수 확정 및 배포 스크립트 연동 |

## 3. 인프라 담당자 협의 내용 반영
- 백엔드 서비스는 상위 Nginx의 `upstream backend`를 통해 처리되므로 프론트엔드에서는 상대 경로 `/api`를 그대로 사용함.
- 동일 도메인(Same Origin) 정책에 따라 CORS 문제는 발생하지 않음을 확인.
- SSL은 상위 Nginx에서 종료되므로 프론트엔드 설정은 간소화 유지.

## 4. 향후 조치
- `main` 브랜치 푸시 후 n8n 웹훅을 통한 배포 성공 여부 모니터링.
- 브라우저 개발자 도구(Network 탭)에서 응답 헤더의 `Content-Type: application/json` 여부 최종 확인.
