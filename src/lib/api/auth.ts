import { apiClient } from "@/lib/api/client";
import type { AuthTokens, LoginPayload, User } from "@/types/auth";

export async function login(payload: LoginPayload) {
  const { data } = await apiClient.post<AuthTokens & { user: User }>(
    "/auth/login/",
    payload
  );
  return data;
}