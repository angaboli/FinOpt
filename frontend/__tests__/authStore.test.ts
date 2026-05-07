import { useAuthStore } from "@/application/auth/authStore";
import { authApi } from "@/infrastructure/api/authApi";
import { tokenStorage } from "@/infrastructure/storage/tokenStorage";

jest.mock("@/infrastructure/api/authApi", () => ({
  authApi: {
    login: jest.fn(),
    signup: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock("@/infrastructure/storage/tokenStorage", () => ({
  tokenStorage: {
    save: jest.fn(),
    clear: jest.fn(),
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
  },
}));

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    error: null,
  });
  jest.clearAllMocks();
});

test("login stores tokens and user", async () => {
  jest.mocked(authApi.login).mockResolvedValue({
    user: { id: "user-id", email: "user@example.com" },
    accessToken: "access",
    refreshToken: "refresh",
    tokenType: "bearer",
  });

  await useAuthStore.getState().login({ email: "user@example.com", password: "password1" });

  expect(tokenStorage.save).toHaveBeenCalledWith("access", "refresh");
  expect(useAuthStore.getState().user?.email).toBe("user@example.com");
});

test("logout revokes session and clears local state", async () => {
  useAuthStore.setState({
    user: { id: "user-id", email: "user@example.com" },
    accessToken: "access",
    refreshToken: "refresh",
  });

  await useAuthStore.getState().logout();

  expect(authApi.logout).toHaveBeenCalledWith("refresh");
  expect(tokenStorage.clear).toHaveBeenCalled();
  expect(useAuthStore.getState().user).toBeNull();
});
