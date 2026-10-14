import json
from pathlib import Path
import subprocess
from unittest.mock import patch
import cv2
import numpy as np
from tro_fit_llm.app import video
from tro_fit_llm.app.validation import validate_video


def test_video_adapter_creates_decodable_mp4_and_missing_pose_is_not_passed(tmp_path):
    real_run = subprocess.run
    def fake_ltx(command, **kwargs):
        if command[0] != sys.executable:
            return real_run(command, **kwargs)
        data = json.loads(Path(command[-1]).read_text(encoding='utf-8'))
        path = Path(data['output_dir']) / 'generated.mp4'
        writer = cv2.VideoWriter(str(path), cv2.VideoWriter_fourcc(*'mp4v'), data['fps'],
                                 (data['width'], data['height']))
        assert writer.isOpened()
        for _ in range(data['num_frames']):
            writer.write(np.zeros((data['height'], data['width'], 3), dtype=np.uint8))
        writer.release()
    import sys
    request = {'segments': [{'prompt': 'test-only motion', 'duration_seconds': 0.5}]}
    with patch.object(video, 'settings', return_value={'LTX_PYTHON': sys.executable}), \
            patch.object(video, 'output_root', return_value=tmp_path), \
            patch.object(video.subprocess, 'run', side_effect=fake_ltx):
        result = video.generate_video(request)
    assert result['duration_seconds'] == 0.5
    assert Path(result['path']).stat().st_size > 0
    report = validate_video(result['path'], {'duration_seconds': 0.5,
         'timeline': [{'start_seconds': 0, 'duration_seconds': 0.5, 'targets_deg': {'right_elbow_flexion': 20}}]})
    assert report['status'] == 'needs_review'
    assert report['frames_checked'] == 12
    assert report['missing_measurements'] == 12
