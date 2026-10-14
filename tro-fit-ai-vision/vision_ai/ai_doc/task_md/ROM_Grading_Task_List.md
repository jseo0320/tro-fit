# ROM 등급 기준 고도화 작업 (To-Do List)

> **목적:** 기존의 단순 % 기반 위험/주의/정상 판단의 한계를 극복하고, **ADL(일상생활수행능력) 연구 논문 기반의 절대 각도 임계점(Functional Cut-off)**을 적용하여 LLM 기반 추천의 정확도를 높입니다.

---

## 📋 Task 1: 등급 기준 JSON 데이터 작성 (`rom_grading_criteria.json` 또는 기존 파일 확장)

가장 시급한 작업입니다. ADL 연구 문서(`Functional_ROM_ADL_Research.md`)를 참고하여 기존 `normal_rom.json`을 확장하거나 새로운 JSON 파일을 작성합니다.

> **💡 ADL(일상생활수행능력) 연구 논문 출처 및 검색 팁**
> 데이터를 보강하거나 추가 관절(고관절, 발목 등)을 조사할 때 다음 자료를 참고하세요.
> *   **팔꿈치 핵심 논문:** Morrey BF, Askew LJ, Chao EY (1981), "A biomechanical study of normal functional motion of the elbow" (J Bone Joint Surg Am)
> *   **어깨 핵심 논문:** Magermans et al. (2005), "Requirements for upper extremity motions during activities of daily living" (Clin Biomech)
> *   **추가 검색어 (구글 스칼라/PubMed):** `"functional range of motion" [관절명] ADL` (예: `"functional range of motion" shoulder adl`)

*   **[ ] 관절별 기능적 임계점(min_deg) 설정**
    *   어깨 굴곡/외전: NORMAL(130°+), WARNING(90°~129°), CRITICAL(90° 미만)
    *   팔꿈치 굴곡: NORMAL(130°+), WARNING(100°~129°), CRITICAL(100° 미만)
    *   무릎 굴곡: NORMAL(120°+), WARNING(90°~119°), CRITICAL(90° 미만)
*   **[ ] 임상적 의미(clinical_meaning) 추가**
    *   LLM이 사용자에게 설명할 수 있도록 각 등급별로 "왜 이 상태가 문제인지(예: 찬장 물건 꺼내기 불편 등)"를 명시합니다.
*   **[ ] 좌우 비대칭(Asymmetry) 기준 추가**
    *   단순 %가 아닌 절대 각도 차이(예: `asymmetry_alert_deg: 10` 또는 `15`)를 기준으로 설정합니다.

---

## 📋 Task 2: 파이프라인 데이터 포맷 검토

새롭게 만든 JSON 스키마가 현재 코드 파이프라인과 잘 맞는지 확인합니다.

*   **[ ] JSON 스키마 구조 확정**
    *   관절별로 `normal_deg`, `grade` (NORMAL, WARNING, CRITICAL), `asymmetry_alert_deg` 항목이 일관성 있게 들어갔는지 검증.

---

## 📋 Task 3: 조영진(AI/Vision)에게 자료 전달 및 임베딩 가이드

작성된 데이터와 그 근거를 조영진 님에게 전달하여 ChromaDB에 올바르게 임베딩되도록 합니다.

*   **[ ] 전달 물품 패키징**
    1.  완성된 등급 기준 JSON 데이터 (`rom_grading_criteria.json` 또는 확장된 `normal_rom.json`)
    2.  ADL 연구 근거 문서 (`Functional_ROM_ADL_Research.md`)
    3.  ROM 측정 프로토콜 설계 문서 (`ROM_측정_프로토콜_설계.md` - 계산 공식 포함)
*   **[ ] LLM 프롬프팅/임베딩 시 주의사항 가이드**
    *   조영진 님에게 *"사용자의 측정 각도를 %가 아닌 절대 각도(min_deg)와 대조하여 Grade를 판단하고, clinical_meaning을 바탕으로 운동을 추천하도록"* 임베딩 및 프롬프트 설계를 요청합니다.

---

## 📝 참고 자료 링크
*   [ADL 기반 기능적 관절 가동 범위 (Functional ROM) 연구 요약](file:///C:/workspace/trofit/vision_ai/ai_doc/rom_doc/Functional_ROM_ADL_Research.md)
*   [ROM 측정 프로토콜 설계](file:///C:/workspace/trofit/vision_ai/ai_doc/rom_doc/ROM_측정_프로토콜_설계.md)
