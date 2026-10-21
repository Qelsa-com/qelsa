"use client";

import { api } from "@/lib/convexApi";
import { authClient } from "@/lib/auth-client";
import { useConvexQueryHook } from "@/lib/convexHooks";
import { createContext, ReactNode, useCallback, useContext, useMemo } from "react";

export type AdminUser = {
  id: string;
  name?: string | null;
  email: string;
  role: "user" | "admin";
  profile_image?: string | null;
};

interface AdminAuthContextType {
  user: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  // The profile query is the source of truth for the role. It only resolves
  // for a signed-in identity, so it is skipped until a session exists.
  const { data: profile, isFetching } = useConvexQueryHook(
    api.users.me,
    {},
    { skip: !session },
  );

  const user = (profile as AdminUser | undefined) ?? null;

  const logout = useCallback(async () => {
    await authClient.signOut().catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      isLoading: isPending || Boolean(session && isFetching),
      logout,
    }),
    [user, session, isPending, isFetching, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
}