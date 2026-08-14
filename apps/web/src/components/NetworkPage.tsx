import { useState } from 'react';
import { 
  Search, Filter, MapPin, Building, Users, ChevronRight, 
  UserPlus, Eye, MessageSquare, Briefcase, GraduationCap,
  TrendingUp, Sparkles, Brain, Star, Globe, Code, Lightbulb,
  Award, Zap, Coffee, BarChart3, Target, CheckCircle, X
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

interface NetworkPageProps {
  onViewProfile?: (userId: string) => void;
}

interface NetworkConnection {
  id: string;
  fullName: string;
  username: string;
  profileImage: string;
  headline: string;
  company: string;
  location: string;
  mutualConnections: number;
  isFollowing: boolean;
  isVerified: boolean;
  connectionType: 'suggested' | 'industry' | 'alumni' | 'mutual' | 'trending';
  skills: string[];
  recentActivity?: string;
  aiMatchScore?: number;
  bio?: string;
}

// Mock data for network connections
const mockConnections: NetworkConnection[] = [
  {
    id: '1',
    fullName: 'Priya Sharma',
    username: 'priyasharma',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop',
    headline: 'Senior AI Product Manager | Building the Future of Work',
    company: 'TechCorp AI',
    location: 'Bangalore, India',
    mutualConnections: 12,
    isFollowing: false,
    isVerified: true,
    connectionType: 'suggested',
    skills: ['Product Management', 'AI Strategy', 'Machine Learning'],
    recentActivity: 'Posted about AI trends in fintech',
    aiMatchScore: 95,
    bio: 'Passionate about democratizing AI for everyone. Building products that transform careers.'
  },
  {
    id: '2',
    fullName: 'Raj Patel',
    username: 'rajpatel',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    headline: 'Fintech Entrepreneur | YC Alum | Angel Investor',
    company: 'PayFlow Solutions',
    location: 'Mumbai, India',
    mutualConnections: 8,
    isFollowing: false,
    isVerified: true,
    connectionType: 'industry',
    skills: ['Fintech', 'Entrepreneurship', 'Product Strategy'],
    recentActivity: 'Shared insights on digital banking',
    aiMatchScore: 88,
    bio: 'Building the next generation of financial products for emerging markets.'
  },
  {
    id: '3',
    fullName: 'Lisa Chen',
    username: 'lisachen',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    headline: 'UX Design Lead | Design Systems Expert',
    company: 'DesignLab Inc',
    location: 'San Francisco, CA',
    mutualConnections: 15,
    isFollowing: true,
    isVerified: true,
    connectionType: 'mutual',
    skills: ['UX Design', 'Design Systems', 'User Research'],
    recentActivity: 'Published article on accessible design',
    aiMatchScore: 82,
    bio: 'Creating inclusive digital experiences that empower users worldwide.'
  },
  {
    id: '4',
    fullName: 'Arjun Kumar',
    username: 'arjunkumar',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    headline: 'Data Scientist | ML Engineer | AI Researcher',
    company: 'DataVision Labs',
    location: 'Hyderabad, India',
    mutualConnections: 6,
    isFollowing: false,
    isVerified: false,
    connectionType: 'alumni',
    skills: ['Machine Learning', 'Python', 'Deep Learning'],
    recentActivity: 'Completed certification in MLOps',
    aiMatchScore: 91,
    bio: 'Turning data into actionable insights. PhD in Computer Science from IIT.'
  },
  {
    id: '5',
    fullName: 'Emma Thompson',
    username: 'emmathompson',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    headline: 'Marketing Director | Growth Hacker | Brand Strategist',
    company: 'GrowthTech',
    location: 'London, UK',
    mutualConnections: 22,
    isFollowing: false,
    isVerified: true,
    connectionType: 'trending',
    skills: ['Digital Marketing', 'Growth Strategy', 'Brand Management'],
    recentActivity: 'Spoke at MarTech Conference 2024',
    aiMatchScore: 76,
    bio: 'Helping startups scale from 0-1M users. Forbes 30 Under 30 recipient.'
  },
  {
    id: '6',
    fullName: 'Michael Singh',
    username: 'michaelsingh',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    headline: 'Software Engineering Manager | Tech Lead',
    company: 'CloudScale Systems',
    location: 'Toronto, Canada',
    mutualConnections: 9,
    isFollowing: false,
    isVerified: true,
    connectionType: 'suggested',
    skills: ['Software Engineering', 'Team Leadership', 'Cloud Architecture'],
    recentActivity: 'Shared post about remote team management',
    aiMatchScore: 84,
    bio: 'Building scalable systems and high-performing engineering teams.'
  },
  {
    id: '7',
    fullName: 'Samara Ibrahim',
    username: 'samaraibrahim',
    profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop',
    headline: 'Blockchain Developer | DeFi Protocol Architect',
    company: 'CryptoVault Labs',
    location: 'Dubai, UAE',
    mutualConnections: 14,
    isFollowing: false,
    isVerified: true,
    connectionType: 'industry',
    skills: ['Blockchain', 'Smart Contracts', 'Solidity'],
    recentActivity: 'Published research on DeFi security',
    aiMatchScore: 89,
    bio: 'Building the next generation of decentralized financial protocols. PhD in Distributed Systems.'
  },
  {
    id: '8',
    fullName: 'David Rodriguez',
    username: 'davidrodriguez',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    headline: 'VP of Sales | Revenue Growth Expert | SaaS Specialist',
    company: 'SalesForce Analytics',
    location: 'Austin, TX',
    mutualConnections: 18,
    isFollowing: false,
    isVerified: true,
    connectionType: 'mutual',
    skills: ['Sales Strategy', 'Revenue Operations', 'B2B SaaS'],
    recentActivity: 'Keynote at Sales Excellence Summit',
    aiMatchScore: 77,
    bio: 'Scaling B2B SaaS companies from $1M to $100M+ ARR. Former VP at Salesforce and HubSpot.'
  },
  {
    id: '9',
    fullName: 'Aisha Patel',
    username: 'aishapatel',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    headline: 'Chief Technology Officer | AI Infrastructure Leader',
    company: 'InnovateTech Solutions',
    location: 'Singapore',
    mutualConnections: 25,
    isFollowing: false,
    isVerified: true,
    connectionType: 'trending',
    skills: ['AI Infrastructure', 'Cloud Architecture', 'Technical Leadership'],
    recentActivity: 'Launched new AI platform serving 1M+ users',
    aiMatchScore: 93,
    bio: 'Leading technical innovation at scale. Building AI infrastructure that powers the future of work.'
  }
];

// AI-suggested filter categories
const aiSuggestedFilters = [
  { id: 'healthtech-bangalore', label: 'HealthTech professionals in Bangalore', icon: Award, count: 127 },
  { id: 'genai-recent', label: 'People who recently posted about GenAI', icon: Brain, count: 89 },
  { id: 'product-managers', label: 'Product Managers in your network', icon: Target, count: 234 },
  { id: 'startup-founders', label: 'Startup founders and entrepreneurs', icon: TrendingUp, count: 156 },
  { id: 'yc-alumni', label: 'Y Combinator alumni', icon: Star, count: 67 },
  { id: 'ml-engineers', label: 'Machine Learning engineers', icon: Code, count: 198 }
];

const connectionCategories = [
  { id: 'suggested', label: 'Suggested for You', icon: Sparkles, description: 'AI-curated based on your profile' },
  { id: 'industry', label: 'Industry Leaders', icon: TrendingUp, description: 'Top professionals in your field' },
  { id: 'alumni', label: 'Alumni Network', icon: GraduationCap, description: 'From your educational background' },
  { id: 'mutual', label: 'Mutual Connections', icon: Users, description: 'Connected through your network' },
  { id: 'trending', label: 'Rising Stars', icon: Star, description: 'Trending professionals to watch' }
];

export function NetworkPage({ onViewProfile }: NetworkPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('suggested');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set(['3']));
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleFollow = (userId: string) => {
    setFollowingUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const toggleCardExpansion = (userId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const filteredConnections = mockConnections.filter(connection => {
    const matchesSearch = searchQuery === '' || 
      connection.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connection.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || connection.connectionType === activeCategory;
    const matchesLocation = locationFilter === '' || connection.location.includes(locationFilter);
    
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const renderConnectionCard = (connection: NetworkConnection) => {
    const isFollowing = followingUsers.has(connection.id);
    const isExpanded = expandedCards.has(connection.id);
    
    return (
      <Card key={connection.id} className="glass border-glass-border rounded-2xl p-6 transition-all duration-300 hover:glow-cyan group">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div 
            className="relative cursor-pointer"
            onClick={() => onViewProfile?.(connection.id)}
          >
            <Avatar className="w-16 h-16 ring-2 ring-glass-border group-hover:ring-neon-cyan/50 transition-all">
              <AvatarImage src={connection.profileImage} alt={connection.fullName} />
              <AvatarFallback className="bg-gradient-to-br from-neon-cyan to-neon-purple text-black font-bold">
                {connection.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="font-bold text-white text-lg cursor-pointer hover:text-neon-cyan transition-colors"
                onClick={() => onViewProfile?.(connection.id)}
              >
                {connection.fullName}
              </h3>

            </div>
            <div className="flex items-center gap-1">
              <p className="text-neon-cyan text-sm">@{connection.username}</p>
              {connection.isVerified && (
                <CheckCircle className="h-4 w-4 text-neon-green" />
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{connection.headline.split('|')[0].trim()}</p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-3 w-3" />
                <span>{connection.company}</span>
              </div>

            </div>
            
            {connection.mutualConnections > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-neon-cyan">
                <Users className="h-3 w-3" />
                <span>{connection.mutualConnections} mutual connections</span>
              </div>
            )}
          </div>
        </div>





        {/* Expanded Bio */}
        {isExpanded && connection.bio && (
          <div className="mb-4 p-3 glass rounded-lg">
            <p className="text-sm text-muted-foreground">{connection.bio}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleFollow(connection.id)}
            className={isFollowing 
              ? "flex-1 glass hover:glass-strong border-glass-border text-white" 
              : "flex-1 gradient-animated text-black font-medium hover:scale-105 transition-all"
            }
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan hover:text-neon-cyan"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          

        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background"></div>
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-neon-purple/3 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-2">
              Build Your Network
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Smart connections recommended based on your profile and AI prompts
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Find people by name, role, company, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 glass border-glass-border bg-input-background text-foreground placeholder:text-muted-foreground text-lg"
                />
              </div>

              {/* Filter Button */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2 h-14 px-6 glass border-glass-border text-foreground hover:bg-neon-cyan/10 hover:text-neon-cyan hover:border-neon-cyan transition-all duration-300 whitespace-nowrap"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </Button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">


              </div>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <Card className="glass border-glass-border rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Location</label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger className="glass border-glass-border">
                        <SelectValue placeholder="Any location" />
                      </SelectTrigger>
                      <SelectContent className="glass border-glass-border">
                        <SelectItem value="">Any location</SelectItem>
                        <SelectItem value="Bangalore">Bangalore</SelectItem>
                        <SelectItem value="Mumbai">Mumbai</SelectItem>
                        <SelectItem value="Delhi">Delhi</SelectItem>
                        <SelectItem value="San Francisco">San Francisco</SelectItem>
                        <SelectItem value="London">London</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Industry</label>
                    <Select value={industryFilter} onValueChange={setIndustryFilter}>
                      <SelectTrigger className="glass border-glass-border">
                        <SelectValue placeholder="Any industry" />
                      </SelectTrigger>
                      <SelectContent className="glass border-glass-border">
                        <SelectItem value="">Any industry</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Experience</label>
                    <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                      <SelectTrigger className="glass border-glass-border">
                        <SelectValue placeholder="Any experience" />
                      </SelectTrigger>
                      <SelectContent className="glass border-glass-border">
                        <SelectItem value="">Any experience</SelectItem>
                        <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                        <SelectItem value="mid">Mid Level (3-7 years)</SelectItem>
                        <SelectItem value="senior">Senior Level (8+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* AI-Assisted Discovery Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Suggested Filters */}
            <Card className="glass border-glass-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-neon-purple" />
                <h3 className="font-bold text-white">AI Suggestions</h3>
              </div>
              
              <div className="space-y-3">
                {aiSuggestedFilters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={filter.id}
                      className="w-full p-3 glass rounded-lg border border-glass-border hover:border-neon-cyan/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-neon-cyan group-hover:text-neon-purple transition-colors" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{filter.label}</p>
                          <p className="text-xs text-muted-foreground">{filter.count} people</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-neon-cyan transition-colors" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Engagement Nudges */}
            <Card className="glass border-glass-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-neon-green" />
                <h3 className="font-bold text-white">Network Goals</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 glass rounded-lg border border-neon-green/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Weekly Goal</span>
                    <span className="text-sm text-neon-green">3/5</span>
                  </div>
                  <div className="w-full bg-glass rounded-full h-2">
                    <div className="bg-neon-green h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Follow 2 more professionals this week!</p>
                </div>
                
                <div className="p-3 glass rounded-lg border border-neon-cyan/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-neon-cyan" />
                    <span className="text-sm font-medium text-neon-cyan">New followers</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">5 people followed you back this week</p>
                </div>
              </div>
            </Card>

            {/* Network Stats */}
            <Card className="glass border-glass-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-neon-pink" />
                <h3 className="font-bold text-white">Your Network</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-cyan">127</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-purple">89</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green">23</div>
                  <div className="text-xs text-muted-foreground">This Week</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-yellow">4.2k</div>
                  <div className="text-xs text-muted-foreground">Profile Views</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Connection Categories */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-neon-cyan" />
                <h3 className="font-bold text-white">Discover Professionals</h3>
              </div>
              
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full glass">
                  {connectionCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{category.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {connectionCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="space-y-6">
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">{category.description}</p>
                      <p className="text-sm text-neon-cyan mt-1">
                        {filteredConnections.length} professionals found
                      </p>
                    </div>

                    {/* Connection Cards */}
                    <div className={viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
                      : 'space-y-4'
                    }>
                      {filteredConnections.slice(0, 9).map((connection) => renderConnectionCard(connection))}
                    </div>

                    {/* Load More */}
                    <div className="text-center py-8">
                      <Button
                        variant="outline"
                        className="glass hover:glass-strong border-glass-border text-foreground hover:text-neon-cyan hover:border-neon-cyan transition-all hover:glow-cyan px-8 py-3"
                      >
                        Load More Professionals
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}