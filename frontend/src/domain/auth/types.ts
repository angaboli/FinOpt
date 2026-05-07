export interface User {
  id: string;
  email: string;
}

export interface AuthTokens {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: "bearer";
}

export interface Credentials {
  email: string;
  password: string;
}
