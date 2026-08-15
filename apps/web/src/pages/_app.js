import RouteGuard from "@/components/auth/RouteGuard";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import "../styles/globals.css";
import { Toaster } from "@/components/ui/sonner";

export default function App({ Component, pageProps }) {
  return (
    <ConvexClientProvider>
      <AuthProvider>
        <RouteGuard>
          <Component {...pageProps} />
          <Toaster position="top-center" richColors />
        </RouteGuard>
      </AuthProvider>
    </ConvexClientProvider>
  );
}
