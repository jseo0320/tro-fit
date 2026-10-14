# V2 Mobility Score Integration & Handoff Specification

> **Date**: 2026-06-28
> **Author**: 박준형 (Vision AI Lead)
> **Status**: Draft -> Action Required
> **Context**: v1(단순 관절 추출 및 각도 계산) E2E 통합이 완료됨에 따라, 기능적 가동성 평가(Functional Mobility Score)가 포함된 v2 파이프라인으로의 마이그레이션 및 팀원별 통합 지침을 정의합니다.

---

## 1. Executive Summary (배경 및 목적)

현재 팀은 프론트엔드와 백엔드를 거쳐 동영상 기반 관절 각도를 추출하는 **v1 코어 루프 연동에 성공**했습니다. 이는 시스템 통합의 가장 큰 허들을 넘은 것입니다.
하지만 v1은 단순한 '물리적 각도'만 반환하므로 사용자에게 유의미한 피드백을 줄 수 없습니다. 따라서 사전에 개발된 **Mobility Score (기능적 등급 평가 시스템)** 및 **폴더 구조 안정화 코드**를 기존 파이프라인에 통합하는 **v2 마이그레이션**이 즉각적으로 필요합니다.

이 문서는 실리콘밸리 Tech Spec(기술 명세서) 표준에 따라, **누가, 무엇을, 어떻게, 왜** 해야 하는지를 명확히 규정하여 커뮤니케이션 비용을 제로로 만듭니다.

---

## 2. Phase 1: 본인 (Vision AI - 박준형) Action Items

가장 먼저 선행되어야 할 본인의 작업입니다. 완벽하게 캡슐화된 블랙박스 형태로 코드를 제공해야 팀원들의 혼선이 없습니다.

### 2.1. 파이프라인에 Mobility Score 연동 및 테스트
* **What**: `snapshot_rom_pipeline.py` 내부 로직에 `mobility_score.py`를 결합합니다.
* **How**:
  1. `snapshot_rom_pipeline.py`의 최종 결과 산출부에서 `mobility_score.py`의 평가 함수(예: `evaluate_mobility()`)를 호출하도록 수정합니다.
  2. 반환되는 JSON 결과에 `rom_ratio`(정상 대비 비율), `grade`(NORMAL/WARNING/CRITICAL) 및 `clinical_meaning`(임상적 의미) 필드를 추가합니다.
  3. 로컬 환경에서 테스트 영상으로 파이프라인을 실행하여, 폴더 구조(`results/{joint}/{movement}/{timestamp}`)와 JSON 출력이 완벽히 동작하는지 **E2E 단위 테스트**를 완료합니다.
* **Why**: Vision 모듈 자체의 결함을 0%로 만들지 않으면, 백엔드 연동 중 발생하는 버그의 원인(프론트/백/AI 중 어디인지)을 추적하기 매우 힘들어집니다.

---

## 3. Phase 2: Deliverables (팀원들에게 전달할 산출물)

본인 작업 완료 직후, Slack/Notion 등을 통해 팀원들에게 다음 패키지를 명확히 전달합니다.

1. **[To 이태균 (Backend) & 조영진 (AI)] v2 파이프라인 소스코드 패키지**
   - 업데이트된 `snapshot_rom_pipeline.py`, `mobility_score.py`, `main.py`
2. **[To 이태균 (Backend) & 한상협 (Frontend)] V2 JSON Contract (데이터 명세)**
   - API 간 통신의 새로운 기준이 될 최종 `rom_analysis_result.json`의 형태. (하단 **5. API Contract** 참조)
3. **[To 조영진 (AI/RAG)] 지식 베이스 기준 문서**
   - `rom_grading_criteria.json` (이 문서는 ChromaDB에 임베딩될 원본 데이터입니다).

---

## 4. Phase 3: 팀원별 Action Items

각 팀원이 넘겨받은 자료를 바탕으로 수행해야 할 작업입니다. 이 내용을 팀 회의나 칸반 보드에 즉시 등록하십시오.

