# Tro-Fit LLM API

Gemma 4가 영어 영상 프롬프트 JSON을 만들고, LTX 공식 API가 영상 생성 작업을 실행합니다.
로컬 영상 모델이나 CUDA 패키지를 설치하지 않습니다.

## LangChain 구성

텍스트: `ChatPromptTemplate → ChatOllama → PydanticOutputParser`를 LCEL 체인으로 연결합니다.
임베딩: `OllamaEmbeddings` 기반 어댑터를 사용하며 긴 입력의 자동 잘림을 거절합니다.
검색: `BaseRetriever`를 확장한 `PgVectorRetriever`가 기존 PostgreSQL 테이블에서 검색해
LangChain Document로 반환합니다. API 경계에서는 기존 JSON 응답으로 변환합니다.
DB 스키마·기존 벡터·외부 API 요청 형식은 유지하며 LTX는 독립 HTTP 모듈로 호출합니다.

2026-10-08 LangChain 변경은 사용자 요청에 따라 테스트·서버 실행·모델 호출·DB 검증을 하지 않았습니다.
이전 검증 기록은 변경 전 버전의 결과입니다.

## 실행

`tro-fit-llm` 폴더에서 실행합니다. 백엔드와 포트가 겹치지 않도록 8001을 사용합니다.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Swagger: http://127.0.0.1:8001/docs

`.env`의 `OLLAMA_MODEL=gemma4:e4b`, `LTX_API_KEY`, `LTX_MODEL=ltx-2-3-fast`를 사용합니다.
환경변수 변경 후 서버를 재시작하세요. DATABASE_URL은 백엔드와 같은 PostgreSQL을 가리킵니다.
JWT_SECRET_KEY는 보존하지만 이 로컬 MVP의 인증에는 아직 사용하지 않습니다.

## API

| 경로 | JSON 입력 / 기능 |
|---|---|
| POST /prompts | `{"prompt":"전신이 보이는 고정 카메라로 간단한 안무"}` → `{"video_prompt":"...English..."}` |
| POST /videos | 위 `video_prompt` JSON → LTX 작업 접수, 202와 job_id |
| POST /generate | `{"prompt":"..."}` → Gemma 생성 후 LTX 접수, 202와 job_id |
| GET /jobs/{job_id} | pending/processing/completed/failed 조회, 완료 시 video_url |
| POST /embeddings | `{"texts":["자료 내용"]}` → 지원하는 모델의 벡터 |
| POST /rag/search | `{"query":"어깨 가동범위","limit":5}` → pgvector 검색 결과와 출처 |

`/prompts`, `/generate`에 `"use_rag": true`를 추가하면 자료 검색 후 Gemma에 근거를 함께 전달합니다.
자료 색인·DB 구성 방법은 [docs/RAG.md](docs/RAG.md)를 참고하세요.

영상 기본값은 6초, 1280×720, 24fps, 무음입니다. POST /videos와 /generate는 유료 LTX 작업을 접수합니다.
상태 조회는 5초 이상 간격으로 하고 completed/failed면 중단하세요.
영상 URL은 만료될 수 있습니다. 현재 MVP는 외부 URL을 반환하며 MP4를 로컬에 저장하지 않습니다.
접수 시간 초과 때 중복 과금을 피하도록 자동 재시도하지 않습니다. LTX 콘솔에서 접수 여부를 먼저 확인하세요.

## 현재 제한

- 텍스트 생성은 Gemma 4, 임베딩은 `qwen3-embedding:0.6b`를 사용합니다.
  `OLLAMA_EMBED_MODEL`로 변경할 수 있으며 임베딩 미지원 모델을 지정하면 422를 반환합니다.
  새 환경에서는 `ollama pull gemma4:e4b`와 `ollama pull qwen3-embedding:0.6b`로 모델을 준비하세요.
- MD/TXT와 텍스트 PDF는 색인합니다. PNG·스캔 PDF는 OCR이 필요하므로 건너뜁니다.
- 공식 API의 ltx-2-3-fast는 LTX-Video 2B Distilled와 다른 모델입니다.
- 생성 영상의 관절 각도·통증 부하를 검증하는 기능은 아직 없습니다.
- 로컬 개발용 API이며 인증이 없습니다. 외부 배포 전 백엔드 인증·작업 소유권·요청 제한을 연결해야 합니다.

## 파일 구조

- app/main.py: FastAPI 앱 생성·라우터 등록·오류 응답
- app/api/routes.py: HTTP 경로와 요청 검증
- app/core/: .env 설정·서비스 오류
- app/models/text_model.py: ChatOllama 모델 설정
- app/prompts/: LangChain 프롬프트 템플릿
- app/chains/: LCEL 체인과 JSON 파싱·오류 처리
- app/models/embedding_model.py: OllamaEmbeddings 호출·벡터 형식 검사
- app/models/video_model.py: LTX 비동기 작업 접수·조회
- app/services/generation_service.py: 텍스트와 영상 연결
- app/schemas/: 입력/프롬프트 검증
- app/db/: PostgreSQL 연결·pgvector 테이블·저장/검색
- app/rag/: 자료 분할·색인 CLI·검색 임베딩
- examples/: 프롬프트·영상·임베딩 요청 JSON
- tests/: 외부 과금 없이 실행하는 회귀 테스트
- docs/: 호출 순서와 검증 기록
- outputs/: 로컬 실행 결과 (Git 제외)
- data/: 기존 원본 자료 (보존)

API 사용 순서는 [docs/API.md](docs/API.md)를 참고하세요.
실제 모델·영상 검증 결과는 [docs/VERIFICATION.md](docs/VERIFICATION.md)에 기록했습니다.

```powershell
.\.venv\Scripts\python.exe -B -m unittest discover -s tests -v
```

테스트는 LTX 응답을 대체하므로 과금이나 실제 영상 생성을 하지 않습니다.

공식 문서: https://docs.ltx.io/quickstart/
