import { useAuth } from "@/contexts/AuthContext";
import { Bell, BookOpen, Briefcase, LogOut, Settings, User, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    onClose();
    // Navigate to the auth flow with proper state
    router.push("/auth?actionType=profile&returnUrl=" + encodeURIComponent(window.location.pathname));
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const menuItems = [
    { icon: User, label: "My Profile", path: "/profile" },
    { icon: Briefcase, label: "My Applications", path: "/applications" },
    { icon: BookOpen, label: "Saved Jobs", path: "/saved" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-80 glass-strong border-l border-glass-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-glass-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">{isAuthenticated ? "My Account" : "Account"}</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-lg glass hover:glass-strong flex items-center justify-center transition-all duration-300 hover:scale-110">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* User Info or Login Prompt */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full glass-strong border-2 border-neon-cyan/30 flex items-center justify-center">
                    {user.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profile_image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                    ) : <User className="w-6 h-6 text-neon-cyan" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{user.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full glass-strong border-2 border-glass-border flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Sign in to unlock your career potential</p>
                  <Button onClick={handleLogin} className="w-full gradient-animated h-10">
                    Sign In / Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            {isAuthenticated && (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          router.push(item.path);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl glass hover:glass-strong border border-transparent hover:border-neon-cyan/30 text-muted-foreground hover:text-white transition-all duration-300 group"
                      >
                        <Icon className="w-5 h-5 group-hover:text-neon-cyan transition-colors" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            {isAuthenticated && (
              <div className="p-4 border-t border-glass-border">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl glass hover:glass-strong border border-glass-border hover:border-red-500/30 text-muted-foreground hover:text-red-400 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            )}

            {/* Info Footer for Non-Authenticated */}
            {!isAuthenticated && (
              <div className="p-4 border-t border-glass-border">
                <p className="text-xs text-muted-foreground text-center">By signing in, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