### 👤 4.1. 이태균 (Backend Engineer)
* **What**: 기존 `POST /api/v1/analyze/rom` 엔드포인트를 v2 스키마로 업데이트하고, DB 스키마를 마이그레이션합니다.
* **How**:
  1. **소스 교체**: 백엔드 서버에 통합되어 있는 이전 Vision AI 파이썬 스크립트를 전달받은 v2 코드로 교체합니다.
  2. **DB 스키마 마이그레이션**: 사용자의 ROM 측정 결과를 저장하는 PostgreSQL 테이블에 `mobility_grade` (Enum: NORMAL, WARNING, CRITICAL), `rom_ratio` (Float) 컬럼을 추가합니다.
  3. **API 응답 스키마 수정**: FastAPI의 Pydantic 응답 모델(Response Model)에 v2 JSON Contract 구조를 반영하여 프론트엔드로 그대로 바이패스(Bypass) 또는 가공하여 내려줍니다.
* **Why**: 상태 기반 정보(`grade`)를 DB에 영속적으로 저장해야, 추후 '마이페이지'에서 사용자의 상태 변화(건강 개선도)를 시계열로 보여줄 수 있기 때문입니다.

### 👤 4.2. 한상협 (Frontend Engineer)
* **What**: 단순 숫자로 보여지던 AI 분석 결과 화면을 **등급 기반의 시각적 피드백 UI**로 고도화합니다.
* **How**:
  1. 백엔드에서 반환하는 새로운 JSON 구조를 받아 파싱합니다.
  2. `grade` 필드 값을 기준으로 컴포넌트의 테마를 분기 처리합니다.
     - `NORMAL`: 초록색 (Green) 테마, "정상 범위입니다."
     - `WARNING`: 노란색 (Yellow) 테마, "가동성이 약간 제한되어 있습니다."
     - `CRITICAL`: 빨간색 (Red) 테마, "심각한 제한. 무리하지 마세요."
  3. `clinical_meaning` 필드의 텍스트를 UI 하단 피드백 영역에 그대로 노출합니다.
* **Why**: 일반 사용자는 '무릎 115도'라는 숫자의 의미를 모릅니다. "신호등 색상(Red/Yellow/Green)"과 "일상생활 가능 여부 텍스트"로 변환해주어야 진정한 사용자 경험(UX) 혁신이 이루어집니다.

### 👤 4.3. 조영진 (AI/Vision 통합 및 RAG)
* **What**: 전달받은 `rom_grading_criteria.json` 문서를 RAG 파이프라인의 ChromaDB에 적재(Embedding)합니다.
* **How**:
  1. 해당 JSON을 LangChain 등의 Document Loader를 통해 텍스트 청크로 변환합니다.
  2. 임베딩 모델을 사용해 벡터 스토어(ChromaDB)에 저장합니다.
* **Why**: 이번 1단계 목표가 아니더라도, 2단계에서 LLM이 사용자 맞춤형 안무를 생성할 때 "왜 이 환자에게 스쿼트 대신 가벼운 걷기를 추천했는지"에 대한 정확한 의학적 근거(Ground Truth)로 이 데이터를 검색(Retrieve)해야 하기 때문입니다.

---

## 5. API Contract (V2 JSON Schema 예시)

> 프론트엔드와 백엔드가 반드시 준수해야 하는 새로운 응답 규격입니다.

```json
{
  "session_id": "20260628_153022",
  "joint": "shoulder",
  "movement": "flexion",
  "side": "left",
  "mobility_analysis": [
    {
      "side": "left",
      "measured_angle_deg": 135.5,
      "mobility_score": {
        "normal_deg": 150,
        "rom_ratio": 90.3,
        "grade": "NORMAL",
        "clinical_meaning": "머리 위 선반 포함 대부분의 일상 동작 가능"
      }
    }
  ]
}
```
* **참고**: `--side left` 옵션으로 실행 시 배열에 하나의 항목만 포함됩니다. 비대칭 경고 기능은 V2에서 제거되었습니다.

## 6. Next Steps (우선순위 요약)
1. **[준형]** 내일 오전까지 `snapshot_rom_pipeline.py` 연동 및 V2 코드/Contract 배포.
2. **[태균/상협]** V2 Contract 기준 프론트-백엔드 Mock API 연동 테스트.
3. **[전체]** V2 코드 서버 반영 후, 실시간 카메라 E2E 시연 점검.
