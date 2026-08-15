interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ErrorResponse {
  status: number;
  data?: {
    message?: string;
  };
}
