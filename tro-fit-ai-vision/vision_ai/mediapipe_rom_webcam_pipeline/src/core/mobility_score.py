"""
mobility_score.py — Tro-Fit 관절 가동성 등급 평가 엔진
========================================================

[적용 범위]
  normal_rom.json에 정의된 7개 동작만 지원:
    어깨: shoulder_flexion / shoulder_extension / shoulder_abduction
    팔꿈치: elbow_flexion / elbow_extension
    무릎: knee_flexion / knee_extension

  고관절(hip)·발목(ankle)은 MediaPipe 벡터 정의와 해부학적 임상값이
  달라 신뢰성 있는 등급화가 불가능하므로 1차 개발 범위에서 제외합니다.

[논문 근거]
  어깨 굴곡/외전 : Namdari S et al. J Shoulder Elbow Surg. 2012;21(9):1177-83.
  어깨 신전      : AMA 기준값 기반 (ADL 전용 확정 논문 없음, 비율 등분)
  팔꿈치 굴곡/신전: Morrey BF et al. J Bone Joint Surg Am. 1981;63(6):872-7.
  무릎 굴곡      : Rowe PJ et al. Gait Posture. 2000;12(2):143-55.
  무릎 신전      : 임상 관행 기반 (완전 신전 불가 시 보행 장애)
  좌우 비대칭    : 임상 관행 기반 (15° 경계값)

[등급 방향 정의]
  higher_is_better (굴곡 계열):
    측정 ROM이 클수록 좋음. min_deg 이상이면 상위 등급.
    예: 무릎 굴곡 120° 이상 → NORMAL

  lower_is_better (신전 계열):
    측정값(구축각)이 작을수록 좋음. max_deg 이하이면 상위 등급.
    예: 무릎 신전 10° 이하 잔류 → NORMAL (완전 신전에 가까움)

[사용법]
  from core.mobility_score import calculate_mobility_score

  result = calculate_mobility_score({
      "joint":     "knee_flexion",
      "left_rom":  118.5,
      "right_rom": 105.2,
  })

[출력 스키마]
  {
    "grade":           "NORMAL" | "WARNING" | "CRITICAL",
    "clinical_meaning": str,
    "recommendation":  str,
    "adl_ok":          list[str],
    "adl_limited":     list[str],
    "scoring_basis":   str,
  }
"""

from __future__ import annotations
from typing import Literal

# ─────────────────────────────────────────────────────────────────────────────
# 타입 정의
# ─────────────────────────────────────────────────────────────────────────────

Grade = Literal["NORMAL", "WARNING", "CRITICAL"]


# ─────────────────────────────────────────────────────────────────────────────
# 등급 기준 테이블
# ─────────────────────────────────────────────────────────────────────────────
# 형식:
#   "higher_is_better" 동작 (굴곡 계열):
#     (NORMAL_min, WARNING_min)
#     ROM >= NORMAL_min → NORMAL
#     ROM >= WARNING_min → WARNING
#     ROM < WARNING_min → CRITICAL
#
#   "lower_is_better" 동작 (신전 계열):
#     (NORMAL_max, WARNING_max)  ← 구축각(잔류 굴곡)
#     구축각 <= NORMAL_max  → NORMAL
#     구축각 <= WARNING_max → WARNING
#     구축각 > WARNING_max  → CRITICAL

import json
from pathlib import Path

_CORE_DIR = Path(__file__).resolve().parent
_SRC_DIR = _CORE_DIR.parent
_PIPELINE_DIR = _SRC_DIR.parent

def _load_criteria_json() -> dict:
    json_path = _PIPELINE_DIR / "rom_grading_criteria.json"
    if not json_path.exists():
        print(f"[WARN] mobility_score: {json_path} 를 찾을 수 없습니다. 빈 기준을 사용합니다.")
        return {}
    
    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        joints_data = data.get("joints", {})
        
        parsed_joints = {}
        for j_name, j_info in joints_data.items():
            direction = j_info.get("grade_direction", "higher_is_better")
            
            # thresholds 계산
            grades = j_info.get("grades", {})
            normal_grade = grades.get("NORMAL", {})
            warning_grade = grades.get("WARNING", {})
            
            if direction == "higher_is_better":
                t1 = float(normal_grade.get("min_deg", 0))
                t2 = float(warning_grade.get("min_deg", 0))
            else:
                t1 = float(normal_grade.get("max_deg", 0))
                t2 = float(warning_grade.get("max_deg", 0))
                
            parsed_joints[j_name] = {
                "direction": direction,
                "thresholds": (t1, t2),
                "basis": j_info.get("basis", ""),
                "grades": grades
            }
        return parsed_joints
    except Exception as e:
        print(f"[WARN] mobility_score: JSON 파싱 에러 - {e}")
        return {}

_JOINTS = _load_criteria_json()

# ─────────────────────────────────────────────────────────────────────────────
# 지원 관절 목록 (외부 참조용)
# ─────────────────────────────────────────────────────────────────────────────
SUPPORTED_JOINTS: list[str] = list(_JOINTS.keys())
# ['shoulder_flexion', 'shoulder_extension', 'shoulder_abduction',
#  'elbow_flexion', 'elbow_extension', 'knee_flexion', 'knee_extension']


