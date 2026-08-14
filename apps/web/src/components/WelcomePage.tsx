import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Zap, 
  Briefcase, 
  Users, 
  BookOpen, 
  Home,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';

interface WelcomePageProps {
  onNavigate: (section: string) => void;
}

export function WelcomePage({ onNavigate }: WelcomePageProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const features = [
    {
      icon: Zap,
      title: "Kelsa AI",
      description: "Get personalized career guidance and job recommendations powered by advanced AI",
      color: "neon-cyan",
      section: "kelsa-ai"
    },
    {
      icon: Briefcase,
      title: "Smart Job Matching",
      description: "Discover opportunities from Kelsa and top platforms like LinkedIn, Indeed, and Naukri",
      color: "neon-purple",
      section: "jobs"
    },
    {
      icon: Users,
      title: "Professional Network",
      description: "Connect with industry professionals and build meaningful career relationships",
      color: "neon-pink",
      section: "connections"
    },
    {
      icon: BookOpen,
      title: "Skill Development",
      description: "Access personalized learning paths and industry-relevant courses",
      color: "neon-green",
      section: "courses"
    }
  ];

  const steps = [
    {
      title: "Welcome to Kelsa",
      subtitle: "The Future of Professional Growth",
      description: "Join thousands of professionals who are accelerating their careers with AI-powered insights and connections."
    },
    {
      title: "Discover Your Path",
      subtitle: "AI-Powered Career Guidance",
      description: "Our intelligent platform analyzes your skills, experience, and goals to provide personalized recommendations."
    },
    {
      title: "Connect & Grow",
      subtitle: "Professional Community",
      description: "Share insights, discover opportunities, and build your professional brand in our vibrant community."
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-pink/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-animated flex items-center justify-center shadow-2xl">
                <Zap className="h-8 w-8 text-black" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-purple opacity-50 blur-lg"></div>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
              Welcome to Kelsa
            </span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            The future of professional growth is here. Accelerate your career with AI-powered insights, 
            smart job matching, and a thriving professional community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => onNavigate('home')}
              className="relative px-8 py-6 text-lg gradient-animated text-black hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              <Home className="h-5 w-5 mr-2" />
              Explore Feed
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            
            <Button 
              onClick={() => onNavigate('kelsa-ai')}
              variant="outline"
              className="px-8 py-6 text-lg glass border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 hover:glow-cyan transition-all duration-300"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Try Kelsa AI
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="glass hover:glass-strong hover:scale-105 transition-all duration-300 cursor-pointer group"
                onClick={() => onNavigate(feature.section)}
              >
                <div className="p-6">
                  <div className="relative mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-${feature.color}/20 flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                      <Icon className={`h-6 w-6 text-${feature.color}`} />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-2 text-white group-hover:text-neon-cyan transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan group-hover:translate-x-1 transition-all duration-300 mt-3" />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-neon-cyan mb-2">50K+</div>
            <p className="text-muted-foreground">Active Professionals</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-neon-purple mb-2">10K+</div>
            <p className="text-muted-foreground">Job Opportunities</p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl lg:text-4xl font-bold text-neon-pink mb-2">95%</div>
            <p className="text-muted-foreground">Career Success Rate</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="glass max-w-2xl mx-auto">
            <div className="p-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Target className="h-6 w-6 text-neon-cyan" />
                <TrendingUp className="h-6 w-6 text-neon-purple" />
                <Sparkles className="h-6 w-6 text-neon-pink" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Career?</h2>
              
              <p className="text-muted-foreground mb-6">
                Join Kelsa today and discover how AI can accelerate your professional growth. 
                Get personalized insights, connect with industry leaders, and unlock opportunities you never knew existed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => onNavigate('kelsa-ai')}
                  className="gradient-animated text-black hover:scale-105 transition-all duration-300"
                >
                  Start with AI Guidance
                </Button>
                
                <Button 
                  onClick={() => onNavigate('home')}
                  variant="outline"
                  className="glass border-glass-border hover:border-neon-cyan hover:text-neon-cyan transition-all duration-300"
                >
                  Browse Community
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}