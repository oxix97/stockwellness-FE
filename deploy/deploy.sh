#!/bin/bash

# 프로젝트 디렉토리로 이동 (실제 서버 경로에 맞게 수정 필요)
# PROJECT_DIR="/home/ubuntu/stockwellness-front"
# cd $PROJECT_DIR

echo "🚀 배포 프로세스 시작: $(date)"

# 1. 최신 코드 가져오기 (Git 사용 시)
# git pull origin main

# 2. Docker 빌드 및 컨테이너 실행
# --build: 캐시 무시하고 새로 빌드
# -d: 백그라운드 실행
docker compose up -d --build

# 3. 미사용 이미지 정리 (용량 확보)
docker image prune -f

echo "✅ 배포 완료: http://localhost:3000"
