import RouteGuard from "@/components/auth/RouteGuard";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ResumeDraftSync } from "@/components/onboarding/ResumeDraftSync";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <ConvexClientProvider>
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
