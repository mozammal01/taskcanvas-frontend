import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import * as authApi from "@/lib/api/auth";
import type { AuthTokens, User } from "@/types/auth";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { user, ...tokens } = await authApi.login({ email, password });
          set({ user, tokens, isLoading: false });
        } catch {
          set({ error: "Invalid email or password", isLoading: false });
          throw new Error("Invalid email or password");
        }
      },
      logout: () => set({ user: null, tokens: null }),
    }),
    {
      name: "taskcanvas-auth",
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
    }
  )
);

/**
 * True once the persisted auth state has been read from localStorage.
 * `useAuthStore.persist` only exists client-side (accessing localStorage
 * during SSR disables the persist middleware for that render), so it must
 * only ever be touched inside an effect, never during render.
 */
export function useAuthHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(useAuthStore.persist.hasHydrated());
    return useAuthStore.persist.onFinishHydration(() => setHasHydrated(true));
  }, []);

  return hasHydrated;
}