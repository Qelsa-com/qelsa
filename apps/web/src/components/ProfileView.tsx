import { useState } from 'react';
import { 
  MapPin, Building, GraduationCap, Calendar, Users, MessageSquare, 
  Heart, Share2, Bookmark, TrendingUp, Award, Target, Briefcase,
  ExternalLink, ChevronRight, Star, Lock, BarChart3, Brain,
  Globe, Coffee, Code, Lightbulb, Zap, Eye, Plus, CheckCircle,
  ArrowUpRight, Clock, Filter, ThumbsUp, MessageCircle, MoreHorizontal,
  Bell
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';


interface ProfileViewProps {
  userId: string;
  onClose?: () => void;
}

// Mock user data - in real app this would come from API
const mockUserData = {
  id: '1',
  fullName: 'Sarah Chen',
  username: 'sarahchen',
  profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop',
  headline: 'AI Product Manager | Exploring GenAI Careers',
  location: 'San Francisco, CA',
  education: 'Stanford University',
  company: 'TechFlow AI',
  experience: '5+ years',
  followers: 2847,
  following: 1205,
  posts: 89,
  isFollowing: false,
  isConnected: true,
  isPremiumVisible: true, // This would be based on current user's subscription
  
  bio: 'Passionate about building AI products that democratize access to career opportunities. Former consultant turned product leader, helping shape the future of work through technology.',
  
  skills: [
    { name: 'Product Management', endorsements: 47, verified: true },
    { name: 'AI/ML Strategy', endorsements: 32, verified: true },
    { name: 'Data Analysis', endorsements: 28, verified: false },
    { name: 'UX Design', endorsements: 19, verified: false },
    { name: 'Strategy', endorsements: 35, verified: true },
    { name: 'Team Leadership', endorsements: 41, verified: true }
  ],
  
  careerJourney: [
    {
      type: 'work',
      title: 'Senior Product Manager',
      company: 'TechFlow AI',
      period: '2022 - Present',
      description: 'Leading AI-powered career platform development, growing user base by 300%',
      achievements: ['Launched 3 major AI features', 'Led team of 12 engineers', '$2M ARR growth']
    },
    {
      type: 'work',
      title: 'Product Manager',
      company: 'InnovateLabs',
      period: '2020 - 2022',
      description: 'Built B2B SaaS products for enterprise clients',
      achievements: ['0-1 product launch', '50+ enterprise clients', 'Series A funding']
    },
    {
      type: 'education',
      title: 'Master of Science in Computer Science',
      company: 'Stanford University',
      period: '2018 - 2020',
      description: 'Specialized in AI/ML with focus on natural language processing'
    },
    {
      type: 'work',
      title: 'Strategy Consultant',
      company: 'McKinsey & Company',
      period: '2016 - 2018',
      description: 'Advised Fortune 500 companies on digital transformation',
      achievements: ['Led 10+ client engagements', 'Digital strategy expertise', 'Top performer']
    }
  ],
  
  badges: [
    { name: 'Top Contributor', icon: Award, color: 'neon-yellow' },
    { name: 'AI Expert', icon: Brain, color: 'neon-purple' },
    { name: 'Community Leader', icon: Users, color: 'neon-cyan' },
    { name: 'Mentor', icon: Lightbulb, color: 'neon-green' }
  ],
  
  topTopics: ['Product Management', 'Artificial Intelligence', 'Career Growth', 'Leadership', 'Tech Innovation'],
  
  // Premium analytics data
  premiumAnalytics: {
    engagementRate: 8.5,
    postFrequency: '3-4 times/week',
    avgLikes: 47,
    avgComments: 12,
    skillVerificationRate: 73,
    recentUpskilling: ['AI Ethics', 'Advanced Analytics'],
    careerSignals: {
      jobSeeking: 'Low',
      careerTransition: 'Moderate',
      promotionReady: 'High'
    },
    networkClusters: ['AI/ML Professionals', 'Product Leaders', 'Stanford Alumni', 'Ex-McKinsey']
  }
};

// Mock posts data
const mockPosts = [
  {
    id: '1',
    author: mockUserData,
    content: 'Just shipped our latest AI feature that helps job seekers identify skill gaps in real-time. The impact of AI on career development is truly transformative. What trends are you seeing in your industry?',
    timestamp: '2 hours ago',
    likes: 34,
    comments: 8,
    shares: 3,
    hasLiked: false,
    type: 'text'
  },
  {
    id: '2',
    author: mockUserData,
    content: 'Attending the AI Product Summit was incredible! Key takeaway: The future of product management is deeply intertwined with AI capabilities. Here are my top 3 insights from the event...',
    timestamp: '1 day ago',
    likes: 67,
    comments: 15,
    shares: 12,
    hasLiked: false,
    type: 'text',
    media: {
      type: 'image',
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop'
    }
  }
];

export function ProfileView({ userId, onClose }: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState('feed');
  const [isFollowing, setIsFollowing] = useState(mockUserData.isFollowing);
  const [showPremiumAnalytics, setShowPremiumAnalytics] = useState(false);
  const [feedFilter, setFeedFilter] = useState('posts');
  
  const user = mockUserData; // In real app, fetch user data based on userId

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const renderCareerTimelineItem = (item: typeof user.careerJourney[0], index: number) => {
    const isWork = item.type === 'work';
    const Icon = isWork ? Briefcase : GraduationCap;
    
    return (
      <div key={index} className="flex gap-4 relative">
        {/* Timeline line */}
        {index < user.careerJourney.length - 1 && (
          <div className="absolute left-6 top-12 w-px h-16 bg-glass-border"></div>
        )}
        
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl glass flex items-center justify-center flex-shrink-0 ${
          isWork ? 'border-neon-cyan' : 'border-neon-purple'
        }`}>
          <Icon className={`h-5 w-5 ${isWork ? 'text-neon-cyan' : 'text-neon-purple'}`} />
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-6">
          <h4 className="font-bold text-white">{item.title}</h4>
          <p className="text-neon-cyan font-medium">{item.company}</p>
          <p className="text-sm text-muted-foreground mb-2">{item.period}</p>
          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
          
          {item.achievements && (
            <div className="space-y-1">
              {item.achievements.map((achievement, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green"></div>
                  <span>{achievement}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-neon-cyan/3 rounded-full blur-3xl opacity-70"></div>
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-neon-purple/3 rounded-full blur-3xl opacity-60"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="glass border-glass-border rounded-2xl p-8 mb-8 sticky top-4 z-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Profile Info */}
            <div className="flex flex-col sm:flex-row gap-6 flex-1">
              <Avatar className="w-24 h-24 ring-4 ring-glass-border">
                <AvatarImage src={user.profileImage} alt={user.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-neon-cyan to-neon-purple text-black font-bold text-2xl">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-3">
                <div>
                  <h1 className="text-3xl font-bold text-white">{user.fullName}</h1>
                  <p className="text-lg text-neon-cyan">@{user.username}</p>
                  <p className="text-lg text-muted-foreground mt-1">{user.headline}</p>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span>{user.company}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>{user.education}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{user.experience}</span>
                  </div>
                </div>
                
                <p className="text-muted-foreground">{user.bio}</p>
              </div>
            </div>
            
            {/* Right: Actions & Metrics */}
            <div className="flex flex-col gap-4">
              {/* Metrics */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-cyan">{user.followers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-purple">{user.following.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green">{user.posts}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleFollow}
                  className={isFollowing 
                    ? "glass hover:glass-strong border-glass-border text-white" 
                    : "gradient-animated text-black font-medium hover:scale-105 transition-all"
                  }
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                
                <Button 
                  variant="outline" 
                  className="glass hover:glass-strong border-neon-cyan text-neon-cyan hover:text-neon-cyan"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Connect
                </Button>
                
                <Button 
                  variant="outline" 
                  className="glass hover:glass-strong border-glass-border"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="glass hover:glass-strong border-neon-yellow/30 text-neon-yellow hover:text-neon-yellow"
                  title="Get notified when they post"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Skills & Endorsements */}
            <Card className="glass border-glass-border rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-neon-cyan" />
                Skills & Endorsements
              </h3>
              
              <div className="space-y-3">
                {user.skills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 glass rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{skill.name}</span>
                      {skill.verified && (
                        <CheckCircle className="h-4 w-4 text-neon-green" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neon-cyan">{skill.endorsements}</span>
                      <Button size="sm" variant="ghost" className="text-neon-cyan hover:text-neon-cyan">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="ghost" className="w-full mt-4 text-neon-cyan hover:text-neon-cyan">
                View all skills <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Card>

            {/* Activity Highlights */}
            <Card className="glass border-glass-border rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-neon-yellow" />
                Activity Highlights
              </h3>
              
              {/* Badges */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-white">Badges & Achievements</h4>
                <div className="grid grid-cols-2 gap-2">
                  {user.badges.map((badge, index) => {
                    const Icon = badge.icon;
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 glass rounded-lg">
                        <Icon className={`h-4 w-4 text-${badge.color}`} />
                        <span className="text-xs font-medium text-white">{badge.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Top Topics */}
              <div className="space-y-3">
                <h4 className="font-medium text-white">Most Engaged Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {user.topTopics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="glass border-glass-border">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>

            {/* Premium Analytics */}
            {user.isPremiumVisible && (
              <Card className="glass border-glass-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-neon-pink" />
                    Premium Insights
                  </h3>
                  <Badge className="bg-gradient-to-r from-neon-pink to-neon-purple text-black font-medium">
                    HR Premium
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-lg font-bold text-neon-green">{user.premiumAnalytics.engagementRate}%</div>
                      <div className="text-xs text-muted-foreground">Engagement Rate</div>
                    </div>
                    <div className="text-center p-3 glass rounded-lg">
                      <div className="text-lg font-bold text-neon-cyan">{user.premiumAnalytics.skillVerificationRate}%</div>
                      <div className="text-xs text-muted-foreground">Verified Skills</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Career Signals</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Job Seeking</span>
                        <span className="text-neon-green">{user.premiumAnalytics.careerSignals.jobSeeking}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Career Transition</span>
                        <span className="text-neon-yellow">{user.premiumAnalytics.careerSignals.careerTransition}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Promotion Ready</span>
                        <span className="text-neon-cyan">{user.premiumAnalytics.careerSignals.promotionReady}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full gradient-animated text-black font-medium">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Full Analytics Report
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 w-full glass">
                <TabsTrigger value="journey">Career Journey</TabsTrigger>
                <TabsTrigger value="feed">Profile Feed</TabsTrigger>
              </TabsList>

              {/* Career Journey Tab */}
              <TabsContent value="journey" className="space-y-6">
                <Card className="glass border-glass-border rounded-2xl p-6">
                  <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-neon-cyan" />
                    Career Timeline
                  </h3>
                  
                  <div className="space-y-6">
                    {user.careerJourney.map((item, index) => renderCareerTimelineItem(item, index))}
                  </div>
                </Card>
              </TabsContent>

              {/* Profile Feed Tab */}
              <TabsContent value="feed" className="space-y-6">
                {/* Feed Filters */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Show:</span>
                  </div>
                  <div className="flex gap-2">
                    {['posts', 'articles', 'shared'].map((filter) => (
                      <Button
                        key={filter}
                        variant={feedFilter === filter ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFeedFilter(filter)}
                        className={feedFilter === filter ? 'gradient-animated text-black' : ''}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Posts */}
                <div className="space-y-6">
                  {mockPosts.map((post) => (
                    <Card key={post.id} className="glass border-glass-border rounded-2xl p-6 transition-all duration-300 hover:glow-cyan">
                      {/* Post Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-12 w-12 ring-2 ring-glass-border">
                          <AvatarImage src={post.author.profileImage} alt={post.author.fullName} />
                          <AvatarFallback className="bg-gradient-to-br from-neon-cyan to-neon-purple text-black font-bold">
                            {post.author.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white">{post.author.fullName}</h3>
                            <CheckCircle className="h-4 w-4 text-neon-green" />
                          </div>
                          <p className="text-sm text-muted-foreground">{post.author.headline}</p>
                          <p className="text-xs text-muted-foreground mt-1">{post.timestamp}</p>
                        </div>

                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <p className="text-white leading-relaxed mb-3">{post.content}</p>
                        
                        {/* Media if exists */}
                        {post.media && (
                          <div className="mt-4 rounded-xl overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={post.media.url}
                              alt="Post media"
                              className="w-full h-auto max-h-96 object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Engagement Stats */}
                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4 pb-4 border-b border-glass-border">
                        <span>{post.likes} likes</span>
                        <span>{post.comments} comments</span>
                        <span>{post.shares} shares</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`transition-all duration-300 ${
                              post.hasLiked 
                                ? 'text-neon-pink glow-pink' 
                                : 'text-muted-foreground hover:text-neon-pink hover:glow-pink'
                            }`}
                          >
                            <Heart className={`h-4 w-4 mr-2 ${post.hasLiked ? 'fill-current' : ''}`} />
                            Like
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-neon-cyan transition-colors"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Comment
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-neon-green transition-colors"
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-neon-yellow transition-colors"
                        >
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>


            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}