import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfileMutation } from "@/features/api/authApi";
import { User } from "@/types/user";
import { ArrowRight, BookOpen, Building, CheckCircle, GraduationCap, MessageSquare, RefreshCw, Sparkles, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

interface GoalOption {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
}

const goalOptions: GoalOption[] = [
  {
    id: "find_job",
    label: "Find Jobs",
    description: "Discover opportunities that match your skills",
    icon: Target,
    color: "neon-cyan",
  },
  {
    id: "explore_career",
    label: "Explore Career Paths",
    description: "Plan your career journey with AI guidance",
    icon: Users,
    color: "neon-purple",
  },
  {
    id: "upskill_and_learn",
    label: "Upskill & Learn",
    description: "Develop new skills for career growth",
    icon: BookOpen,
    color: "neon-green",
  },
  {
    id: "prepare_interview",
    label: "Prepare for Interviews",
    description: "Practice and ace your next interview",
    icon: MessageSquare,
    color: "neon-pink",
  },
];

const profileTypeOptions = [
  {
    value: "student",
    label: "Student",
    icon: GraduationCap,
    description: "Currently studying or recent graduate",
  },
  {
    value: "professional",
    label: "Professional",
    icon: Building,
    description: "Experienced working professional",
  },
  {
    value: "career-switcher",
    label: "Career Switcher",
    icon: RefreshCw,
    description: "Looking to change career paths",
  },
];

export function OnboardingFlow() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<User>({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    role: user?.role || "user",
    profile_type: user?.profile_type || "student",
    find_job: user?.find_job || false,
    explore_career: user?.explore_career || false,
    upskill_and_learn: user?.upskill_and_learn || false,
    prepare_interview: user?.prepare_interview || false,
  });

  // Update userData when user changes
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        role: user.role || "user",
        profile_type: user.profile_type || "student",
        find_job: user.find_job || false,
        explore_career: user.explore_career || false,
        upskill_and_learn: user.upskill_and_learn || false,
        prepare_interview: user.prepare_interview || false,
      });
    }
  }, [user]);
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [updateProfile] = useUpdateProfileMutation();

  const generateUsername = (name: string) => {
    if (!name.trim()) return "";
    const cleaned = name
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim();
    const parts = cleaned.split(" ").filter(Boolean);
    if (parts.length === 0) return "";

    if (parts.length === 1) {
      return parts[0];
    } else {
      return parts[0] + parts[parts.length - 1];
    }
  };

  const handleNameChange = (name: string) => {
    setUserData((prev) => ({ ...prev, name: name }));
    const suggested = generateUsername(name);
    setSuggestedUsername(suggested);
    if (!userData.username || userData.username === suggestedUsername) {
      setUserData((prev) => ({ ...prev, username: suggested }));
    }
  };

  const handleGoalToggle = (goalId: string) => {
    setUserData((prev) => ({
      ...prev,
      [goalId]: !prev[goalId as keyof User],
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        if (currentStep !== 0) updateProfile(userData).unwrap();
      } catch (error) {
        console.log("Failed to update profile", error);
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return userData.name.trim() && userData.username.trim();
      case 2:
        return userData.find_job || userData.explore_career || userData.upskill_and_learn || userData.prepare_interview;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
            {/* Logo and Branding */}
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl gradient-animated flex items-center justify-center shadow-2xl animate-in zoom-in-50 duration-1000 delay-300">
                    <span className="text-black font-bold text-4xl">Q</span>
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-3xl bg-gradient-to-r from-neon-cyan to-neon-purple opacity-50 blur-xl animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent animate-in slide-in-from-top-4 duration-700 delay-500">
                  Welcome to Qelsa AI
                </h1>
                <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-700">
                  Your AI-powered career co-pilot. Explore jobs, grow your skills, and plan your career.
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-700 delay-1000">
              <div className="glass rounded-2xl p-6 hover:glow-cyan transition-all duration-300 group">
                <Target className="h-8 w-8 text-neon-cyan mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-2">Smart Job Matching</h3>
                <p className="text-sm text-muted-foreground">AI-powered recommendations tailored to your skills</p>
              </div>
              <div className="glass rounded-2xl p-6 hover:glow-purple transition-all duration-300 group">
                <Sparkles className="h-8 w-8 text-neon-purple mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-2">Career Guidance</h3>
                <p className="text-sm text-muted-foreground">Personalized career path recommendations</p>
              </div>
              <div className="glass rounded-2xl p-6 hover:glow-green transition-all duration-300 group">
                <BookOpen className="h-8 w-8 text-neon-green mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-2">Skill Development</h3>
                <p className="text-sm text-muted-foreground">Learn and grow with curated resources</p>
              </div>
            </div>

            <Button
              onClick={handleNext}
              size="lg"
              className="gradient-animated text-black font-bold text-lg px-8 py-4 shadow-2xl glow-cyan hover:glow-purple transition-all duration-300 hover:scale-105 animate-in zoom-in-50 duration-700 delay-1200"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-4 duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold text-white">Tell us about yourself</h2>
              <p className="text-lg text-muted-foreground">Let&apos;s personalize your Qelsa experience</p>
            </div>

            <div className="max-w-md mx-auto space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Full Name</label>
                <Input
                  value={userData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 glass border-glass-border bg-input-background text-white placeholder:text-muted-foreground focus:border-neon-cyan focus:glow-cyan transition-all"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neon-cyan font-medium">@</span>
                  <Input
                    value={userData.username}
                    onChange={(e) => setUserData((prev) => ({ ...prev, username: e.target.value }))}
                    placeholder="username"
                    className="h-12 pl-8 glass border-glass-border bg-input-background text-white placeholder:text-muted-foreground focus:border-neon-cyan focus:glow-cyan transition-all"
                  />
                </div>
                {suggestedUsername && userData.username !== suggestedUsername && (
                  <Button variant="ghost" size="sm" onClick={() => setUserData((prev) => ({ ...prev, username: suggestedUsername }))} className="text-neon-cyan hover:text-neon-cyan text-xs">
                    Use suggested: @{suggestedUsername}
                  </Button>
                )}
              </div>

              {/* Profile Type */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-white">Profile Type</label>
                <div className="grid grid-cols-1 gap-3">
                  {profileTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = userData.profile_type === option.value;

                    return (
                      <button
                        key={option.value}
                        onClick={() => setUserData((prev) => ({ ...prev, profile_type: option.value as any }))}
                        className={`flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-300 ${
                          isSelected ? "glass-strong border-neon-cyan glow-cyan" : "glass border-glass-border hover:border-neon-cyan/50 hover:glow-cyan"
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? "text-neon-cyan" : "text-muted-foreground"}`} />
                        <div className="flex-1">
                          <h4 className={`font-medium ${isSelected ? "text-neon-cyan" : "text-white"}`}>{option.label}</h4>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        {isSelected && <CheckCircle className="h-5 w-5 text-neon-cyan" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                size="lg"
                className="gradient-animated text-black font-bold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-4 duration-500">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-bold text-white">What brings you to Qelsa?</h2>
              <p className="text-lg text-muted-foreground">Select your goals (you can choose multiple)</p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goalOptions.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = userData[goal.id];

                  return (
                    <Card
                      key={goal.id}
                      className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                        isSelected ? `glass-strong border-${goal.color} glow-${goal.color.split("-")[1]}` : "glass border-glass-border hover:border-neon-cyan/50 hover:glow-cyan"
                      }`}
                      onClick={() => handleGoalToggle(goal.id)}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Icon className={`h-8 w-8 ${isSelected ? `text-${goal.color}` : "text-muted-foreground"}`} />
                          {isSelected && <CheckCircle className={`h-6 w-6 text-${goal.color}`} />}
                        </div>
                        <div>
                          <h3 className={`font-bold text-lg mb-2 ${isSelected ? `text-${goal.color}` : "text-white"}`}>{goal.label}</h3>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {(userData.find_job || userData.explore_career || userData.upskill_and_learn || userData.prepare_interview) && (
                <div className="mt-6 p-4 glass rounded-xl border border-neon-cyan/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-neon-cyan" />
                    <span className="text-sm font-medium text-neon-cyan">Selected Goals</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {goalOptions
                      .filter((goal) => userData[goal.id as keyof User])
                      .map((goal) => (
                        <span key={goal.id} className="px-3 py-1 text-xs glass rounded-full text-neon-cyan">
                          {goal.label}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                size="lg"
                className="gradient-animated text-black font-bold px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
              >
                Next
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-8 animate-in fade-in-0 slide-in-from-right-4 duration-500">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full gradient-animated flex items-center justify-center shadow-2xl animate-in zoom-in-50 duration-700">
                    <CheckCircle className="h-10 w-10 text-black" />
                  </div>
                  <div className="absolute inset-0 w-20 h-20 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple opacity-50 blur-xl animate-pulse"></div>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-white">
                  All set, <span className="text-neon-cyan">@{userData.username}</span>!
                </h2>
                <p className="text-xl text-muted-foreground max-w-md mx-auto">Let&apos;s get started on your career journey.</p>
              </div>
            </div>

            {/* Summary */}
            <div className="max-w-md mx-auto space-y-4">
              <div className="glass rounded-xl p-6 text-left">
                <h3 className="font-semibold text-white mb-4">Your Profile Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="text-white">{userData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-neon-cyan">{profileTypeOptions.find((p) => p.value === userData.profile_type)?.label}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Goals:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {goalOptions
                        .filter((goal) => userData[goal.id as keyof User])
                        .map((goal) => (
                          <span key={goal.id} className="px-2 py-1 text-xs glass rounded text-neon-green">
                            {goal.label}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleNext}
              size="lg"
              className="gradient-animated text-black font-bold text-lg px-8 py-4 shadow-2xl glow-cyan hover:glow-purple transition-all duration-300 hover:scale-105"
            >
              Go to AI Chat
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background"></div>
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-neon-cyan/4 rounded-full blur-3xl opacity-80 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-neon-purple/4 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-pink/3 rounded-full blur-3xl opacity-60"></div>
      </div>

      {/* Progress Indicator */}
      {currentStep > 0 && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 glass rounded-full px-6 py-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className={`w-3 h-3 rounded-full transition-all duration-300 ${step <= currentStep ? "bg-neon-cyan glow-cyan" : "bg-glass-border"}`} />
            ))}
            <span className="ml-3 text-sm text-muted-foreground">Step {currentStep} of 3</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-4xl">{renderStep()}</div>
      </div>
    </div>
  );
}
