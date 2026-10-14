# PostgreSQL + pgvector

백엔드의 Docker 컨테이너 `postgres`와 같은 `localhost:5432/tro_fit_db`를 사용합니다.
LLM은 자신의 `.env`에서 DATABASE_URL을 읽습니다. 백엔드 .env를 자동으로 읽거나 덮어쓰지 않습니다.
RAG_DATABASE_URL을 설정하면 우선합니다. 사용자명·비밀번호는 기존 로컬 설정을 사용하세요.

## 초기화와 자료 색인

Docker Desktop과 postgres 컨테이너를 실행한 뒤 `tro-fit-llm`에서:

```powershell
.\.venv\Scripts\python.exe -B -m app.rag.cli init-db
.\.venv\Scripts\python.exe -B -m app.rag.cli ingest
.\.venv\Scripts\python.exe -B -m app.rag.cli search "어깨 가동범위"
```

현재 컨테이너에는 pgvector 0.8.6이 설치되어 있습니다. init-db는 확장을 활성화하고
`llm_rag_chunks` 테이블만 생성합니다. 기존 백엔드 테이블은 수정하지 않습니다.
컨테이너를 새로 생성할 경우 PostgreSQL 이미지에 pgvector 바이너리가 포함되어 있어야 합니다.
현재 postgres:16-alpine 이미지는 기본적으로 pgvector를 포함하지 않으므로, 기존 DB 볼륨을 유지한 채
PostgreSQL 16과 호환되는 확장 설치/이미지 구성이 필요합니다. init-db는 바이너리를 설치하지 않습니다.

## 저장과 검색

- 모델: qwen3-embedding:0.6b, 1024차원. 다른 차원의 모델을 지정하면 저장 전에 거절합니다.
- 원본: data 아래 MD/TXT/PDF. 1200자 분할, 200자 중첩. PDF 페이지 번호 보존.
- 출처·위치·내용을 이용한 SHA-256 ID와 모델명을 함께 저장합니다.
- 모든 임베딩에 성공한 후 트랜잭션 하나로 읽은 출처를 교체합니다.
- 같은 이름의 자료가 바뀌면 재색인으로 갱신합니다. 삭제·빈 파일·OCR 미처리 자료의 기존 행은 자동 삭제하지 않습니다.
- 모델별로 분리해서 검색합니다. 동일 모델 태그의 가중치를 변경하면 전체 자료를 재색인해야 합니다.
- 현재 소규모 자료는 코사인 거리 `<=>`로 정확 검색합니다. 근사 검색 인덱스는 아직 필요하지 않습니다.
- 검색·DB 작업은 별도 스레드에서 실행해 FastAPI 이벤트 루프를 막지 않습니다.

## API 사용

```json
{"query":"어깨 가동범위와 동작 제한","limit":5}
```

위 JSON을 POST /rag/search에 보내면 id, source, page, content, score가 나옵니다.

```json
{"prompt":"점프 없는 천천한 안무를 만들어줘","use_rag":true}
```

POST /prompts는 상위 자료 3개를 Gemma에 전달합니다. POST /generate는 그 프롬프트로
유료 영상 작업까지 접수합니다. use_rag 기본값은 false로 기존 요청과 호환됩니다.
색인 데이터가 없으면 409 rag_empty, DB 연결·초기화 문제가 있으면 503을 반환합니다.

현재 원본 4개에서 32개 청크를 저장했고 PNG 2개는 제외했습니다.
이 자료는 관절 가동범위 참고 문서이며, 검색된 문서만으로 영상 동작의 의학적 안전성을 보장하지 않습니다.
