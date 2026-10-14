# Tro-Fit Backend 🏋️‍♂️🩺

> **FastAPI 및 3D 관절 랜드마크 분석 기반 실시간 관절 가동범위(ROM) 측정 및 JWT 인증 서버**

`tro-fit-backend`는 MediaPipe Pose Landmarker 등을 통해 추출된 3D 관절 좌표(Landmarks) 데이터를 전달받아 기하학적 연산을 수행하고, 실제 임상 및 피트니스 등에서 사용되는 관절 가동범위(ROM, Range of Motion)를 산출해 내는 백엔드 서버입니다. 또한 사용자 관리와 JWT 기반 인증 시스템을 제공하여, 가동성 측정 이력을 지속적으로 추적하고 주차별 가동성 점수 변화 추이를 관리할 수 있도록 설계되었습니다.

---

## ✨ 주요 기능 (Key Features)

1. **기하학적 3D ROM 연산 엔진 (`app/services/rom_analysis.py`)**
   - 온디바이스(웹/모바일)에서 추출된 3D 포즈 랜드마크 프레임 데이터를 수신.
   - Vector Dot Product 및 3D 공간 상의 각도 산출을 통해 어깨, 팔꿈치, 고관절, 무릎, 발목의 정확한 각도 계산.
   - 캡처 주기 중 Neutral(중립/시작) 프레임과 Max(최대 가동) 프레임을 신뢰성(Visibility) 및 각도 임계값(Extremeness) 기반으로 자동 선별.
   - 학계/임상 기준 정상 가동범위(`NORMAL_ROM`)와 비교하여 관절별 가동 범위 비율 및 등급(`NORMAL`, `WARNING`, `CRITICAL`) 판정 및 임상적 설명 제공.

2. **사용자 관리 & JWT 인증 시스템 (`app/api/v1/endpoints/user.py`)**
   - 회원가입 시 비밀번호 단방향 솔트(Salt) 해싱 적용을 통한 보안 강화.
   - JWT(Access Token) 발급을 통한 무상태(Stateless) 로그인/로그아웃 시스템.
   - 로그인된 세션을 통한 안전한 개인 프로필 관리 및 데이터 오너십 보장.

3. **시간 경과형 가동 범위 추적 (ROM History Tracking)**
   - 각 측정 시점별 데이터를 데이터베이스에 기록하고, 해당 유저의 최초 측정일 기준 주차(`week_number`)를 동적으로 계산.
   - 주차별, 관절별 가동성 상태 변화 및 추이를 시각화/트래킹할 수 있는 이력 조회 API 제공.

4. **다중 DB 및 ORM 유연성 (`app/db/session.py`)**
   - 개발 및 로컬 테스트용 SQLite 자동 폴백 지원.
   - 환경 변수 설정을 통한 프로덕션용 PostgreSQL 연동 지원.
   - SQLAlchemy ORM을 활용한 정형화된 데이터 스키마 관리.

5. **자체 테스트 스위트 및 정적 테스트 페이지**
   - API 엔드포인트 및 ROM 연산 엔진 로직 검증을 위한 `pytest` 기반의 통합 테스트 코드 구비.
   - 빠른 서버 동작 확인을 위한 테스트 웹페이지(`app/static/index.html`) 내장.

---

## 🛠️ 프로젝트 파일 구조 (Repository Structure)

```text
tro-fit-backend/
├── .env.example            # 로컬 환경 변수 설정 템플릿
├── requirements.txt        # 프로젝트 실행 의존 라이브러리 목록
├── run.bat                 # 로컬 uvicorn 서버 실행 배치 파일
├── app/
│   ├── main.py             # FastAPI 앱 초기화 및 라우터 등록
│   ├── celery_app.py       # (선택) Celery 비동기 타스크 설정
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── user.py     # 회원가입, 로그인, 내 정보 조회 API
│   │       │   ├── rom.py      # ROM 분석 수행 및 이력 조회 API
│   │       │   └── diagnosis.py# 정밀 분석/진단 관리 API (확장용)
│   │       └── routers.py      # API v1 라우터 모듈 통합
│   ├── core/
│   │   ├── config.py       # 시스템 환경설정 및 DB/JWT 매개변수 로드
│   │   └── security.py     # 비밀번호 해싱(Salt/Hash) 및 JWT 토큰 처리
│   ├── crud/
│   │   └── user.py         # User DB CRUD 헬퍼
│   ├── db/
│   │   ├── base.py         # SQLAlchemy Base 선언
│   │   └── session.py      # DB 커넥션 엔진 및 세션 의존성 주입(get_db)
│   ├── models/             # SQLAlchemy DB 테이블 매핑 모델
│   │   ├── user.py         # 사용자 테이블 스키마
│   │   ├── rom.py          # ROM 측정 이력 테이블 스키마
│   │   └── diagnosis.py    # 진단 정보 테이블 스키마
│   ├── schemas/            # Pydantic 데이터 검증/직렬화 스키마
│   │   ├── user.py         # 사용자 DTO
│   │   ├── rom.py          # ROM 입력 프레임 및 출력 분석 결과 DTO
│   │   └── diagnosis.py    # 진단 통계 정보 DTO
│   ├── services/
│   │   └── rom_analysis.py # 3D 공간 각도 산출 및 중립/최대 프레임 판정 알고리즘
│   ├── static/
│   │   └── index.html      # 서버 동작 점검용 프론트엔드 정적 웹페이지
│   └── tests/              # pytest 테스트 스위트
│       ├── test_rom.py     # ROM 분석 엔진 및 API 연동 유닛 테스트
│       └── test_user.py    # 사용자 기능 단위 테스트
```
