import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { tokenStorage } from "@/infrastructure/storage/tokenStorage";

export const httpClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000",
  timeout: 10000,
});

httpClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const accessToken = await tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status !== 401 || !error.config) {
      throw error;
    }
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw error;
    }
    const refreshed = await httpClient.post<AuthTokensApiResponse>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    await tokenStorage.save(refreshed.data.access_token, refreshed.data.refresh_token);
    error.config.headers.Authorization = `Bearer ${refreshed.data.access_token}`;
    return httpClient.request(error.config);
  },
);

interface AuthTokensApiResponse {
  access_token: string;
  refresh_token: string;
}
