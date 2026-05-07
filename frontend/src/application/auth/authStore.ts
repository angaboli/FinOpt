import { isAxiosError } from "axios";
import { create } from "zustand";

import type { AuthTokens, Credentials, User } from "@/domain/auth/types";
import { authApi } from "@/infrastructure/api/authApi";
import { tokenStorage } from "@/infrastructure/storage/tokenStorage";

function loginErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return "Impossible de joindre le serveur";
    if (error.response.status === 401) return "Identifiants invalides";
    return `Erreur serveur (${error.response.status})`;
  }
  return "Identifiants invalides";
}

function signupErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return "Impossible de joindre le serveur";
    if (error.response.status === 409) return "Cette adresse email est déjà utilisée";
    return `Erreur serveur (${error.response.status})`;
  }
  return "Inscription impossible";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  signup: (credentials: Credentials) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

async function persistSession(tokens: AuthTokens): Promise<void> {
  await tokenStorage.save(tokens.accessToken, tokens.refreshToken);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,

  async login(credentials) {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.login(credentials);
      await persistSession(tokens);
      set({
        user: tokens.user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      set({ error: loginErrorMessage(error), isLoading: false });
    }
  },

  async signup(credentials) {
    set({ isLoading: true, error: null });
    try {
      await authApi.signup(credentials);
      const tokens = await authApi.login(credentials);
      await persistSession(tokens);
      set({
        user: tokens.user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      set({ error: signupErrorMessage(error), isLoading: false });
    }
  },

  async refreshSession() {
    const refreshToken = get().refreshToken ?? (await tokenStorage.getRefreshToken());
    if (!refreshToken) {
      return;
    }
    const tokens = await authApi.refresh(refreshToken);
    await persistSession(tokens);
    set({
      user: tokens.user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  async logout() {
    const refreshToken = get().refreshToken ?? (await tokenStorage.getRefreshToken());
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    await tokenStorage.clear();
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },
}));
