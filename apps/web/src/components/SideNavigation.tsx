import { GraduationCap, Briefcase, Search, Lightbulb, Grid3x3, X, Calendar, FileText, Mic, DollarSign, MapIcon, Users2, ChevronDown, ChevronUp, Target, TrendingUp, Building2, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useState } from 'react';

interface SideNavigationProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onClose: () => void;
  onPluginSelect?: (pluginId: string, pluginName: string) => void;
}

interface CareerPlugin {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  emoji: string;
  description: string;
  gradient: string;
  hoverGlow: string;
  initialPrompt: string;
}

const careerPlugins: CareerPlugin[] = [
  {
    id: 'weekly-planner',
    name: 'Goal Planner',
    icon: Calendar,
    emoji: '🗓️',
    description: 'Create weekly career goals and track your progress with AI-guided planning',
    gradient: 'from-neon-cyan to-blue-400',
    hoverGlow: 'hover:glow-cyan',
    initialPrompt: "Hi! I'm your Weekly Goal Planner. Let's create actionable career goals for this week. What would you like to focus on? (job applications, skill development, networking, or something else?)"
  },
  {
    id: 'resume-optimizer',
    name: 'Resume Optimizer',
    icon: FileText,
    emoji: '📄',
    description: 'Get AI-powered feedback to optimize your resume for specific roles and industries',
    gradient: 'from-neon-green to-emerald-400',
    hoverGlow: 'hover:glow-green',
    initialPrompt: "Welcome to Resume Optimizer! I'll help you create a standout resume. Please share your current resume or tell me about your background, and I'll provide tailored recommendations."
  },
  {
    id: 'interview-coach',
    name: 'Interview Coach',
    icon: Mic,
    emoji: '🎤',
    description: 'Practice interviews with AI coaching for different roles and receive personalized feedback',
    gradient: 'from-neon-purple to-violet-400',
    hoverGlow: 'hover:glow-purple',
    initialPrompt: "Hello! I'm your Interview Coach. Let's prepare you for success! What type of interview would you like to practice? (behavioral, technical, case study, or general questions?)"
  },
  {
    id: 'salary-insights',
    name: 'Salary Insights',
    icon: DollarSign,
    emoji: '💰',
    description: 'Get market salary data, negotiation tips, and compensation benchmarks for your role',
    gradient: 'from-neon-yellow to-amber-400',
    hoverGlow: 'hover:glow-yellow',
    initialPrompt: "Hi! I'm your Salary Insights advisor. I can help with market rates, negotiation strategies, and compensation analysis. What's your role, experience level, and location?"
  },
  {
    id: 'skill-roadmap',
    name: 'Skill Roadmap',
    icon: MapIcon,
    emoji: '🛠️',
    description: 'Create personalized learning paths and skill development plans for your career goals',
    gradient: 'from-neon-pink to-rose-400',
    hoverGlow: 'hover:glow-pink',
    initialPrompt: "Welcome to Skill Roadmap! I'll create a personalized learning path for you. What's your current role and where do you want to grow? (new skills, career transition, or advancement?)"
  },
  {
    id: 'networking-assistant',
    name: 'Network Assistant',
    icon: Users2,
    emoji: '🤝',
    description: 'Find networking opportunities, craft connection messages, and build professional relationships',
    gradient: 'from-neon-purple to-neon-pink',
    hoverGlow: 'hover:glow-purple',
    initialPrompt: "Hello! I'm your Networking Assistant. I'll help you build meaningful professional connections. Are you looking to expand your network, reach out to someone specific, or attend networking events?"
  },
  {
    id: 'career-tracker',
    name: 'Career Tracker',
    icon: TrendingUp,
    emoji: '📈',
    description: 'Track your career progress, analyze growth patterns, and identify advancement opportunities',
    gradient: 'from-neon-cyan to-neon-green',
    hoverGlow: 'hover:glow-cyan',
    initialPrompt: "Hi! I'm your Career Tracker. Let's analyze your career progress and plan your next moves. Tell me about your current role and career goals."
  },
  {
    id: 'company-insights',
    name: 'Company Research',
    icon: Building2,
    emoji: '🏢',
    description: 'Get detailed company insights, culture analysis, and interview preparation for specific employers',
    gradient: 'from-neon-green to-neon-cyan',
    hoverGlow: 'hover:glow-green',
    initialPrompt: "Welcome to Company Research! I'll help you understand companies inside and out. Which company would you like to research? I can provide culture insights, interview tips, and growth opportunities."
  }
];

const filters = [
  { id: 'all', label: 'All Results', icon: Grid3x3, count: 8 },
  { id: 'student', label: 'Student', icon: GraduationCap, count: 3 },
  { id: 'professional', label: 'Professional', icon: Briefcase, count: 2 },
  { id: 'job', label: 'Job Search', icon: Search, count: 2 },
  { id: 'skill', label: 'Skill Guidance', icon: Lightbulb, count: 1 }
];

