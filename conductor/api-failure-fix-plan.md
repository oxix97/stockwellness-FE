# 배포 스크립트 수정 계획 (deploy-front.sh)

## 📌 목표
Ubuntu 24.04 서버 환경의 Docker 컨테이너(n8n 등)에서 배포 스크립트 실행 시 발생하는 `curl: command not found` 오류를 해결하고, 스크립트의 안정성을 확보합니다.

## 🛠️ 문제 원인
1. `deploy-front.sh` 내 `notify_deploy` 함수에서 `curl` 명령어를 사용하여 Webhook 호출을 시도합니다.
2. 스크립트 최상단에 `set -euo pipefail`이 적용되어 있어, `curl` 명령어가 없는 환경에서 에러가 발생하면 전체 배포 프로세스가 즉시 중단(Exit)됩니다.
3. 배포 이미지는 정상적으로 다운로드되었으나, 배포 시작 알림(`START`) 단계에서 스크립트가 강제 종료되었습니다.

## 📝 해결 방안

### 1. 스크립트 방어 로직 추가 (필수)
실행 환경에 관계없이 스크립트가 비정상 종료되지 않도록 `notify_deploy` 함수를 수정합니다. `curl` 설치 여부를 먼저 확인하고, 없을 경우 로그만 남기고 넘어가도록 방어적 코드를 작성합니다.

- **대상 파일:** `/home/chan/stockwellness-infra/scripts/deploy-front.sh`
- **수정 내용:**
  ```bash
  notify_deploy() {
      local status="$1"    # START, SUCCESS, FAIL
      local message="${2:-}"
      
      # curl 명령어가 존재하는지 확인
      if command -v curl >/dev/null 2>&1; then
          curl -s -X POST -H "Content-Type: application/json" \
               -d "{\"service\": \"front\", \"status\": \"$status\", \"tag\": \"$IMAGE_TAG\", \"message\": \"$message\", \"slot\": \"${NEXT_SLOT:-}\"}" \
               "http://localhost:5678/webhook/deploy-notification" > /dev/null || true
      else
          log "⚠️ 알림 전송 실패: curl 명령어를 찾을 수 없습니다. (상태: $status)"
      fi
  }
  ```

### 2. Ubuntu 24.04 호스트 환경 조치 (권장)
스크립트를 실행하는 주체가 호스트 서버(Ubuntu 24.04)라면, 시스템에 `curl` 패키지를 설치합니다.

- **실행 명령어:**
  ```bash
  sudo apt-get update
  sudo apt-get install -y curl
  ```

### 3. Docker 환경 (n8n 컨테이너 내부 실행 시) 조치
스크립트 주석에 명시된 대로 n8n 컨테이너 내부에서 쉘 스크립트가 실행되는 구조라면, 해당 컨테이너 이미지에 `curl`을 포함시켜야 합니다.

- **대안 A (Dockerfile 커스텀):** n8n 공식 이미지 대신 `curl`을 설치한 커스텀 이미지를 빌드하여 사용합니다.
  ```dockerfile
  FROM n8nio/n8n:latest
  USER root
  RUN apk add --no-cache curl
  USER node
  ```
- **대안 B (Alpine 기반 패키지 임시 설치):** 스크립트 최상단 혹은 CI 파이프라인에서 컨테이너 기동 후 패키지를 설치합니다. (임시 방편)

## ✅ 결론
가장 확실하고 안전한 방법은 **1번 방안(스크립트 내 `curl` 존재 여부 체크)**을 우선적으로 적용하여 배포 파이프라인 자체가 중단되는 것을 막는 것입니다. 이후 알림 기능의 정상 동작을 위해 서버(Ubuntu) 또는 컨테이너(n8n) 환경에 `curl` 패키지를 추가 설치하는 것을 권장합니다.