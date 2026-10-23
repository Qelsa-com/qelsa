import type { Metadata } from "next";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { AdminAuthProvider } from "@/contexts/AuthContext";
import { AlertProvider } from "@/components/ui/alert-modal";
import { Toaster } from "@/components/ui/sonner";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Qelsa Admin",
  description: "Qelsa platform administration",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#06060f] antialiased">
        <ConvexClientProvider>
          <AlertProvider>
            <AdminAuthProvider>{children}</AdminAuthProvider>
            <Toaster position="top-center" richColors />
          </AlertProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}