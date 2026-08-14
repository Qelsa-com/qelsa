"use client";

import { User } from "@/types/user";
import { authClient } from "@/lib/auth-client";
import { useGetProfileQuery } from "@/features/api/authApi";
import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const { data: profile, isFetching } = useGetProfileQuery(undefined, { skip: !session });
  const user = (profile as User | undefined) ?? null;

  const logout = useCallback(() => {
    void authClient.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(session && user),
      isLoading: isPending || Boolean(session && isFetching),
      logout,
    }),
    [user, session, isPending, isFetching, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
