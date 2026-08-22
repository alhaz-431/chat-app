import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthState, User } from "@/types";

interface AuthStore extends AuthState {
  setAuth: (user: User, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "chatapp-auth" }
  )
);