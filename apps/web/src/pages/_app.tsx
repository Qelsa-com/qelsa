import RouteGuard, { isPublicPath } from "@/components/auth/RouteGuard";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResumeDraftSync } from "@/components/onboarding/ResumeDraftSync";
import { AlertProvider } from "@/components/ui/alert-modal";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { useJobNavigationTracker } from "@/lib/jobNavigation";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import "../styles/globals.css";

/** Routes that are public but should still stay out of search results. */
const NOINDEX_PUBLIC = new Set(["/auth", "/login", "/register", "/employer/auth", "/404"]);

export default function App({ Component, pageProps }: AppProps) {
  useJobNavigationTracker();
  const router = useRouter();
  const noindex = NOINDEX_PUBLIC.has(router.pathname) || !isPublicPath(router.pathname);

  return (
    <ConvexClientProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
        {/* Public pages render their own <Seo>; app/auth pages stay out of the index. */}
        {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
        {noindex ? <title>Qelsa</title> : null}
      </Head>
      <AuthProvider>
        <AlertProvider>
          <RouteGuard>
            <ResumeDraftSync />
            <ErrorBoundary label="this page">
              <Component {...pageProps} />
            </ErrorBoundary>
            <Toaster position="top-center" richColors />
          </RouteGuard>
        </AlertProvider>
      </AuthProvider>
    </ConvexClientProvider>
  );
}
