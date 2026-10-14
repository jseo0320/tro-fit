"""External video API adapter boundary. No local GPU model is downloaded."""
import re
from urllib.parse import urlparse
import httpx
from ..core.config import SETTINGS
from ..core.errors import ServiceError
from ..schemas import VideoPrompt


def require_video_provider() -> None:
    if not SETTINGS.get('LTX_API_KEY'):
        raise ServiceError('video_key_missing', '.env에 LTX_API_KEY를 설정하세요.', 503)
    if SETTINGS.get('LTX_MODEL') not in ('ltx-2-3-fast', 'ltx-2-3-pro'):
        raise ServiceError('video_model_not_configured',
                           'LTX_MODEL에 ltx-2-3-fast 또는 ltx-2-3-pro를 선택하세요. 2B Distilled는 공식 API에서 지원하지 않습니다.', 503)


async def _request(method: str, path: str, payload=None) -> dict:
    if not SETTINGS.get('LTX_API_KEY'):
        raise ServiceError('video_key_missing', 'LTX_API_KEY를 설정하세요.', 503)
    try:
        async with httpx.AsyncClient(timeout=60, follow_redirects=False) as client:
            response = await client.request(method, 'https://api.ltx.io/v2/text-to-video'+path,
                headers={'Authorization': 'Bearer '+SETTINGS['LTX_API_KEY']}, json=payload)
        if response.status_code >= 300:
            codes = {401: 'video_auth_failed', 402: 'video_insufficient_credit',
                     404: 'video_job_not_found', 429: 'video_rate_limited'}
            raise ServiceError(codes.get(response.status_code, 'video_api_failed'),
                               'LTX API 요청이 거절되었습니다. 키, 잔액, 작업 ID 또는 요청 제한을 확인하세요.',
                               404 if response.status_code == 404 else 502)
        data = response.json()
        if not isinstance(data, dict):
            raise ValueError()
        return data
    except httpx.HTTPError:
        # No automatic POST retry: the provider may already have accepted a billed job.
        raise ServiceError('video_connection_failed',
                           'LTX 연결 실패 또는 시간 초과입니다. 재요청 전에 콘솔에서 접수 여부를 확인하세요.', 503) from None
    except ValueError:
        raise ServiceError('invalid_video_response', 'LTX 응답 형식이 올바르지 않습니다.') from None


async def generate_video(prompt: VideoPrompt) -> dict:
    require_video_provider()
    data = await _request('POST', '', {'prompt': prompt.video_prompt,
        'model': SETTINGS['LTX_MODEL'], 'duration': 6,
        'resolution': '1280x720', 'fps': 24, 'generate_audio': False})
    job_id = data.get('id')
    if not isinstance(job_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,128}', job_id):
        raise ServiceError('invalid_video_response', 'LTX가 작업 ID를 반환하지 않았습니다.')
    return {'job_id': job_id, 'status': 'pending', 'status_url': f'/jobs/{job_id}',
            'model': SETTINGS['LTX_MODEL']}


async def get_job(job_id: str) -> dict:
    data = await _request('GET', '/'+job_id)
    status = data.get('status')
    if status not in ('pending', 'processing', 'completed', 'failed'):
        raise ServiceError('invalid_video_response', '알 수 없는 영상 작업 상태입니다.')
    result = {'job_id': job_id, 'status': status}
    if status == 'completed':
        output = data.get('result')
        url = output.get('video_url') if isinstance(output, dict) else None
        if not isinstance(url, str) or urlparse(url).scheme != 'https' or not urlparse(url).netloc:
            raise ServiceError('invalid_video_response', '완료된 영상 URL이 없습니다.')
        result['video_url'] = url
    elif status == 'failed':
        result['error'] = 'LTX 영상 생성에 실패했습니다. 콘솔에서 원인을 확인하세요.'
    return result
