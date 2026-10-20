"use client";

import { useAdminAuth } from "@/contexts/AuthContext";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Route guard for the admin app.
 *
 * Only an identity whose app user has `role === "admin"` may use the app.
 * This is the client-side half of the check: it keeps non-admins out of the
 * UI. The real enforcement is on the Convex side, where every admin query
 * and mutation re-checks the role server side, so a client that bypasses this
 * guard still cannot read or change anything.
 */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading } = useAdminAuth();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const checking = isPending || isLoading;

  useEffect(() => {
    if (checking) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      // Signed in but not an admin: sign out so the session cookie is dropped
      // instead of leaving a half-authorized session behind.
      void authClient.signOut().catch(() => undefined);
      router.replace("/login?error=not_admin");
    }  }, [checking, session, isAdmin, router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#06060f] text-white">
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (!session || !isAdmin) return null;

  return <>{children}</>;
}