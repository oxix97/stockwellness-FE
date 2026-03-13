#!/bin/bash

# GitHub 레이블 자동 설정 스크립트

# 기존 기본 레이블 삭제 (선택 사항 - 필요한 경우 주석 해제)
# gh label delete bug --yes
# gh label delete enhancement --yes
# gh label delete help\ wanted --yes
# gh label delete invalid --yes
# gh label delete question --yes
# gh label delete wontfix --yes
# gh label delete duplicate --yes

# 1. 작업 유형 (Type) - 파스텔톤
gh label create "type:bug" --color "d73a4a" --description "버그 수정" --force
gh label create "type:feat" --color "a2eeef" --description "새로운 기능 추가" --force
gh label create "type:chore" --color "c2e0c6" --description "빌드, 설정, 패키지 관리 등" --force
gh label create "type:refactor" --color "fef2c0" --description "코드 구조 개선" --force
gh label create "type:docs" --color "0075ca" --description "문서 작업" --force
gh label create "type:perf" --color "e99695" --description "성능 최적화" --force

# 2. 우선순위 (Priority) - 신호등 색상
gh label create "priority:high" --color "b60205" --description "긴급한 작업" --force
gh label create "priority:medium" --color "fbca04" --description "일반적인 작업" --force
gh label create "priority:low" --color "0e8a16" --description "여유 있는 작업" --force

# 3. 상태 (Status) - 회색/파란색 계열
gh label create "status:todo" --color "cfd3d7" --description "작업 예정" --force
gh label create "status:in-progress" --color "1d76db" --description "작업 중" --force
gh label create "status:blocked" --color "ee0701" --description "지연/중단됨" --force

# 4. 영역 (Area) - 보라색 계열
gh label create "area:frontend" --color "5319e7" --description "프론트엔드 전반" --force
gh label create "area:api" --color "0052cc" --description "API 연동" --force
gh label create "area:ui-ux" --color "c5def5" --description "UI 디자인 및 UX 개선" --force

echo "✅ GitHub 레이블 설정이 완료되었습니다."
