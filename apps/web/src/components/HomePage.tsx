import { ArrowRight, TrendingUp, Users, BookOpen, Briefcase, Zap, Target, Rocket, Star, Activity, Brain, Network, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useState, useEffect } from 'react';

interface HomePageProps {
  onNavigate: (section: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState({ jobs: 0, progress: 0, connections: 0, courses: 0 });

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
        setAnimatedValues(prev => ({ ...prev, [key]: Math.floor(current) }));
      }, 30);
    };

    animate(12, 'jobs');
    animate(73, 'progress');
    animate(45, 'connections');
    animate(3, 'courses');
  }, []);

  const quickStats = [
    { 
      label: 'Applications', 
      value: animatedValues.jobs, 
      target: '12',
      icon: Briefcase, 
      color: 'from-neon-cyan to-blue-500',
      glow: 'glow-cyan'
    },
    { 
      label: 'Skill Level', 
      value: animatedValues.progress, 
      target: '73%',
      icon: TrendingUp, 
      color: 'from-neon-green to-emerald-500',
      glow: 'glow-green'
    },
    { 
      label: 'Network', 
      value: animatedValues.connections, 
      target: '45',
      icon: Users, 
      color: 'from-neon-purple to-violet-500',
      glow: 'glow-purple'
    },
    { 
      label: 'Learning', 
      value: animatedValues.courses, 
      target: '3',
      icon: BookOpen, 
      color: 'from-neon-pink to-rose-500',
      glow: 'glow-pink'
    }
  ];

  const recentActivity = [
    { type: 'job', title: 'Applied to Product Manager at PayNxt Technologies', time: '2 hours ago' },
    { type: 'skill', title: 'Completed: Digital Marketing Fundamentals Module 3', time: '1 day ago' },
    { type: 'connection', title: 'Connected with Sarah Chen, Senior PM at TechCorp', time: '2 days ago' },
    { type: 'assessment', title: 'Career Assessment completed - 89% match for PM roles', time: '3 days ago' }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Subtle background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-neon-purple/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">

          
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
              Welcome back,
            </span>
            <br />
            <span className="text-white">Alex! 👋</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your AI-powered career journey continues. Let&apos;s make today count and unlock new opportunities! 🚀
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button 
              onClick={() => onNavigate('kelsa-ai')}
              className="group glass-strong hover:glow-cyan transition-all duration-300 px-8 py-3 rounded-2xl border-0 gradient-primary hover:scale-105"
            >
              <Brain className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
              Ask Kelsa AI
              <Sparkles className="h-4 w-4 ml-2 group-hover:rotate-45 transition-transform" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => onNavigate('jobs')}
              className="group glass hover:glass-strong transition-all duration-300 px-8 py-3 rounded-2xl border border-glass-border hover:border-neon-purple hover:scale-105"
            >
              <Rocket className="h-5 w-5 mr-2 group-hover:-rotate-12 transition-transform" />
              Explore Jobs
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={index} 
                className={`group relative glass hover:glass-strong ${stat.glow} p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge className="bg-glass-bg text-neon-cyan border-glass-border">
                    +{Math.floor(Math.random() * 15) + 8}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">
                      {stat.label.includes('Level') ? `${stat.value}%` : stat.value}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat.label.includes('Level') ? 'Complete' : 'Total'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  
                  {stat.label.includes('Level') && (
                    <Progress 
                      value={stat.value} 
                      className="h-2 bg-glass-bg"
                    />
                  )}
                </div>
                
                {/* Professional hover effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-neon-cyan" />
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
              <div className="h-px bg-gradient-to-r from-neon-cyan to-transparent flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Card 
                className="group relative glass hover:glass-strong hover:glow-cyan p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => onNavigate('kelsa-ai')}
              >
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

              <Card 
                className="group relative glass hover:glass-strong hover:glow-purple p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => onNavigate('jobs')}
              >
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

              <Card 
                className="group relative glass hover:glass-strong hover:glow-pink p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => onNavigate('courses')}
              >
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

              <Card 
                className="group relative glass hover:glass-strong hover:glow-green p-6 rounded-2xl border border-glass-border hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => onNavigate('connections')}
              >
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

            {/* Skill Progress */}
            <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="h-5 w-5 text-neon-cyan" />
                <h3 className="font-bold text-white">Skill Progress</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">Product Management</span>
                    <span className="font-medium text-neon-cyan">73%</span>
                  </div>
                  <Progress 
                    value={73} 
                    className="h-2 bg-glass-bg"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">Digital Marketing</span>
                    <span className="font-medium text-neon-purple">45%</span>
                  </div>
                  <Progress 
                    value={45} 
                    className="h-2 bg-glass-bg"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">Data Analysis</span>
                    <span className="font-medium text-neon-green">82%</span>
                  </div>
                  <Progress 
                    value={82} 
                    className="h-2 bg-glass-bg"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Star className="h-5 w-5 text-neon-purple" />
              <h2 className="text-xl font-bold text-white">Recent Activity</h2>
            </div>
            <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border transition-all duration-300">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-3 pb-4 border-b border-glass-border last:border-b-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-neon-cyan animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground mb-1">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4 glass hover:glass-strong border-glass-border hover:border-neon-cyan transition-all duration-300" 
                onClick={() => onNavigate('profile')}
              >
                View All Activity
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}