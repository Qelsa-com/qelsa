import { formatCity } from "@/constants/city";
import { useAuth } from "@/contexts/AuthContext";
import { Award, Bell, Briefcase, Calendar, Github, Globe, GraduationCap, Linkedin, LogOut, Mail, MapPin, Settings, Shield, Twitter, User, X } from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleNavigation = (section: string) => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-80 lg:w-96 glass-strong border-l border-glass-border z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 glass-strong border-b border-glass-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-0.5">
              <div className="w-full h-full rounded-full glass flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </div>
            <h2 className="font-bold text-foreground">Profile</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-foreground hover:text-neon-cyan hover:bg-glass-bg transition-all duration-300">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6">
          {/* Profile Summary */}
          <div className="text-center">
            <div className="relative mx-auto mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink p-1">
                <div className="w-full h-full rounded-full glass flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neon-green rounded-full border-2 border-background flex items-center justify-center">
                <div className="w-3 h-3 bg-neon-green rounded-full animate-pulse"></div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1">{user?.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{user?.headline}</p>
            {user?.city && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-3">
                <MapPin className="h-3 w-3" />
                <span>{formatCity(user.city)}</span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-neon-cyan">94%</div>
                <div className="text-xs text-muted-foreground">Profile Score</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-neon-purple">1.2K</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-neon-pink">47</div>
                <div className="text-xs text-muted-foreground">Skill Points</div>
              </div>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          {/* Career Highlights */}
          <div>
            <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-neon-yellow" />
              Career Highlights
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 glass rounded-lg">
                <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-neon-purple" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Senior Product Manager</div>
                  <div className="text-xs text-muted-foreground">TechCorp • 2 years</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-2 glass rounded-lg">
                <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-neon-cyan" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">MBA in Business Strategy</div>
                  <div className="text-xs text-muted-foreground">Stanford University</div>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          {/* Recent Activity */}
          <div>
            <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neon-green" />
              Recent Activity
            </h4>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Completed course:</span>
                <span className="text-foreground font-medium ml-1">AI in Product Management</span>
                <div className="text-xs text-neon-green mt-1">+5 skill points</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Applied to:</span>
                <span className="text-foreground font-medium ml-1">Senior PM role at StartupX</span>
                <div className="text-xs text-neon-cyan mt-1">2 days ago</div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Connected with:</span>
                <span className="text-foreground font-medium ml-1">Sarah Chen, VP Product</span>
                <div className="text-xs text-neon-purple mt-1">1 week ago</div>
              </div>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          {/* Quick Actions */}
          <div>
            <h4 className="font-bold text-foreground mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleNavigation("profile")}
                className="flex flex-col items-center gap-2 h-16 border-glass-border text-foreground hover:text-neon-cyan hover:border-neon-cyan"
              >
                <User className="h-4 w-4" />
                <span className="text-xs">View Profile</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNavigation("jobs")}
                className="flex flex-col items-center gap-2 h-16 border-glass-border text-foreground hover:text-neon-purple hover:border-neon-purple"
              >
                <Briefcase className="h-4 w-4" />
                <span className="text-xs">Find Jobs</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNavigation("connections")}
                className="flex flex-col items-center gap-2 h-16 border-glass-border text-foreground hover:text-neon-pink hover:border-neon-pink"
              >
                <User className="h-4 w-4" />
                <span className="text-xs">Network</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNavigation("courses")}
                className="flex flex-col items-center gap-2 h-16 border-glass-border text-foreground hover:text-neon-green hover:border-neon-green"
              >
                <GraduationCap className="h-4 w-4" />
                <span className="text-xs">Learn</span>
              </Button>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          {/* Settings */}
          <div>
            <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Settings
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Push Notifications</span>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Email Updates</span>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Privacy Mode</span>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <Separator className="bg-glass-border" />

          {/* Social Links */}
          <div>
            <h4 className="font-bold text-foreground mb-3">Connect</h4>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full glass hover:glass-strong flex items-center justify-center hover:scale-110 transition-all duration-300 group">
                <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan" />
              </button>
              <button className="w-10 h-10 rounded-full glass hover:glass-strong flex items-center justify-center hover:scale-110 transition-all duration-300 group">
                <Github className="h-4 w-4 text-muted-foreground group-hover:text-neon-purple" />
              </button>
              <button className="w-10 h-10 rounded-full glass hover:glass-strong flex items-center justify-center hover:scale-110 transition-all duration-300 group">
                <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-neon-pink" />
              </button>
              <button className="w-10 h-10 rounded-full glass hover:glass-strong flex items-center justify-center hover:scale-110 transition-all duration-300 group">
                <Globe className="h-4 w-4 text-muted-foreground group-hover:text-neon-yellow" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 glass-strong border-t border-glass-border p-4 flex gap-3">
          <Button variant="outline" onClick={() => handleNavigation("settings")} className="flex-1 border-glass-border text-muted-foreground hover:text-foreground hover:border-neon-cyan">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-glass-border text-muted-foreground hover:text-destructive hover:border-destructive"
            onClick={() => {
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              window.location.href = "/jobs";
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}
