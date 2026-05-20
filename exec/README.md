# exec — 포팅·시연 제출물

SSAFY 포팅 매뉴얼 제출용 폴더입니다. **소스 코드는 저장소 루트를 사용**하며, 이 디렉터리에는 문서·DB 스키마만 둡니다.

> **개인정보 및 운영 데이터 보호를 위해 DB는 schema-only dump 형태로 제공됩니다.**  
> 데이터(row)는 포함하지 않으며, 테이블 구조만 [schema.sql](./schema.sql) 에 있습니다.

| 파일 | 설명 |
|------|------|
| [01-porting-manual.md](./01-porting-manual.md) | 빌드·배포·환경 변수·DB·계정·외부 서비스 |
| [02-demo-scenario.md](./02-demo-scenario.md) | 테스트·시연 시나리오 (39건) |
| [screenshots/](./screenshots/) | 시나리오별 스크린샷 (`NN-설명.png`) |
| [schema.sql](./schema.sql) | PostgreSQL schema-only dump |

시연용 계정·보드 데이터는 앱 기동(initializer) 또는 팀 시드로 별도 구성합니다.

### schema.sql 재생성 (로컬)

```bash
docker exec oh-jjeom-oh-postgres pg_dump \
  -U postgres --schema-only -d oh_jjeom_oh --no-owner --no-acl \
  > exec/schema.sql
```

운영 DB full dump는 사용하지 마세요. `schema.sql`과 Flyway 마이그레이션을 동시에 적용하면 DDL 중복이 날 수 있으므로, 보통은 **Flyway만**(권장) 또는 **schema.sql만**(DDL 확인용) 중 하나를 선택합니다.