export function SideNavigation({ activeFilter, onFilterChange, onClose, onPluginSelect }: SideNavigationProps) {
  const [showAllPlugins, setShowAllPlugins] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null);

  const visiblePlugins = showAllPlugins ? careerPlugins : careerPlugins.slice(0, 4);

  const handlePluginClick = (plugin: CareerPlugin) => {
    setSelectedPlugin(plugin.id);
    if (onPluginSelect) {
      onPluginSelect(plugin.id, plugin.name);
    }
    // Add some visual feedback
    setTimeout(() => setSelectedPlugin(null), 2000);
  };

  return (
    <TooltipProvider>
      <div className="w-64 sm:w-72 md:w-80 lg:w-64 h-full glass-strong border-r border-glass-border flex flex-col backdrop-blur-xl">
        {/* Header */}
        <div className="p-4 border-b border-glass-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl gradient-animated flex items-center justify-center glow-cyan">
              <span className="text-black font-bold text-sm">Q</span>
            </div>
            <span className="font-bold text-foreground bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              Career Co-Pilot
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="lg:hidden h-8 w-8 text-foreground hover:text-neon-cyan hover:bg-glass-bg transition-all duration-300"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* New Chat Button */}
          <button className="w-full flex items-center gap-3 px-4 py-3 mb-4 glass hover:glass-strong border-glass-border text-foreground hover:text-neon-cyan rounded-xl transition-all duration-300 group glow-cyan hover:glow-purple">
            <div className="w-6 h-6 rounded-lg glass border-glass-border flex items-center justify-center group-hover:border-neon-cyan group-hover:bg-neon-cyan/10 transition-all duration-300">
              <span className="text-sm font-bold">+</span>
            </div>
            <span className="font-bold">New Chat</span>
          </button>

          {/* Career Co-Pilot Plugins */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-2">
              <Target className="h-4 w-4 text-neon-cyan" />
              <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-wider">AI Co-Pilot Tools</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {visiblePlugins.map((plugin) => {
                const IconComponent = plugin.icon;
                return (
                  <Tooltip key={plugin.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handlePluginClick(plugin)}
                        className={`group relative p-3 glass hover:glass-strong rounded-xl transition-all duration-300 ${plugin.hoverGlow} hover:scale-105 ${
                          selectedPlugin === plugin.id ? 'ring-2 ring-neon-cyan glow-cyan' : ''
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${plugin.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <span className="text-lg">{plugin.emoji}</span>
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-medium text-white group-hover:text-neon-cyan transition-colors leading-tight">
                              {plugin.name}
                            </p>
                          </div>
                        </div>
                        
                        {/* Glow effect overlay */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="glass-strong border border-glass-border p-3 max-w-xs">
                      <p className="text-sm text-white font-medium mb-1">{plugin.name}</p>
                      <p className="text-xs text-muted-foreground">{plugin.description}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Show More/Less Toggle */}
            <button
              onClick={() => setShowAllPlugins(!showAllPlugins)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-neon-purple hover:text-neon-cyan transition-colors font-medium glass hover:glass-strong rounded-lg"
            >
              {showAllPlugins ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show More ({careerPlugins.length - 4} more)
                </>
              )}
            </button>
          </div>

          {/* Search History */}
          <div className="space-y-6 flex-1 pb-4">
            {/* Today */}
            <div>
              <h3 className="text-xs font-bold text-neon-cyan mb-3 px-2 uppercase tracking-wider">Today</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Product Manager career transition</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Tech skills for marketing roles</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Remote data analyst jobs</span>
                </button>
              </div>
            </div>

            {/* Yesterday */}
            <div>
              <h3 className="text-xs font-bold text-neon-purple mb-3 px-2 uppercase tracking-wider">Yesterday</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">UX Designer portfolio tips</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Software engineering bootcamps</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Freelance vs full-time work</span>
                </button>
              </div>
            </div>

            {/* Last 7 Days */}
            <div>
              <h3 className="text-xs font-bold text-neon-pink mb-3 px-2 uppercase tracking-wider">Last 7 Days</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Digital marketing certification</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Project management careers</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">AI and machine learning jobs</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Startup vs corporate culture</span>
                </button>
              </div>
            </div>

            {/* Last 30 Days */}
            <div>
              <h3 className="text-xs font-bold text-neon-green mb-3 px-2 uppercase tracking-wider">Last 30 Days</h3>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Career change at 30</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Negotiating salary offers</span>
                </button>
                <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:glass hover:text-neon-cyan rounded-lg transition-all duration-300 truncate hover:glow-cyan group">
                  <span className="group-hover:font-medium transition-all">Work-life balance tips</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-border mt-auto">
          <div className="text-xs text-muted-foreground space-y-2">
            <div className="flex items-center justify-between">
              <span>Today&apos;s queries</span>
              <span className="font-medium text-neon-cyan">12/50</span>
            </div>
            <div className="w-full glass rounded-full h-2 overflow-hidden">
              <div 
                className="gradient-animated h-full rounded-full glow-cyan transition-all duration-500" 
                style={{ width: '24%' }}
              ></div>
            </div>
            <div className="text-center pt-2">
              <button className="text-xs text-neon-purple hover:text-neon-cyan transition-colors font-medium">
                Upgrade for unlimited queries
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}