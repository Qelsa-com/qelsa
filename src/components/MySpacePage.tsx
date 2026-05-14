import { useAuth } from "@/contexts/AuthContext";
import { useGetEducationsQuery } from "@/features/api/educationsApi";
import { useGetExperiencesQuery } from "@/features/api/experiencesApi";
import { useGetUserSkillsQuery } from "@/features/api/userSkillsApi";
import {
  Activity,
  ArrowRight,
  ArrowUp,
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  Eye,
  EyeIcon,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Network,
  Rocket,
  Send,
  Share2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  User2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface MySpacePageProps {}

export function MySpacePage({}: MySpacePageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: educations, error, isLoading } = useGetEducationsQuery();
  const { data: experiences, error: experiencesError, isLoading: experiencesLoading } = useGetExperiencesQuery();
  const { data: userSkills, error: userSkillsError, isLoading: userSkillsLoading } = useGetUserSkillsQuery();

  const current_company = experiences?.find((exp) => exp.is_current == true);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState({
    jobs: 0,
    skillProgress: 0,
    connections: 0,
    courses: 0,
    careerScore: 0,
    profileViews: 0,
  });
  const [viewMode, setViewMode] = useState<"tabs" | "split">("tabs");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Animate counter values on mount
    const animate = (target: number, key: keyof typeof animatedValues) => {
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedValues((prev) => ({ ...prev, [key]: Math.floor(current) }));
      }, 30);
    };

    animate(12, "jobs");
    animate(73, "skillProgress");
    animate(45, "connections");
    animate(3, "courses");
    animate(84, "careerScore");
    animate(127, "profileViews");
  }, []);

  // Enhanced career data
  const applicationStats = {
    total: 12,
    inProgress: 8,
    shortlisted: 3,
    offers: 1,
    trends: {
      total: "+15%",
      inProgress: "+8%",
      shortlisted: "+200%",
      offers: "+100%",
    },
  };

  const skillStats = {
    overallProgress: 73,
    trendingSkills: ["AI/ML", "Product Strategy", "Data Analytics"],
    skillGaps: ["Leadership", "Public Speaking"],
    completedCertifications: 5,
    activeLearning: ["Product Management Mastery", "Digital Marketing Pro", "Data Science Fundamentals"],
  };

  const networkStats = {
    totalConnections: 245,
    newThisWeek: 8,
    profileViews: 127,
    visibility: "High",
    topConnections: ["Product Managers", "Data Scientists", "Marketing Leaders"],
  };

  const learningStats = {
    totalCourses: 15,
    completedCertifications: 5,
    activeModules: 3,
    hoursLearned: 127,
    nextDeadline: "Digital Marketing Assessment - Due in 3 days",
  };

  const careerScore = 84; // Calculated from profile completion, skills, network, activity

  const quickStats = [
    {
      label: "Applications Tracker",
      value: animatedValues.jobs,
      icon: Briefcase,
      color: "from-neon-cyan to-blue-500",
      glow: "glow-cyan",
      details: applicationStats,
      trend: "+15%",
    },
    {
      label: "Skill Progress",
      value: animatedValues.skillProgress,
      icon: TrendingUp,
      color: "from-neon-green to-emerald-500",
      glow: "glow-green",
      details: skillStats,
      trend: "+12%",
    },
    {
      label: "Network Growth",
      value: animatedValues.connections,
      icon: Users,
      color: "from-neon-purple to-violet-500",
      glow: "glow-purple",
      details: networkStats,
      trend: "+25%",
    },
    {
      label: "Learning Activity",
      value: animatedValues.courses,
      icon: BookOpen,
      color: "from-neon-pink to-rose-500",
      glow: "glow-pink",
      details: learningStats,
      trend: "+8%",
    },
  ];

  const recentActivity = [
    {
      type: "job",
      title: "Applied to Product Manager at PayNxt Technologies",
      time: "2 hours ago",
      icon: Send,
      color: "text-neon-cyan",
    },
    {
      type: "skill",
      title: "Completed: Digital Marketing Fundamentals Module 3",
      time: "1 day ago",
      icon: CheckCircle,
      color: "text-neon-green",
    },
    {
      type: "connection",
      title: "Connected with Sarah Chen, Senior PM at TechCorp",
      time: "2 days ago",
      icon: Users,
      color: "text-neon-purple",
    },
    {
      type: "assessment",
      title: "Career Assessment completed - 89% match for PM roles",
      time: "3 days ago",
      icon: Trophy,
      color: "text-neon-yellow",
    },
    {
      type: "profile",
      title: "Profile viewed by 5 recruiters from top companies",
      time: "5 days ago",
      icon: EyeIcon,
      color: "text-neon-pink",
    },
  ];

  function getExperienceLevelFromProficiency(proficiency: number) {
    if (proficiency >= 90) return "Expert";
    if (proficiency >= 70) return "Advanced";
    if (proficiency >= 40) return "Intermediate";
    return "Beginner";
  }

  const dashboardContent = (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <Card className="glass hover:glass-strong p-8 rounded-2xl border border-glass-border transition-all duration-300 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-neon-purple/5 to-neon-pink/5"></div>
        <div className="relative z-10 text-center space-y-6">
          <div>
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Welcome back,</span>
              <br />
              <span className="text-white">{user?.name}! 👋</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">Your AI-powered career journey continues. Let&apos;s make today count and unlock new opportunities! 🚀</p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button className="group glass-strong hover:glow-cyan transition-all duration-300 px-8 py-3 rounded-2xl border-0 bg-gradient-to-r from-neon-cyan to-neon-purple hover:scale-105">
              <Brain className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Ask Qelsa AI
              <Sparkles className="h-4 w-4 ml-2 group-hover:rotate-45 transition-transform" />
            </Button>

            <Button
              variant="outline"
              className="group glass hover:glass-strong transition-all duration-300 px-8 py-3 rounded-2xl border border-glass-border hover:border-neon-purple hover:scale-105"
              onClick={() => router.push("/jobs/all")}
            >
              <Rocket className="h-5 w-5 mr-2 group-hover:-rotate-12 transition-transform" />
              Explore Jobs
            </Button>
          </div>
        </div>
      </Card>

      {/* Career Score */}
      <Card className="glass hover:glass-strong p-8 rounded-2xl border border-glass-border transition-all duration-300 glow-cyan">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-neon-yellow" />
          <h2 className="text-2xl font-bold text-white">Career Fitness Score</h2>
          <Badge className="bg-gradient-to-r from-neon-yellow to-neon-pink text-black px-3 py-1">Excellent</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">{animatedValues.careerScore}</div>
              <div>
                <p className="text-2xl font-bold text-white">/ 100</p>
                <p className="text-sm text-neon-green flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" />
                  +5 this week
                </p>
              </div>
            </div>
            <Progress value={animatedValues.careerScore} className="h-4 bg-glass-bg mb-4" />
            <p className="text-muted-foreground">
              Your career health is excellent! You&apos;re in the top 15% of professionals in your field. Focus on expanding your network to reach the next level.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Profile Completion</span>
              <span className="text-sm font-medium text-neon-green">95%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Skill Development</span>
              <span className="text-sm font-medium text-neon-cyan">88%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Network Activity</span>
              <span className="text-sm font-medium text-neon-purple">75%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Application Rate</span>
              <span className="text-sm font-medium text-neon-pink">82%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`group relative glass hover:glass-strong ${stat.glow} p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-glass-bg text-neon-green border-glass-border">{stat.trend}</Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white">{stat.label.includes("Progress") ? `${stat.value}%` : stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label.includes("Progress") ? "Complete" : "Total"}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>

                {stat.label.includes("Progress") && <Progress value={stat.value} className="h-2 bg-glass-bg" />}

                {/* Additional details for each stat */}
                {stat.label === "Applications Tracker" && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>In Progress</span>
                      <span className="text-neon-cyan">{applicationStats.inProgress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shortlisted</span>
                      <span className="text-neon-green">{applicationStats.shortlisted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Offers</span>
                      <span className="text-neon-yellow">{applicationStats.offers}</span>
                    </div>
                  </div>
                )}

                {stat.label === "Network Growth" && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>New this week</span>
                      <span className="text-neon-purple">{networkStats.newThisWeek}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profile views</span>
                      <span className="text-neon-pink">{animatedValues.profileViews}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Quick Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-neon-cyan" />
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            <div className="h-px bg-gradient-to-r from-neon-cyan to-transparent flex-1"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="group relative glass hover:glass-strong hover:glow-cyan p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <Brain className="h-7 w-7 text-black" />
                  </div>
                  <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-purple opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1 group-hover:text-neon-cyan transition-colors">Ask Kelsa AI</h3>
                  <p className="text-sm text-muted-foreground">Get instant career insights</p>
                </div>
                <ArrowRight className="h-5 w-5 text-neon-cyan group-hover:translate-x-2 transition-transform" />
              </div>
            </Card>

            <Card className="group relative glass hover:glass-strong hover:glow-purple p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-pink flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <Briefcase className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-purple to-neon-pink opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1 group-hover:text-neon-purple transition-colors">Smart Jobs</h3>
                  <p className="text-sm text-muted-foreground">AI-matched opportunities</p>
                </div>
                <ArrowRight className="h-5 w-5 text-neon-purple group-hover:translate-x-2 transition-transform" />
              </div>
            </Card>

            <Card className="group relative glass hover:glass-strong hover:glow-pink p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-pink to-neon-yellow flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <BookOpen className="h-7 w-7 text-black" />
                  </div>
                  <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-pink to-neon-yellow opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1 group-hover:text-neon-pink transition-colors">Skill Development</h3>
                  <p className="text-sm text-muted-foreground">Future-ready learning</p>
                </div>
                <ArrowRight className="h-5 w-5 text-neon-pink group-hover:translate-x-2 transition-transform" />
              </div>
            </Card>

            <Card className="group relative glass hover:glass-strong hover:glow-green p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-green to-neon-cyan flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                    <Network className="h-7 w-7 text-black" />
                  </div>
                  <div className="absolute inset-0 w-14 h-14 rounded-2xl bg-gradient-to-r from-neon-green to-neon-cyan opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1 group-hover:text-neon-green transition-colors">Professional Network</h3>
                  <p className="text-sm text-muted-foreground">Connect with professionals</p>
                </div>
                <ArrowRight className="h-5 w-5 text-neon-green group-hover:translate-x-2 transition-transform" />
              </div>
            </Card>
          </div>

          {/* Enhanced Skill Progress */}

          <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-5 w-5 text-neon-cyan" />
              <h3 className="font-bold text-white">Skill Progress</h3>
            </div>

            {userSkills?.length > 0 && (
              <div className="space-y-6">
                {userSkills.map((userSkill) => (
                  <div key={userSkill.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-foreground">{userSkill.skill?.name}</span>
                      <span className="font-medium text-neon-cyan">{userSkill.proficiency}%</span>
                    </div>
                    <Progress value={userSkill.proficiency} className="h-2 bg-glass-bg" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Enhanced Recent Activity */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Star className="h-5 w-5 text-neon-purple" />
            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          </div>

          <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const ActivityIcon = activity.icon;
                return (
                  <div key={index} className="flex gap-3 pb-4 border-b border-glass-border last:border-b-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button variant="outline" className="w-full mt-4 glass hover:glass-strong border-glass-border hover:border-neon-cyan transition-all duration-300">
              View All Activity
            </Button>
          </Card>

          {/* Weekly Goals */}
          <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300 mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-neon-yellow" />
              <h3 className="font-bold text-white">Weekly Goals</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-neon-green" />
                <span className="text-sm text-muted-foreground line-through">Apply to 5 jobs</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-neon-cyan" />
                <span className="text-sm text-foreground">Complete marketing course</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-neon-cyan" />
                <span className="text-sm text-foreground">Connect with 3 professionals</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const profileContent = (
    <div className="space-y-8">
      {/* Profile Header */}
      <Card className="glass hover:glass-strong p-8 rounded-2xl border border-glass-border transition-all duration-300">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex flex-col items-center lg:items-start">
            <Avatar className="w-32 h-32 ring-4 ring-neon-cyan/20 ring-offset-4 ring-offset-background">
              <AvatarImage src={user?.custom_profile_url} alt={user?.name} />
              <AvatarFallback className="text-2xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black">{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <Button onClick={() => router.push("/profile/edit")} className="mt-4 glass hover:glass-strong border border-glass-border hover:border-neon-cyan transition-all duration-300">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{user?.name}</h1>
              <p className="text-xl text-neon-cyan mb-4">{user?.headline}</p>
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                {current_company && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{current_company?.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>5+ years experience</span>
                </div>
                {current_company && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{current_company?.company_name || "N/A"}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Professional Summary</h3>
              <p className="text-muted-foreground leading-relaxed">{user?.about}</p>
            </div>

            <div className="flex gap-3">
              <Button className="bg-gradient-to-r from-neon-cyan to-neon-purple text-black hover:scale-105 transition-all duration-300">
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
              <Button variant="outline" className="glass hover:glass-strong border-glass-border hover:border-neon-purple">
                <Share2 className="h-4 w-4 mr-2" />
                Share Profile
              </Button>
              <Button variant="outline" className="glass hover:glass-strong border-glass-border hover:border-neon-pink">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Work Experience */}
        <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-neon-cyan" />
              <h3 className="text-xl font-bold text-white">Work Experience</h3>
            </div>
            <Button variant="ghost" size="sm" className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan hover:text-neon-cyan" onClick={() => router.push("/profile/work-experience")}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="space-y-6">
            {experiences?.map((exp, index) => (
              <div key={index} className="relative">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center text-black font-bold">{index + 1}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{exp.job_title?.name}</h4>
                    <p className="text-neon-cyan">{exp.company?.name}</p>
                    <p className="text-sm text-muted-foreground mb-3">{exp.location}</p>
                    <ul className="space-y-1">
                      {exp.responsibilities?.map((resp, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ChevronRight className="h-3 w-3 mt-1 text-neon-cyan flex-shrink-0" />
                          {resp.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {index < experiences.length - 1 && <div className="absolute left-6 top-12 w-px h-6 bg-glass-border"></div>}
              </div>
            ))}
          </div>
        </Card>

        {/* Education & Skills */}
        <div className="space-y-8">
          {/* Education */}
          <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-neon-purple" />
                <h3 className="text-xl font-bold text-white">Education</h3>
              </div>
              <Button variant="ghost" size="sm" className="glass hover:glass-strong border-neon-purple/30 text-neon-purple hover:text-neon-purple" onClick={() => router.push("/profile/educations")}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="space-y-4">
              {educations?.map((edu, index) => (
                <div key={index} className="p-4 glass rounded-xl">
                  <h4 className="font-semibold text-white">{edu.degree?.name}</h4>
                  <p className="text-neon-purple">{edu.institution}</p>
                  <p className="text-sm text-muted-foreground">
                    {edu.end_year} • {edu.field_of_study?.name}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Skills */}
          {/* <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-neon-pink" />
                <h3 className="text-xl font-bold text-white">Skills & Expertise</h3>
              </div>
              <Button variant="ghost" size="sm" className="glass hover:glass-strong border-neon-pink/30 text-neon-pink hover:text-neon-pink" onClick={() => router.push("/profile/skills")}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="space-y-3">
                  {userSkills?.map((skill, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{skill.title}</span>
                        <span className="font-medium text-neon-cyan">{skill.proficiency}%</span>
                      </div>
                      <Progress value={Number(skill.proficiency)} className="h-2 bg-glass-bg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card> */}

          <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-neon-pink" />
                <h3 className="text-xl font-bold text-white">Skills & Expertise</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan hover:text-neon-cyan" onClick={() => router.push("/profile/skills")}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
                <Button variant="ghost" size="sm" className="glass hover:glass-strong border-neon-pink/30 text-neon-pink hover:text-neon-pink" onClick={() => router.push("/profile/skills")}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Top Skills Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-neon-yellow fill-neon-yellow" />
                  <h4 className="font-medium text-white">Top Skills</h4>
                </div>
                {userSkills?.some((s) => s.is_top_skill) ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {userSkills
                      .filter((skill) => skill.is_top_skill)
                      .map((skill) => (
                        <div key={skill.id} className="p-4 glass-strong rounded-xl border border-neon-yellow/20">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-white">{skill.skill?.name}</span>
                            <Star className="h-4 w-4 text-neon-yellow fill-neon-yellow flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                getExperienceLevelFromProficiency(skill.proficiency) === "Expert"
                                  ? "bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow"
                                  : getExperienceLevelFromProficiency(skill.proficiency) === "Advanced"
                                    ? "bg-neon-green/10 border-neon-green/30 text-neon-green"
                                    : getExperienceLevelFromProficiency(skill.proficiency) === "Intermediate"
                                      ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan"
                                      : "bg-neon-pink/10 border-neon-pink/30 text-neon-pink"
                              }`}
                            >
                              {getExperienceLevelFromProficiency(skill.proficiency)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-6 glass-strong rounded-xl border border-glass-border text-center">
                    <Star className="h-8 w-8 text-neon-yellow/30 fill-neon-yellow/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No top skills selected yet. Showcase up to 3 of your strongest skills.</p>
                  </div>
                )}
                <Separator className="mt-6 bg-glass-border" />
              </div>

              {/* All Skills by Category - Limited to 3 per category, excluding top skills */}
              <div className="space-y-4">
                {Array.from(
                  (userSkills ?? [])
                    .filter((s) => !s.is_top_skill && s.category)
                    .reduce((map, skill) => {
                      const key = skill.category.id;
                      if (!map.has(key)) map.set(key, { name: skill.category.name, skills: [] });
                      map.get(key)!.skills.push(skill);
                      return map;
                    }, new Map<number, { name: string; skills: typeof userSkills }>())
                    .entries()
                ).map(([catId, { name: categoryName, skills: categorySkills }], idx, arr) => {
                  const limited = categorySkills!.slice(0, 3);
                  if (limited.length === 0) return null;
                  return (
                    <div key={catId}>
                      <h4 className="font-medium text-white mb-3">{categoryName}</h4>
                      <div className="space-y-3">
                        {limited.map((skill) => (
                          <div key={skill.id}>
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-foreground">{skill.skill?.name}</span>
                              </div>
                              <span
                                className={`font-medium ${
                                  skill.experience_level === "Expert"
                                    ? "text-neon-yellow"
                                    : skill.experience_level === "Advanced"
                                      ? "text-neon-green"
                                      : skill.experience_level === "Intermediate"
                                        ? "text-neon-cyan"
                                        : "text-neon-pink"
                                }`}
                              >
                                {skill.experience_level}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {idx < arr.length - 1 && <Separator className="mt-4 bg-glass-border" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  if (viewMode === "split") {
    return (
      <div className="min-h-screen relative">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-purple/3 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">My Space</span>
              </h1>
              <p className="text-muted-foreground">Your AI-powered career fitness tracker + digital resume</p>
            </div>
            <Button onClick={() => setViewMode("tabs")} variant="outline" className="glass hover:glass-strong border-glass-border hover:border-neon-cyan">
              Switch to Tabs View
            </Button>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Dashboard Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <LayoutDashboard className="h-6 w-6 text-neon-cyan" />
                <h2 className="text-2xl font-bold text-white">Career Dashboard</h2>
              </div>
              {dashboardContent}
            </div>

            {/* Profile Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <User2 className="h-6 w-6 text-neon-purple" />
                <h2 className="text-2xl font-bold text-white">Professional Profile</h2>
              </div>
              {profileContent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-purple/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">My Space</span>
            </h1>
            <p className="text-muted-foreground">Your AI-powered career fitness tracker + digital resume</p>
          </div>
        </div>

        {/* Tabs Layout */}
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="glass border border-glass-border p-1 rounded-2xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-neon-cyan data-[state=active]:text-black transition-all duration-300">
              <LayoutDashboard className="h-4 w-4" />
              Career Dashboard
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-neon-purple data-[state=active]:text-white transition-all duration-300">
              <User2 className="h-4 w-4" />
              Professional Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            {dashboardContent}
          </TabsContent>

          <TabsContent value="profile" className="space-y-8">
            {profileContent}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
