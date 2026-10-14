# Tro-Fit

카메라 기반 관절 가동범위(ROM) 분석과 RAG 기반 안무 영상 생성 프로젝트입니다.

## 구성

- `tro-fit-frontend/frontend`: React Native / Expo 모바일 앱과 웹 UI
- `tro-fit-backend`: FastAPI 인증, ROM 분석, 측정 이력 및 생성 작업 관리
- `tro-fit-ai-vision`: MediaPipe 자세 추정, ROM 알고리즘 및 연구 자료
- `tro-fit-llm`: LangChain, Ollama, pgvector 및 LTX 영상 API 연결
- `deploy`: Docker 배포 안내와 환경변수 예시

현재 텍스트 모델은 `qwen3:8b`, 임베딩 모델은 `qwen3-embedding:0.6b`입니다. 영상 생성에는 LTX 공식 API의 `ltx-2-3-fast`를 사용합니다.

## 실행 준비

[배포 안내](deploy/README.md)를 따라 환경파일, PostgreSQL 외부 볼륨, Ollama 모델 및 NVIDIA GPU 환경을 준비하세요. 실제 환경파일, DB 백업, 모델 가중치는 저장소에 포함하지 않습니다. Android 네이티브 자세 추출 모델도 별도로 준비해야 합니다.

```powershell
docker compose --env-file .env.deploy up -d --build
```

웹 주소는 `http://localhost:8080`입니다. Android 자세 측정에는 네이티브 앱 빌드가 필요합니다. 일부 화면은 예시 데이터 기반이며 실제 영상 재생까지의 전체 UI 연동은 진행 중입니다.

[프로젝트 구조와 구현 범위](PORTFOLIO.md)를 참고하세요. 포트폴리오의 Gemma 설명은 이전 모델 구성 기록이며 현재 설정은 Qwen3입니다.
