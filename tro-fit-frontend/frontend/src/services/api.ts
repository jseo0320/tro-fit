import type {
  AnalyzeRomRequest,
  AuthResponse,
  AuthUser,
  GenerateChoreographyRequest,
  GenerateChoreographyResponse,
  LoginRequest,
  RomAnalysisResult,
  SignupRequest,
  SubmitDifficultyFeedbackRequest,
  SubmitDifficultyFeedbackResponse,
  UpdateProfileRequest,
  WeeklyDanceVideo,
} from '../types/api';
import type { VisionAiRomJsonPayload } from '../types/visionAi';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

let authToken: string | null = null;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

type BackendUser = {
  id: number;
  user_id: string;
  user_name: string;
  user_email: string;
  is_active: boolean;
  user_age?: number;
  user_height?: number;
  user_weight?: number;
};

type BackendLoginResponse = {
  access_token: string;
  token_type: string;
};

type BackendSignupResponse = {
  message: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function logout() {
  setAuthToken(null);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      '백엔드 서버에 연결할 수 없습니다. 서버 주소와 실행 상태를 확인해주세요.',
    );
  }

  if (!response.ok) {
    let message = `API request failed: ${path}`;

    try {
      const data = (await response.json()) as { detail?: string; message?: string };
      message = data.detail ?? data.message ?? message;
    } catch {
      // Keep the default message when the server does not return JSON.
    }

    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

function mapUser(user: BackendUser): AuthUser {
  return {
    id: user.id,
    userId: user.user_id,
    name: user.user_name,
    email: user.user_email,
    isActive: user.is_active,
    age: user.user_age,
    heightCm: user.user_height,
    weightKg: user.user_weight,
  };
}

export function login(payload: LoginRequest) {
  return request<BackendLoginResponse>('/login', {
    method: 'POST',
    body: {
      user_id: payload.userId,
      user_password: payload.password,
    },
  }).then((data): AuthResponse => {
    setAuthToken(data.access_token);

    return {
      accessToken: data.access_token,
      tokenType: data.token_type,
    };
  });
}

export function signup(payload: SignupRequest) {
  return request<BackendSignupResponse>('/signup', {
    method: 'POST',
    body: {
      user_id: payload.userId,
      user_password: payload.password,
      user_email: payload.email,
      user_name: payload.name,
      user_age: payload.age,
      user_height: payload.heightCm,
      user_weight: payload.weightKg,
    },
  }).then(() => login({ userId: payload.userId, password: payload.password }));
}

export function getCurrentUser() {
  return request<BackendUser>('/me').then(mapUser);
}

export function updateCurrentUserProfile(payload: UpdateProfileRequest) {
  return request<BackendUser>('/me/profile', {
    method: 'PATCH',
    body: {
      user_name: payload.name,
      user_email: payload.email,
      user_age: payload.age,
      user_height: payload.heightCm,
      user_weight: payload.weightKg,
    },
  }).then(mapUser);
}

export function analyzeRom(payload: AnalyzeRomRequest) {
  return request<RomAnalysisResult>('/analyze/rom', {
    method: 'POST',
    body: payload,
  });
}

export function submitRomLandmarkJson(payload: VisionAiRomJsonPayload) {
  return request<RomAnalysisResult>('/analyze/rom', {
    method: 'POST',
    body: payload,
  });
}

export function generateChoreography(payload: GenerateChoreographyRequest) {
  return request<GenerateChoreographyResponse>('/choreography/generate', {
    method: 'POST',
    body: payload,
  });
}

export function getWeeklyDanceVideos() {
  return request<WeeklyDanceVideo[]>('/choreography/videos');
}

export function submitDifficultyFeedback(payload: SubmitDifficultyFeedbackRequest) {
  return request<SubmitDifficultyFeedbackResponse>('/choreography/feedback', {
    method: 'POST',
    body: payload,
  });
}
