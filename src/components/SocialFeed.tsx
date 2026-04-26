import { useState } from 'react';
import { 
  Plus, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Filter, 
  TrendingUp, Users, Briefcase, Lightbulb, Award, Image, Video, FileText,
  Send, Smile, Gift, Zap, Eye, ChevronDown, ChevronUp, Play, Download,
  CheckCircle, BookOpen, User, Clock, Calendar
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';

interface Post {
  id: string;
  author: {
    name: string;
    title: string;
    company?: string;
    avatar: string;
    verified: boolean;
    isCompany?: boolean;
  };
  content: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'shared-blog';
  category: 'career_update' | 'insight' | 'job_posting' | 'achievement' | 'motivation' | 'shared_content';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'pdf';
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  engagement: {
    liked: boolean;
    bookmarked: boolean;
    shared: boolean;
  };
  comments_data?: PostComment[];
  sharedBlog?: {
    id: string;
    title: string;
    excerpt: string;
    author: {
      name: string;
      avatar: string;
      role: string;
    };
    category: string;
    tags: string[];
    readTime: number;
    publishDate: string;
  };
}

interface PostComment {
  id: string;
  author: {
    name: string;
    avatar: string;
    title: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  liked: boolean;
}

const mockPosts: Post[] = [
  {
    id: '1',
    author: {
      name: 'Sarah Chen',
      title: 'Product Manager',
      company: 'TechCorp',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      verified: true
    },
    content: "Just completed my transition from marketing to product management! 🚀 The key was focusing on transferable skills like user research and data analysis. Qelsa AI helped me identify the perfect learning path.",
    type: 'text',
    category: 'career_update',
    timestamp: '2h ago',
    likes: 124,
    comments: 18,
    shares: 8,
    hashtags: ['CareerTransition', 'ProductManagement', 'Growth'],
    engagement: { liked: false, bookmarked: false, shared: false },
    comments_data: [
      {
        id: 'c1',
        author: {
          name: 'Jake Wilson',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
          title: 'Senior Designer'
        },
        content: 'Congratulations Sarah! Your journey is so inspiring 🎉 Any specific courses you\'d recommend?',
        timestamp: '1h ago',
        likes: 5,
        liked: false
      }
    ]
  },
  {
    id: '2',
    author: {
      name: 'TechStart Inc.',
      title: 'AI/ML Startup',
      company: 'TechStart',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop',
      verified: true,
      isCompany: true
    },
    content: "We're hiring passionate developers! 🔥 Join our AI team and shape the future of technology. Remote-first company with competitive equity packages.",
    type: 'image',
    category: 'job_posting',
    mediaUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop',
    mediaType: 'image',
    timestamp: '4h ago',
    likes: 89,
    comments: 15,
    shares: 25,
    hashtags: ['Hiring', 'AI', 'Remote', 'Startup'],
    engagement: { liked: false, bookmarked: true, shared: false },
    comments_data: []
  },
  {
    id: '3',
    author: {
      name: 'Marcus Johnson',
      title: 'Senior Software Engineer',
      company: 'DevCorp',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      verified: false
    },
    content: "Remote work productivity guide 📊 After 3 years of remote work, here are the tools that completely transformed my workflow. Sharing my complete setup!",
    type: 'pdf',
    category: 'insight',
    mediaUrl: '/sample-productivity-guide.pdf',
    mediaType: 'pdf',
    timestamp: '6h ago',
    likes: 256,
    comments: 42,
    shares: 78,
    hashtags: ['RemoteWork', 'Productivity', 'Tools', 'Engineering'],
    engagement: { liked: true, bookmarked: true, shared: false },
    comments_data: []
  },
  {
    id: '4',
    author: {
      name: 'Alex Rivera',
      title: 'UX Designer & Career Mentor',
      company: 'DesignFlow',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      verified: true
    },
    content: "Mentorship session highlights ✨ Helped 50+ designers overcome imposter syndrome this year. Remember: Your unique perspective is your superpower!",
    type: 'video',
    category: 'motivation',
    mediaUrl: 'https://example.com/sample-video.mp4',
    mediaType: 'video',
    timestamp: '8h ago',
    likes: 203,
    comments: 67,
    shares: 91,
    hashtags: ['Mentorship', 'UXDesign', 'ImposterSyndrome', 'Growth'],
    engagement: { liked: true, bookmarked: false, shared: false },
    comments_data: []
  }
];

const categoryTabs = [
  { id: 'all', label: 'All Posts', icon: TrendingUp, count: 1247 },
  { id: 'following', label: 'Following', icon: Users, count: 89 },
  { id: 'career_updates', label: 'Career Updates', icon: TrendingUp, count: 156 },
  { id: 'job_postings', label: 'Job Postings', icon: Briefcase, count: 45 },
  { id: 'insights', label: 'Insights', icon: Lightbulb, count: 203 }
];

const categoryIcons = {
  career_update: { icon: TrendingUp, color: 'text-neon-green', bg: 'bg-neon-green/10' },
  insight: { icon: Lightbulb, color: 'text-neon-yellow', bg: 'bg-neon-yellow/10' },
  job_posting: { icon: Briefcase, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
  motivation: { icon: Heart, color: 'text-neon-pink', bg: 'bg-neon-pink/10' },
  achievement: { icon: Award, color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
  shared_content: { icon: Share2, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' }
};

interface SocialFeedProps {
  sharedBlogPosts?: any[];
}

export function SocialFeed({ }: SocialFeedProps = {}) {
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState(mockPosts);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'text' | 'image' | 'video' | 'pdf'>('text');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const sharedBlogPosts = []

  const handlePostInteraction = (postId: string, action: 'like' | 'bookmark' | 'share') => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const updatedPost = { ...post };
        
        switch (action) {
          case 'like':
            updatedPost.engagement.liked = !post.engagement.liked;
            updatedPost.likes += post.engagement.liked ? -1 : 1;
            break;
          case 'bookmark':
            updatedPost.engagement.bookmarked = !post.engagement.bookmarked;
            break;
          case 'share':
            updatedPost.engagement.shared = !post.engagement.shared;
            updatedPost.shares += post.engagement.shared ? -1 : 1;
            break;
        }
        
        return updatedPost;
      }
      return post;
    }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    
    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: 'You',
        title: 'Professional',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: false
      },
      content: newPostContent,
      type: newPostType,
      category: 'insight',
      timestamp: 'now',
      likes: 0,
      comments: 0,
      shares: 0,
      hashtags: [],
      engagement: { liked: false, bookmarked: false, shared: false }
    };
    
    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setShowCreatePost(false);
  };

  const renderMediaContent = (post: Post) => {
    if (!post.mediaUrl) return null;

    switch (post.mediaType) {
      case 'image':
        return (
          <div className="mt-4 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full h-auto max-h-96 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-4 rounded-xl overflow-hidden bg-black/20 relative">
            <div className="aspect-video flex items-center justify-center glass">
              <Button size="lg" className="rounded-full bg-neon-cyan text-black hover:bg-neon-cyan/90 glow-cyan">
                <Play className="h-6 w-6" />
              </Button>
            </div>
          </div>
        );
      
      case 'pdf':
        return (
          <div className="mt-4 p-4 glass rounded-xl border border-glass-border hover:border-neon-cyan/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-neon-pink/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-neon-pink" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">Productivity Guide</h4>
                <p className="text-sm text-muted-foreground">PDF • 2.5 MB</p>
              </div>
              <Button size="sm" variant="outline" className="border-neon-pink/30 text-neon-pink hover:bg-neon-pink/10">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Combine regular posts with shared blog posts
  const allPosts = [
    ...sharedBlogPosts.map(sharedPost => ({
      id: sharedPost.id,
      author: sharedPost.user || {
        name: 'Unknown User',
        title: 'User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: false
      },
      content: `Shared an insightful blog post: "${sharedPost.blogPost.title}"`,
      type: 'shared-blog' as const,
      category: 'shared_content' as const,
      timestamp: new Date(sharedPost.timestamp).toLocaleString(),
      likes: 0,
      comments: 0,
      shares: 0,
      hashtags: sharedPost.blogPost.tags || [],
      engagement: { liked: false, bookmarked: false, shared: false },
      comments_data: [],
      sharedBlog: {
        id: sharedPost.blogPost.id,
        title: sharedPost.blogPost.title,
        excerpt: sharedPost.blogPost.excerpt,
        author: sharedPost.blogPost.author || {
          name: 'Blog Author',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          role: 'Writer'
        },
        category: sharedPost.blogPost.category,
        tags: sharedPost.blogPost.tags || [],
        readTime: sharedPost.blogPost.readTime || 5,
        publishDate: sharedPost.blogPost.publishDate || sharedPost.timestamp
      }
    })),
    ...posts
  ];

  const filteredPosts = activeTab === 'all' 
    ? allPosts 
    : allPosts.filter(post => 
        activeTab === 'following' || 
        post.category === activeTab.replace('_updates', '_update').replace('_postings', '_posting')
      );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong border-b border-glass-border backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
                Community Feed
              </h1>
              <p className="text-sm text-muted-foreground">Connect • Share • Grow together</p>
            </div>
            
            <Button
              onClick={() => setShowCreatePost(!showCreatePost)}
              className="gradient-animated text-black font-bold shadow-xl glow-cyan hover:glow-purple transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Post
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hidden pb-2">
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive 
                      ? 'glass-strong border border-neon-cyan text-neon-cyan glow-cyan' 
                      : 'glass border border-glass-border text-foreground hover:text-neon-cyan hover:border-neon-cyan/50 hover:glow-cyan'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${isActive ? 'bg-neon-cyan/20 text-neon-cyan' : 'glass'}`}
                  >
                    {tab.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Create Post Box */}
        {showCreatePost && (
          <Card className="glass border-glass-border rounded-2xl p-6 mb-6 animate-in slide-in-from-top-4 duration-300">
            <div className="flex gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share your update..."
                  className="border-0 bg-transparent text-white placeholder-muted-foreground resize-none focus:ring-2 focus:ring-neon-cyan rounded-xl"
                  rows={3}
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      variant={newPostType === 'text' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setNewPostType('text')}
                      className="text-neon-cyan hover:bg-neon-cyan/10"
                    >
                      ✍️ Text
                    </Button>
                    <Button
                      variant={newPostType === 'image' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setNewPostType('image')}
                      className="text-neon-green hover:bg-neon-green/10"
                    >
                      📸 Image
                    </Button>
                    <Button
                      variant={newPostType === 'video' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setNewPostType('video')}
                      className="text-neon-purple hover:bg-neon-purple/10"
                    >
                      🎥 Video
                    </Button>
                    <Button
                      variant={newPostType === 'pdf' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setNewPostType('pdf')}
                      className="text-neon-pink hover:bg-neon-pink/10"
                    >
                      📄 PDF
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreatePost(false)}
                      className="border-glass-border text-muted-foreground hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim()}
                      className="gradient-animated text-black font-medium"
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {filteredPosts.map((post) => {
            const categoryConfig = categoryIcons[post.category];
            const CategoryIcon = categoryConfig.icon;
            const isCommentsExpanded = expandedComments.has(post.id);
            
            return (
              <Card key={post.id} className="glass border-glass-border rounded-2xl p-6 transition-all duration-300 hover:glow-cyan group">
                {/* Post Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div 
                    className="relative cursor-pointer" 
                  >
                    <Avatar className="h-12 w-12 ring-2 ring-glass-border group-hover:ring-neon-cyan/50 transition-all">
                      <AvatarImage src={post.author.avatar} alt={post.author.name} />
                      <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                    {post.author.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon-cyan rounded-full flex items-center justify-center ring-2 ring-background">
                        <CheckCircle className="h-3 w-3 text-black" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 
                        className="font-bold text-white group-hover:text-neon-cyan transition-colors cursor-pointer"
                      >
                        {post.author.name}
                      </h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${categoryConfig.bg}`}>
                        <CategoryIcon className={`h-3 w-3 ${categoryConfig.color}`} />
                        <span className={`text-xs font-medium ${categoryConfig.color}`}>
                          {post.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {post.author.title}
                      {post.author.company && ` • ${post.author.company}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{post.timestamp}</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <div className="text-white leading-relaxed mb-3">
                    {post.content}
                  </div>
                  
                  {/* Shared Blog Content */}
                  {post.type === 'shared-blog' && post.sharedBlog && (
                    <div className="mt-4 p-4 glass rounded-xl border border-glass-border hover:border-neon-cyan/50 transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-neon-cyan" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white group-hover:text-neon-cyan transition-colors line-clamp-2 mb-2">
                            {post.sharedBlog.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {post.sharedBlog.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {post.sharedBlog.author.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {post.sharedBlog.readTime} min read
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(post.sharedBlog.publishDate).toLocaleDateString()}
                            </div>
                          </div>
                          {post.sharedBlog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {post.sharedBlog.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs glass border-glass-border text-neon-cyan"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {post.sharedBlog.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs glass border-glass-border">
                                  +{post.sharedBlog.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Media Content */}
                  {renderMediaContent(post)}
                  
                  {/* Hashtags */}
                  {post.hashtags.length > 0 && post.type !== 'shared-blog' && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {post.hashtags.map((hashtag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="glass border-glass-border text-neon-cyan hover:bg-neon-cyan/10 cursor-pointer transition-all hover:glow-cyan"
                        >
                          #{hashtag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4 pb-4 border-b border-glass-border">
                  <button className="hover:text-neon-pink transition-colors flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {post.likes + post.comments * 2} views
                  </button>
                  <button className="hover:text-neon-cyan transition-colors">
                    {post.likes} likes
                  </button>
                  <button 
                    className="hover:text-neon-purple transition-colors"
                    onClick={() => toggleComments(post.id)}
                  >
                    {post.comments} comments
                  </button>
                  <button className="hover:text-neon-green transition-colors">
                    {post.shares} shares
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePostInteraction(post.id, 'like')}
                      className={`transition-all duration-300 ${
                        post.engagement.liked 
                          ? 'text-neon-pink glow-pink' 
                          : 'text-muted-foreground hover:text-neon-pink hover:glow-pink'
                      }`}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${post.engagement.liked ? 'fill-current' : ''}`} />
                      Like
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                      className={`text-muted-foreground hover:text-neon-cyan transition-all ${
                        isCommentsExpanded ? 'text-neon-cyan' : ''
                      }`}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Comment
                      {isCommentsExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePostInteraction(post.id, 'share')}
                      className={`transition-all duration-300 ${
                        post.engagement.shared 
                          ? 'text-neon-green glow-green' 
                          : 'text-muted-foreground hover:text-neon-green hover:glow-green'
                      }`}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePostInteraction(post.id, 'bookmark')}
                    className={`transition-all duration-300 ${
                      post.engagement.bookmarked 
                        ? 'text-neon-yellow glow-yellow' 
                        : 'text-muted-foreground hover:text-neon-yellow hover:glow-yellow'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${post.engagement.bookmarked ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                {/* Comments Section */}
                {isCommentsExpanded && (
                  <div className="mt-6 pt-6 border-t border-glass-border animate-in slide-in-from-top-2 duration-200">
                    {/* Add Comment */}
                    <div className="flex gap-3 mb-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          placeholder="Write a comment..."
                          className="flex-1 min-h-[40px] border-glass-border bg-glass text-white placeholder-muted-foreground resize-none rounded-xl"
                          rows={1}
                        />
                        <Button
                          size="sm"
                          disabled={!commentInputs[post.id]?.trim()}
                          className="self-end gradient-animated text-black"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Existing Comments */}
                    {post.comments_data && (
                      <div className="space-y-4">
                        {post.comments_data.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author.avatar} />
                              <AvatarFallback>{comment.author.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="glass rounded-xl p-3 hover:glass-strong transition-all">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-white">{comment.author.name}</span>
                                  <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                                </div>
                                <p className="text-sm text-white">{comment.content}</p>
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <button className="hover:text-neon-pink transition-colors flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {comment.likes > 0 && comment.likes}
                                </button>
                                <button className="hover:text-neon-cyan transition-colors">Reply</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Load More */}
          <div className="text-center py-8">
            <Button
              variant="outline"
              className="glass hover:glass-strong border-glass-border text-foreground hover:text-neon-cyan hover:border-neon-cyan transition-all hover:glow-cyan"
            >
              Load More Posts
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <Button
          onClick={() => setShowCreatePost(!showCreatePost)}
          size="icon"
          className="h-16 w-16 rounded-full gradient-animated shadow-2xl glow-cyan hover:glow-purple pulse-glow"
        >
          <Plus className="h-7 w-7 text-black" />
        </Button>
      </div>
    </div>
  );
}