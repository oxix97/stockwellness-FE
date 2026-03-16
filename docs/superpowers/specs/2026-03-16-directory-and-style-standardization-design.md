# 📝 설계안: 디렉토리 구조 및 스타일 시스템 표준화

- **상위 이슈**: #5 (Epic)
- **하위 이슈**: #6 (Task - 디렉토리), #7 (Task - 스타일)
- **작업 브랜치**: `task/#6-directory-reorganization`, `task/#7-semantic-theme-system`

---

## 📂 1. 디렉토리 구조 설계 (Task #6)
"혼합 방식(Mixed Approach)"을 적용하여 전역 유틸리티와 도메인별 유틸리티의 경계를 명확히 합니다.

### **신규 폴더 트리**
```text
src/
├── api/
│   ├── client.ts
│   └── utils/          # [신설] API 응답 처리, 에러 핸들링 유틸 (Domain-specific)
├── app/
│   └── components/
│       └── shared/     # [확장] 재사용 가능한 공통 UI 컴포넌트
│           ├── card/   # 대시보드 카드 레이아웃
│           └── label/  # 가격 등락 표시 라벨 등
├── styles/
│   ├── theme.ts        # [신설] 핵심 색상 및 수치 상수 정의
│   └── index.css       # Tailwind 4.0 CSS 변수 정의
└── utils/              # [확장] 전역 유틸리티 (Cross-cutting)
    ├── format.ts       # 통화, 날짜 포맷팅
    └── calculate.ts    # 주식 수익률, 등락 계산
```

### **배치 가이드라인**
- **전역(`src/utils`)**: 프로젝트 전반(API, UI, Hook 등)에서 쓰이는 순수 함수.
- **도메인(`src/api/utils`)**: 특정 폴더 내의 로직을 보조하기 위한 유틸리티.
- **공통 컴포넌트(`src/app/components/shared`)**: 최소 2개 이상의 화면에서 중복 사용되는 UI 요소.

---

## 🎨 2. 시멘틱 스타일 시스템 설계 (Task #7)
하드코딩된 색상 리터럴을 의미 기반의 변수로 전환하여 유지보수성을 극대화합니다.

### **시멘틱 컬러 정의 (`src/styles/theme.ts`)**
현재 코드에서 발견된 하드코딩된 값들을 표준화합니다.

| 시멘틱 명칭 | 상수 값 | 용도 | 기존 리터럴 (예시) |
| :--- | :--- | :--- | :--- |
| **WELLNESS** | `#2EBE7A` | 브랜드 메인 컬러, 건강/안정 | `text-primary`, `#2EBE7A` |
| **UP** | `#FF4756` | 주가 상승, 긍정, 위험 | `#FF4756`, `text-red-500` |
| **DOWN** | `#3182F6` | 주가 하락, 부정, 안정 | `#3182F6`, `text-blue-600` |
| **BACKGROUND** | `#F9FAFB` | 메인 배경색 | `#F9FAFB` |

### **Tailwind 4.0 연동 (`src/styles/index.css`)**
Tailwind 4.0의 새로운 CSS 변수 기반 설정을 활용합니다.

```css
@theme {
  --color-wellness: #2EBE7A;
  --color-up: #FF4756;
  --color-down: #3182F6;
  --color-surface: #F9FAFB;
  
  --radius-card: 24px;
  --radius-button: 16px;
}
```

---

## ✅ 3. 기대 효과
1.  **가독성**: `color: #FF4756` 대신 `text-up` 또는 `THEME.COLOR.UP`을 사용하여 코드의 의도가 명확해집니다.
2.  **유지보수**: 브랜드 컬러나 상승/하락 색상 변경 시 한 곳(`theme.ts` 또는 `index.css`)만 수정하면 전체 프로젝트에 반영됩니다.
3.  **생산성**: 폴더 구조가 표준화되어 신규 기능 추가 시 파일 배치 위치를 고민할 필요가 없습니다.
