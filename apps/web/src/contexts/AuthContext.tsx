"use client";

import { User } from "@/types/user";
import { api } from "@/lib/convexApi";
import { authClient } from "@/lib/auth-client";
import { useGetProfileQuery } from "@/features/api/authApi";
import { useMutation } from "convex/react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

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

  const ensureAppUser = useMutation(api.auth.ensureCurrentAppUser);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const provisionAttempted = useRef(false);

  // A signed in identity without an app user row (e.g. created before the
  // provisioning trigger existed) would otherwise never load a profile.
  useEffect(() => {
    if (!session) {
      provisionAttempted.current = false;
      return;
    }
    if (profile !== null || provisionAttempted.current) return;
    provisionAttempted.current = true;
    setIsProvisioning(true);
    void ensureAppUser({})
      .catch(() => undefined)
      .finally(() => setIsProvisioning(false));
  }, [session, profile, ensureAppUser]);

  const logout = useCallback(() => {
    void authClient.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(session && user),
      isLoading: isPending || Boolean(session && (isFetching || isProvisioning)),
      logout,
    }),
    [user, session, isPending, isFetching, isProvisioning, logout],
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
