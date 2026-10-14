# Tro-Fit Docker 배포

현재 PC의 로컬 배포 주소: http://localhost:8080

## 서비스

| 서비스 | 역할 |
|---|---|
| frontend | Expo 웹 export + Nginx, /api를 backend로 전달 |
| backend | JWT 로그인, ROM 계산, 사용자별 영상 작업 저장, LLM HTTP 연결 |
| llm | LangChain Gemma 프롬프트, 임베딩, pgvector 검색, LTX API |
| ollama | NVIDIA GPU 추론, 기존 호스트 모델 디렉터리를 읽기 전용으로 연결 |
| postgres | PostgreSQL 16 Alpine + pgvector 0.8.6, 기존 외부 볼륨 재사용 |

tro-fit-ai-vision은 별도 HTTP 서버가 아닙니다. 현재 서비스의 포즈 추정은 모바일 WebView에서,
ROM 계산은 backend/app/services/rom_analysis.py에서 실행합니다. 연구/벤치마크 코드는 독립 컨테이너로 띄우지 않습니다.

## 실행/중지

프로젝트 루트에서:

```powershell
docker compose --env-file .env.deploy up -d --build
docker compose --env-file .env.deploy ps
docker compose --env-file .env.deploy logs --tail 100 backend llm
docker compose --env-file .env.deploy stop
```

외부 DB 볼륨은 `tro-fit-backend_pgdata`입니다. 이 볼륨을 삭제하거나 두 PostgreSQL 서버에서 동시에 마운트하지 마세요.
기존 단독 `postgres` 컨테이너는 배포 전 중지하고 보존합니다. 최초 전환 전 DB 백업은
`deploy/backups/trofit-before-compose.dump`에 보관합니다. 일반 `up`으로 백업을 새로 생성하지는 않습니다.
동일 볼륨의 동시 사용을 막기 위해 기존 컨테이너의 자동 재시작 정책은 no로 변경했습니다.

롤백 시 Compose를 중지한 뒤 기존 DB를 시작할 수 있습니다:

```powershell
docker compose --env-file .env.deploy stop
docker start postgres
```

## 설정

- .env.deploy: DB 컨테이너/외부 볼륨 이름, Ollama 모델 디렉터리
- deploy/backend.env: DB URL, JWT 키
- deploy/llm.env: DB URL, Ollama 모델명, LTX 키/모델명
- API 키·DB 비밀번호는 이미지에 포함하지 않습니다. 예시 파일에는 실제 값을 넣지 않습니다.
- 초기 로컬 설정은 기존 프로젝트 .env에서 옮겼습니다. 나중에 키를 바꾸면 deploy/*.env도 수정해야 합니다.

신규 서버는 예시 파일을 복사해 값을 채우고, PostgreSQL 16 볼륨을 준비/복원해야 합니다.
모델 디렉터리에는 Gemma 4와 Qwen 임베딩 파일이 있어야 합니다. blobs/manifests는 읽기 전용으로 연결하고,
Ollama의 새 메타데이터·키는 별도 ollama_state 볼륨에 보관합니다.
NVIDIA GPU와 Docker GPU 지원이 필요합니다. 모델 파일이나 DB 백업을 이미지에 COPY하지 마세요.

새 DB의 RAG 초기화:

```powershell
docker compose --env-file .env.deploy exec llm python -m app.rag.cli init-db
docker compose --env-file .env.deploy exec llm python -m app.rag.cli ingest
```

## 배포 범위와 제한

- 현재는 이 PC에서 접근하는 로컬 Compose 배포입니다. 외부 서버·도메인·HTTPS는 별도 구성해야 합니다.
- Expo 웹 화면은 배포되지만 카메라 측정 컴포넌트는 기존 코드상 모바일 development build 전용입니다.
  네이티브 앱은 Docker 이미지로 배포하지 않습니다. Expo/EAS 또는 네이티브 빌드가 별도로 필요합니다.
- 모바일 앱은 EXPO_PUBLIC_API_URL에 실제 접근 가능한 HTTPS 서버 주소를 지정해 다시 빌드해야 합니다.
- 프론트에는 /api/v1 경로가 빌드 시 적용됩니다. LLM/Ollama 포트는 외부에 공개하지 않습니다.
- 기존에 삭제된 tro_fit_llm 패키지 의존성을 제거하고 backend는 LLM 서비스를 HTTP로 호출합니다.
  예전 app/choreography_worker.py와 그에 연결된 구형 테스트는 현재 배포 경로가 아닙니다.
- 영상 생성은 LTX 크레딧을 사용합니다. 배포 중 자동으로 영상을 생성하지 않습니다.
- 생성 영상은 의학적 안전성 또는 관절 제한 준수가 검증된 결과가 아닙니다.
- 영상 URL은 LTX 만료 정책의 영향을 받습니다. 장기 보관용 오브젝트 스토리지는 별도 필요합니다.
