import { UserManagement } from "@/components/UserManagement";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/layout";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const TeamPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth");
    }
  }, [isLoading, isAuthenticated, router]);

  const activePageId = user?.active_page_id;

  return (
    <Layout activeSection={"pages"}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-20">
        {activePageId ? (
          <UserManagement pageId={String(activePageId)} showHeader={true} />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0d0d17]/80 p-10 text-center text-white">
            <h2 className="text-xl font-bold">No active company page found</h2>
            <p className="mt-2 text-sm text-white/60">
              Please select or create a company page to manage team members.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamPage;
