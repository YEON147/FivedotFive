# Git Branch Strategy

본 프로젝트는 **Git Flow 기반 브랜치 전략**을 사용한다.

---

## Branch Structure

```
main
 └─ develop
     ├─ feature/AI/{기능}
     ├─ feature/fastAPI/{기능}
     ├─ feature/backend/{기능}
     ├─ feature/frontend/{기능}
```

Git Flow는 위 구조를 따릅니다.


| 브랜치           | 설명                         |
| ------------- | -------------------------- |
| main (master) | 실제 서비스에 배포되는 안정적인 코드       |
| develop       | 다음 버전을 개발하는 통합 개발 브랜치      |
| feature       | 새로운 기능 개발을 위한 브랜치          |


- **main, develop** → 항상 유지되는 메인 브랜치
- **feature** → 작업 후 삭제되는 보조 브랜치

---

## Commit Convention

커밋 메시지는 아래 Conventional Commits 문서를 기준으로 작성한다.

- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

### 기본 규칙

- 커밋 태그는 `fix`, `feat`, `refactor`, `docs` 네 가지만 사용한다.
- 태그는 반드시 **소문자**로 작성한다.
- 변경 사항 설명은 **한국어로 최대한 자세히** 작성한다.
- 다른 사람이 봤을 때도 어떤 부분이 변경된 건지 확인할 수 있도록 작성한다.

### 예시

```text
feat: 로그인 API 연동 및 예외 처리 추가
fix: 비밀번호 재설정 시 토큰 만료 검증 누락 문제 수정
refactor: 회원 조회 서비스 로직 분리 및 중복 코드 제거
docs: 브랜치 전략 및 커밋 규칙 문서화
```

---

## PR 설명 작성 규칙

PR에는 아래 내용을 반드시 포함한다.

### 작성 템플릿

```md
## 작업 내용
- 구현한 기능 또는 수정 사항 설명

## 참고 사항
- 리뷰 시 봐야 할 포인트
- 아직 미완성인 부분
- 논의 필요한 부분
```


