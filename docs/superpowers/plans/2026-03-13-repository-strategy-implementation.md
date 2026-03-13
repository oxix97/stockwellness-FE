# 저장소 전략(Repository Strategy) GitHub 반영 구현 계획

> **에이전트 작업자 필독:** 본 계획을 구현하기 위해 `superpowers:executing-plans`를 사용하세요. 각 단계는 체크박스(`- [ ]`) 문법을 사용하여 진행 상황을 추적합니다.

**목표:** 설계된 저장소 관리 전략(이슈/PR 템플릿, 브랜치 규칙, 레이블)을 GitHub 저장소에 실제로 적용합니다.

**아키텍처:** GitHub에서 제공하는 표준 템플릿 기능(`.github/` 폴더)을 활용하고, 레이블은 GitHub CLI(`gh`)를 활용하여 자동화합니다.

**기술 스택:** GitHub Issue Forms (YAML), Markdown, Bash Script, GitHub CLI (`gh`)

---

## 1단계: 이슈 템플릿(Issue Templates) 생성

**파일:**
- 생성: `.github/ISSUE_TEMPLATE/bug_report.yml`
- 생성: `.github/ISSUE_TEMPLATE/feature_request.yml`
- 생성: `.github/ISSUE_TEMPLATE/chore.yml`
- 생성: `.github/ISSUE_TEMPLATE/refactor.yml`
- 생성: `.github/ISSUE_TEMPLATE/documentation.yml`
- 생성: `.github/ISSUE_TEMPLATE/performance.yml`
- 생성: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: 버그 리포트 템플릿 작성**
- [ ] **Step 2: 기능 제안 템플릿 작성**
- [ ] **Step 3: Chore/Refactor/Docs/Perf 템플릿 작성**
- [ ] **Step 4: 템플릿 선택 화면(config.yml) 구성**
- [ ] **Step 5: 로컬 커밋**

```bash
git add .github/ISSUE_TEMPLATE/
git commit -m "feat: GitHub 이슈 템플릿 6종 추가"
```

---

## 2단계: PR 템플릿(Pull Request Template) 생성

**파일:**
- 생성: `.github/PULL_REQUEST_TEMPLATE.md`

- [ ] **Step 1: Self-Check 항목이 포함된 PR 템플릿 작성**
- [ ] **Step 2: 로컬 커밋**

```bash
git add .github/PULL_REQUEST_TEMPLATE.md
git commit -m "feat: GitHub PR 템플릿 추가 (Self-Check 포함)"
```

---

## 3단계: GitHub 레이블(Labels) 자동화 스크립트 작성 및 실행

**파일:**
- 생성: `scripts/setup-github-labels.sh`

- [ ] **Step 1: GitHub CLI를 사용하여 레이블을 생성/수정하는 쉘 스크립트 작성**
- [ ] **Step 2: 스크립트 실행 권한 부여 및 실행 (사용자 확인 필요)**
- [ ] **Step 3: 로컬 커밋**

```bash
git add scripts/setup-github-labels.sh
git commit -m "chore: GitHub 레이블 자동 설정 스크립트 추가"
```

---

## 4단계: 최종 확인 및 원격 저장소 반영

- [ ] **Step 1: 생성된 파일들이 설계서와 일치하는지 최종 확인**
- [ ] **Step 2: 원격 저장소(`origin/develop`)로 푸시**

```bash
git push origin develop
```
