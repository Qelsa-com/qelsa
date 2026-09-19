import RouteGuard from "@/components/auth/RouteGuard";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResumeDraftSync } from "@/components/onboarding/ResumeDraftSync";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { useJobNavigationTracker } from "@/lib/jobNavigation";
import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  useJobNavigationTracker();
  return (
    <ConvexClientProvider>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <AuthProvider>
        <RouteGuard>
          <ResumeDraftSync />
          <ErrorBoundary label="this page">
            <Component {...pageProps} />
          </ErrorBoundary>
          <Toaster position="top-center" richColors />
        </RouteGuard>
      </AuthProvider>
    </ConvexClientProvider>
  );
}
