# API 호출 순서

## 1. 프롬프트만 확인

Swagger의 `POST /prompts`에 `examples/generate.json`을 입력합니다.
Gemma 4가 아래 형태의 JSON을 반환합니다. 이 단계에서는 LTX 과금이 없습니다.

```json
{"video_prompt":"A single adult dancer taking slow side steps..."}
```

## 2. 영상 작업 접수

위 JSON을 `POST /videos`에 전달합니다. 또는 `POST /generate`에 한국어 prompt를 보내면
Gemma 프롬프트 생성과 LTX 접수를 한 번에 처리합니다.

```json
{
  "job_id": "실제 LTX 작업 ID",
  "status": "pending",
  "status_url": "/jobs/실제 LTX 작업 ID",
  "model": "ltx-2-3-fast"
}
```

HTTP 202는 접수 완료이며 영상 완성이 아닙니다. 생성 요청은 6초·720p·24fps·무음이며 과금됩니다.
실패 또는 접수 시간 초과 때에는 중복 요청 전에 LTX 콘솔의 작업 내역을 확인하세요.

## 3. 결과 조회

5초 이상 간격으로 `GET /jobs/{job_id}`를 호출합니다.
completed 상태의 video_url에서 MP4를 받을 수 있습니다. failed면 조회를 중단합니다.
이 MVP는 외부 URL을 반환하며 자동으로 MP4를 서버에 저장하지 않습니다.
URL은 만료될 수 있으므로 필요한 영상은 내려받아 보관하세요.

## 4. 임베딩

`POST /embeddings`에 `examples/embeddings.json`을 보내면
`model`, `dimensions`, `embeddings`가 반환됩니다.
qwen3-embedding:0.6b의 현재 출력은 문장당 1024차원입니다.
임베딩 생성은 자료 색인·벡터 DB 저장·RAG 검색과 별개입니다.

## 오류 형식

```json
{"error":{"code":"video_insufficient_credit","message":"..."}}
```

키가 틀리면 video_auth_failed, 잔액 부족은 video_insufficient_credit,
요청 제한은 video_rate_limited, 연결 실패는 video_connection_failed입니다.
입력 형식 오류는 FastAPI의 기본 422 응답입니다. 외부 서비스의 원문 오류나 API 키는 노출하지 않습니다.
