import type { AuthTokens, Credentials, User } from "@/domain/auth/types";
import { httpClient } from "@/infrastructure/api/httpClient";

interface UserApiResponse {
  id: string;
  email: string;
}

interface AuthTokensApiResponse {
  user: UserApiResponse;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

function toAuthTokens(response: AuthTokensApiResponse): AuthTokens {
  return {
    user: response.user,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    tokenType: response.token_type,
  };
}

export const authApi = {
  async signup(credentials: Credentials): Promise<User> {
    const response = await httpClient.post<UserApiResponse>("/auth/signup", credentials);
    return response.data;
  },

  async login(credentials: Credentials): Promise<AuthTokens> {
    const response = await httpClient.post<AuthTokensApiResponse>("/auth/login", credentials);
    return toAuthTokens(response.data);
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const response = await httpClient.post<AuthTokensApiResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return toAuthTokens(response.data);
  },

  async logout(refreshToken: string): Promise<void> {
    await httpClient.post("/auth/logout", { refresh_token: refreshToken });
  },
};