# ─────────────────────────────────────────────────────────────────────────────
# 핵심 함수
# ─────────────────────────────────────────────────────────────────────────────

def grade_single_rom(joint: str, rom_deg: float | None) -> Grade:
    """
    단일 ROM 수치를 NORMAL / WARNING / CRITICAL 등급으로 변환합니다.

    Args:
        joint:   관절 키 (예: "knee_flexion", "elbow_extension")
        rom_deg: 측정된 ROM 각도.
                 - 굴곡 계열(higher_is_better): 측정된 최대 굴곡각
                 - 신전 계열(lower_is_better):  잔류 굴곡각(구축각). 0°=완전신전.
                 None이면 CRITICAL 처리.

    Returns:
        "NORMAL" | "WARNING" | "CRITICAL"
    """
    if rom_deg is None or rom_deg < 0:
        return "CRITICAL"

    joint_def = _JOINTS.get(joint)
    if joint_def is None:
        print(f"[WARN] mobility_score: 미지원 관절 '{joint}'. SUPPORTED_JOINTS: {SUPPORTED_JOINTS}")
        return "NORMAL"   # 알 수 없는 관절은 판정 유보

    direction = joint_def["direction"]
    t1, t2    = joint_def["thresholds"]
    
    # 카메라 앵글 오차 및 임상 관절가동범위 측정계(Goniometer) 표준 오차를 고려한 6도 여유 마진
    ERROR_MARGIN_DEG = 6.0

    if direction == "higher_is_better":
        normal_min, warning_min = t1, t2
        if rom_deg >= (normal_min - ERROR_MARGIN_DEG):
            return "NORMAL"
        elif rom_deg >= (warning_min - ERROR_MARGIN_DEG):
            return "WARNING"
        else:
            return "CRITICAL"

    else:  # lower_is_better (신전 계열 — 구축각)
        normal_max, warning_max = t1, t2
        if rom_deg <= (normal_max + ERROR_MARGIN_DEG):
            return "NORMAL"
        elif rom_deg <= (warning_max + ERROR_MARGIN_DEG):
            return "WARNING"
        else:
            return "CRITICAL"


def evaluate_mobility(joint: str, angle_deg: float | None) -> dict:
    """
    단일 관절의 가동성(ROM 또는 Max Angle)을 평가하여 등급 및 임상적 의미를 반환합니다.

    Args:
        joint: 관절 키 (예: "shoulder_flexion")
        angle_deg: 측정된 각도

    Returns:
        Mobility Score 딕셔너리 (모듈 docstring의 [출력 스키마] 참조)
    """
    grade = grade_single_rom(joint, _as_float(angle_deg))

    # 등급별 텍스트 가져오기
    joint_def   = _JOINTS.get(joint, {})
    grade_info  = joint_def.get("grades", {}).get(grade, {})

    clinical_meaning = grade_info.get("clinical_meaning", "알 수 없는 관절입니다.")
    recommendation   = grade_info.get("recommendation", "전문가 상담을 권장합니다.")
    adl_ok           = grade_info.get("adl_ok", [])
    adl_limited      = grade_info.get("adl_limited", [])
    scoring_basis    = joint_def.get("basis", "논문 미지정")

    return {
        "grade":            grade,
        "clinical_meaning": clinical_meaning,
        "recommendation":   recommendation,
        "adl_ok":           adl_ok,
        "adl_limited":      adl_limited,
        "scoring_basis":    scoring_basis,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 내부 헬퍼
# ─────────────────────────────────────────────────────────────────────────────

def _as_float(v) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 독립 실행 테스트
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("\n[Tro-Fit] Mobility Score Engine v1.1 — Self Test")
    print(f"  지원 관절: {SUPPORTED_JOINTS}")
    print("=" * 65)

    test_cases = [
        # (설명,          joint,                angle)
        ("어깨굴곡 NORMAL",  "shoulder_flexion",   135.0),
        ("어깨외전 WARNING", "shoulder_abduction", 95.0),
        ("팔꿈치굴곡 WARN",  "elbow_flexion",      105.0),
        ("팔꿈치신전 NORM",  "elbow_extension",    8.0),   # 구축각 8°
        ("팔꿈치신전 CRIT",  "elbow_extension",    35.0),  # 구축각 35°
        ("무릎굴곡 CRITICAL","knee_flexion",       80.0),
        ("무릎신전 NORMAL",  "knee_extension",     5.0),   # 구축각 5°
    ]

    for desc, joint, angle in test_cases:
        r = evaluate_mobility(joint, angle)
        print(f"\n  [{desc}]")
        print(f"    관절     : {joint}")
        print(f"    각도     : {angle}° ({r['grade']})")
        print(f"    임상의미  : {r['clinical_meaning']}")
        print(f"    가능ADL  : {r['adl_ok'] or '없음'}")
        print(f"    제한ADL  : {r['adl_limited'] or '없음'}")

