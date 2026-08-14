import { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  User, 
  Share2, 
  Bookmark, 
  MessageCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Send,
  Lightbulb,
  TrendingUp,
  LinkedinIcon,
  Twitter,
  Mail,
  Copy,
  CheckCircle,
  Users,
  Heart
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  thumbnail?: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    bio: string;
  };
  publishDate: string;
  readTime: number;
  category: string;
  tags: string[];
  views: number;
  shares: number;
  likes: number;
}

interface BlogDetailPageProps {
  postId: string;
  onBack: () => void;
  onViewPost: (postId: string) => void;
  onShareToFeed?: (blogPost: BlogPost) => void;
}

export function BlogDetailPage({ postId, onBack, onViewPost, onShareToFeed }: BlogDetailPageProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [showAISummary, setShowAISummary] = useState(false);
  const [summaryTone, setSummaryTone] = useState('professional');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswers, setAiAnswers] = useState<Array<{ question: string; answer: string; timestamp: string }>>([]);
  const [showKeyTakeaways, setShowKeyTakeaways] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(234); // Initialize with the blogPost.likes value
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Mock blog post data
  const blogPost: BlogPost = {
    id: postId,
    title: 'The Future of AI in Career Development: Transforming How We Learn and Grow',
    content: `
      <p>Artificial Intelligence is no longer a distant future concept—it's reshaping career development in ways we never imagined. From personalized learning paths to intelligent skill assessments, AI is becoming the ultimate career companion for professionals across all industries.</p>

      <h2>The Current Landscape of AI in Career Development</h2>
      <p>Today's professionals face unprecedented challenges in career navigation. The rapid pace of technological change means that skills become obsolete faster than ever before. Traditional career counseling and development methods, while valuable, often struggle to keep pace with the dynamic nature of modern work environments.</p>

      <p>AI-powered career development platforms are emerging as game-changers, offering:</p>
      <ul>
        <li><strong>Personalized Learning Recommendations:</strong> AI analyzes your current skills, career goals, and market trends to suggest the most relevant learning opportunities.</li>
        <li><strong>Real-time Skill Gap Analysis:</strong> Advanced algorithms identify gaps between your current capabilities and market demands in real-time.</li>
        <li><strong>Intelligent Career Pathing:</strong> AI models predict multiple career trajectories based on your unique profile and preferences.</li>
        <li><strong>Automated Networking Suggestions:</strong> Smart systems recommend valuable connections based on career goals and mutual interests.</li>
      </ul>

      <h2>Revolutionary Applications Transforming Careers</h2>
      <p>The integration of AI in career development isn't just about automation—it's about creating intelligent systems that understand the nuances of human career aspirations and market realities.</p>

      <h3>1. Intelligent Resume Optimization</h3>
      <p>AI-powered tools now analyze job descriptions and automatically optimize resumes for specific roles. These systems understand context, industry terminology, and even company culture to create tailored applications that resonate with hiring managers.</p>

      <h3>2. Predictive Career Analytics</h3>
      <p>Advanced machine learning models can predict career outcomes with remarkable accuracy. By analyzing patterns from millions of career trajectories, these systems provide insights into:</p>
      <ul>
        <li>Optimal timing for career moves</li>
        <li>Skills that will become valuable in the next 2-5 years</li>
        <li>Industries with the highest growth potential for your profile</li>
        <li>Salary progression forecasts based on current trajectory</li>
      </ul>

      <h3>3. AI-Powered Interview Preparation</h3>
      <p>Virtual interview coaches powered by natural language processing provide personalized feedback on communication style, technical responses, and even body language through video analysis.</p>

      <h2>The Human-AI Partnership</h2>
      <p>Perhaps the most exciting aspect of AI in career development is its potential to enhance rather than replace human judgment. The most effective career development solutions combine AI's analytical power with human intuition and emotional intelligence.</p>

      <p>This partnership enables:</p>
      <ul>
        <li><strong>Data-Driven Decision Making:</strong> AI provides the analytical foundation while humans make the final strategic decisions.</li>
        <li><strong>Scalable Personalization:</strong> AI enables personalized career guidance at scale, while human mentors provide deep, contextual advice.</li>
        <li><strong>Continuous Learning:</strong> AI systems learn from human feedback to become more accurate and relevant over time.</li>
      </ul>

      <h2>Challenges and Considerations</h2>
      <p>While the potential is enormous, implementing AI in career development comes with important considerations:</p>

      <h3>Privacy and Data Security</h3>
      <p>Career development AI systems require access to sensitive personal and professional data. Ensuring robust privacy protections and transparent data usage policies is crucial for building trust.</p>

      <h3>Bias and Fairness</h3>
      <p>AI systems can perpetuate existing biases in hiring and career advancement. Careful algorithm design and continuous monitoring are essential to ensure fair and inclusive career recommendations.</p>

      <h3>The Risk of Over-Automation</h3>
      <p>While AI can enhance career development, there's a risk of over-relying on algorithmic recommendations at the expense of human intuition and personal agency.</p>

      <h2>Looking Ahead: The Future of AI-Powered Careers</h2>
      <p>As we look to the future, several trends are emerging that will further transform how AI supports career development:</p>

      <h3>Real-Time Market Intelligence</h3>
      <p>Future AI systems will provide real-time insights into job market trends, skill demands, and salary benchmarks, enabling professionals to make informed decisions quickly.</p>

      <h3>Integrated Learning Ecosystems</h3>
      <p>AI will orchestrate comprehensive learning ecosystems that seamlessly integrate formal education, online courses, peer learning, and practical experience.</p>

      <h3>Predictive Well-being Analytics</h3>
      <p>Advanced AI will consider not just career progression but also work-life balance, stress levels, and personal fulfillment in career recommendations.</p>

      <h2>Conclusion</h2>
      <p>The integration of AI in career development represents one of the most significant shifts in how we approach professional growth. While challenges exist, the potential benefits—personalized guidance, data-driven insights, and scalable support—make this an exciting frontier for both technology and human development.</p>

      <p>The key to success lies in thoughtful implementation that amplifies human potential rather than replacing human judgment. As AI continues to evolve, professionals who embrace these tools while maintaining their uniquely human skills will be best positioned for success in the future of work.</p>

      <p>The question isn't whether AI will transform career development—it's how quickly we can harness its power to create more fulfilling, successful, and equitable career journeys for everyone.</p>
    `,
    author: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face',
      role: 'AI Research Lead',
      bio: 'Sarah is a leading researcher in AI applications for career development with over 10 years of experience in machine learning and human resources technology.'
    },
    publishDate: '2024-01-15',
    readTime: 8,
    category: 'Technology',
    tags: ['AI', 'Career Development', 'Future of Work', 'Machine Learning', 'Professional Growth'],
    views: 2847,
    shares: 156,
    likes: 234,
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop'
  };

  // Related articles
  const relatedArticles = [
    {
      id: '2',
      title: 'Remote Work Mastery: Building a Thriving Career from Anywhere',
      excerpt: 'Learn the essential skills and strategies needed to excel in remote work environments.',
      category: 'Career Growth',
      readTime: 6,
      views: 1923
    },
    {
      id: '3',
      title: 'Data Science Career Path: From Beginner to Expert in 2024',
      excerpt: 'Complete roadmap for aspiring data scientists with essential skills and tools.',
      category: 'Career Paths',
      readTime: 12,
      views: 3241
    },
    {
      id: '4',
      title: 'Networking in the Digital Age: Building Authentic Professional Connections',
      excerpt: 'Modern networking strategies for creating genuine professional relationships.',
      category: 'Networking',
      readTime: 7,
      views: 1567
    }
  ];

  // Calculate reading progress
  useEffect(() => {
    const updateReadingProgress = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const scrollTop = window.scrollY;
        const docHeight = element.offsetHeight;
        const winHeight = window.innerHeight;
        const scrollPercent = scrollTop / (docHeight - winHeight);
        const progress = Math.min(100, Math.max(0, scrollPercent * 100));
        setReadingProgress(progress);
      }
    };

    window.addEventListener('scroll', updateReadingProgress);
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);

  // AI Summary generation
  const generateAISummary = () => {
    setShowAISummary(true);
    // Simulate AI processing
    setTimeout(() => {
      // Summary would be generated based on tone
    }, 1000);
  };

  // AI Q&A handler
  const handleAIQuestion = () => {
    if (!aiQuestion.trim()) return;

    const answer = generateAIAnswer(aiQuestion);
    setAiAnswers(prev => [...prev, {
      question: aiQuestion,
      answer,
      timestamp: new Date().toLocaleTimeString()
    }]);
    setAiQuestion('');
  };

  const generateAIAnswer = (question: string): string => {
    // Mock AI answers based on the question
    const responses = {
      'skills': 'Based on the article, the most important skills for AI-powered career development include data analysis, machine learning fundamentals, human-centered design thinking, and the ability to interpret AI recommendations while maintaining human judgment.',
      'implementation': 'Organizations can start implementing AI in career development by beginning with pilot programs focused on resume optimization and skill gap analysis, ensuring proper data privacy measures, and gradually expanding to more complex applications like predictive analytics.',
      'challenges': 'The main challenges include ensuring data privacy and security, addressing algorithmic bias, maintaining the human element in career decisions, and avoiding over-automation that might reduce personal agency in career choices.',
      'future': 'The future of AI in career development will likely include real-time market intelligence, integrated learning ecosystems, predictive well-being analytics, and more sophisticated human-AI collaboration models.',
      'default': 'Based on the article content, AI in career development offers personalized learning recommendations, real-time skill gap analysis, intelligent career pathing, and automated networking suggestions while emphasizing the importance of human-AI partnership.'
    };

    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('skill')) return responses.skills;
    if (lowerQuestion.includes('implement') || lowerQuestion.includes('start')) return responses.implementation;
    if (lowerQuestion.includes('challenge') || lowerQuestion.includes('problem')) return responses.challenges;
    if (lowerQuestion.includes('future') || lowerQuestion.includes('trend')) return responses.future;
    return responses.default;
  };

  // Key takeaways
  const keyTakeaways = [
    'AI is transforming career development through personalized learning, skill gap analysis, and intelligent career pathing.',
    'The most effective solutions combine AI\'s analytical power with human intuition and emotional intelligence.',
    'Key applications include resume optimization, predictive career analytics, and AI-powered interview preparation.',
    'Important considerations include data privacy, algorithmic bias, and maintaining human agency in career decisions.',
    'Future trends point toward real-time market intelligence and integrated learning ecosystems.'
  ];

  // Share handlers
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blogPost.title;
    
    switch (platform) {
      case 'qelsa-feed':
        if (onShareToFeed) {
          onShareToFeed(blogPost);
          toast.success('Shared to your Qelsa feed!');
        }
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this article: ${url}`)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
        break;
    }
    setShareMenuOpen(false);
  };

  const getSummaryByTone = () => {
    const summaries = {
      professional: 'This article provides a comprehensive analysis of AI\'s transformative impact on career development, examining current applications, emerging trends, and implementation challenges while emphasizing the importance of human-AI collaboration in professional growth.',
      casual: 'AI is totally changing how we think about careers! From smart resume tips to predicting what skills you\'ll need next, this piece breaks down how AI can be your ultimate career buddy while keeping the human touch that matters.',
      tldr: 'Key points: AI personalizes career development through smart recommendations and skill analysis. Best results come from human-AI partnership. Watch out for privacy and bias issues. Future = real-time market insights + integrated learning.'
    };
    return summaries[summaryTone as keyof typeof summaries] || summaries.professional;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readingProgress} className="h-1 bg-background border-none" />
      </div>

      {/* Header */}
      <div className="glass-strong border-b border-glass-border sticky top-1 z-40 mt-1">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="hover:bg-glass-bg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newLikedState = !isLiked;
                    setIsLiked(newLikedState);
                    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
                    toast(newLikedState ? 'Blog liked!' : 'Blog unliked');
                  }}
                  className={`transition-colors duration-200 ${isLiked ? 'text-neon-pink hover:text-neon-pink/80' : 'hover:text-neon-pink'}`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                {likeCount > 0 && (
                  <span className="text-sm text-muted-foreground">{likeCount}</span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={isBookmarked ? 'text-neon-yellow' : ''}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                
                {shareMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass-strong rounded-lg border border-glass-border p-2 z-50">
                    <div className="space-y-1">
                      {onShareToFeed && (
                        <>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-neon-cyan hover:bg-neon-cyan/10" onClick={() => handleShare('qelsa-feed')}>
                            <Users className="w-4 h-4 mr-2" />
                            Share to Feed
                          </Button>
                          <div className="h-px bg-glass-border my-2" />
                        </>
                      )}
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleShare('linkedin')}>
                        <LinkedinIcon className="w-4 h-4 mr-2" />
                        LinkedIn
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleShare('twitter')}>
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleShare('email')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleShare('copy')}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10">
              {blogPost.category}
            </Badge>
            <div className="flex flex-wrap gap-2">
              {blogPost.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
            {blogPost.title}
          </h1>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blogPost.author.avatar}
                alt={blogPost.author.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold">{blogPost.author.name}</p>
                <p className="text-sm text-muted-foreground">{blogPost.author.role}</p>
              </div>
            </div>
            
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" />
                {new Date(blogPost.publishDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {blogPost.readTime} min read
              </div>
            </div>
          </div>
        </header>

        {/* Blog Thumbnail */}
        {blogPost.thumbnail && (
          <div className="mb-8">

          </div>
        )}

        {/* AI Features Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* AI Summary */}
          <Card className="glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-neon-purple" />
              <span className="font-semibold text-sm">AI Summary</span>
            </div>
            <Select value={summaryTone} onValueChange={setSummaryTone}>
              <SelectTrigger className="w-full mb-3 bg-glass-bg border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="tldr">TL;DR</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateAISummary}
              className="w-full border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10"
            >
              Generate Summary
            </Button>
          </Card>

          {/* Key Takeaways */}
          <Card className="glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-neon-yellow" />
              <span className="font-semibold text-sm">Key Takeaways</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              AI-extracted insights from this article
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowKeyTakeaways(!showKeyTakeaways)}
              className="w-full border-neon-yellow/30 text-neon-yellow hover:bg-neon-yellow/10"
            >
              {showKeyTakeaways ? 'Hide' : 'Show'} Takeaways
            </Button>
          </Card>

          {/* Article Stats */}
          <Card className="glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-neon-green" />
              <span className="font-semibold text-sm">Article Stats</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Views:</span>
                <span>{blogPost.views.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares:</span>
                <span>{blogPost.shares}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Likes:</span>
                <span>{blogPost.likes}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Summary Display */}
        {showAISummary && (
          <Card className="glass p-6 mb-8 border border-neon-purple/20">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-neon-purple" />
              <span className="font-semibold">AI Summary ({summaryTone})</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {getSummaryByTone()}
            </p>
          </Card>
        )}

        {/* Key Takeaways Display */}
        {showKeyTakeaways && (
          <Card className="glass p-6 mb-8 border border-neon-yellow/20">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-neon-yellow" />
              <span className="font-semibold">Key Takeaways</span>
            </div>
            <ul className="space-y-3">
              {keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{takeaway}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Article Content */}
        <article ref={contentRef} className="prose prose-invert max-w-none mb-12">
          <div dangerouslySetInnerHTML={{ __html: blogPost.content }} />
        </article>

        {/* AI Q&A Section */}
        <Card className="glass p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="w-5 h-5 text-neon-cyan" />
            <span className="font-semibold">Ask AI about this article</span>
          </div>
          
          <div className="flex gap-3 mb-6">
            <Input
              placeholder="Ask any question about the article content..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAIQuestion()}
              className="flex-1 bg-glass-bg border-glass-border"
            />
            <Button onClick={handleAIQuestion} className="bg-neon-cyan text-black hover:bg-neon-cyan/90">
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {aiAnswers.length > 0 && (
            <div className="space-y-4">
              {aiAnswers.map((qa, index) => (
                <div key={index} className="border-l-2 border-neon-cyan/30 pl-4">
                  <p className="font-medium text-sm mb-2 text-neon-cyan">Q: {qa.question}</p>
                  <p className="text-muted-foreground text-sm mb-1">A: {qa.answer}</p>
                  <span className="text-xs text-muted-foreground">{qa.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Author Bio */}
        <Card className="glass p-6 mb-8">
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blogPost.author.avatar}
              alt={blogPost.author.name}
              className="w-16 h-16 rounded-full"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{blogPost.author.name}</h3>
              <p className="text-neon-cyan text-sm mb-3">{blogPost.author.role}</p>
              <p className="text-muted-foreground text-sm">{blogPost.author.bio}</p>
            </div>
          </div>
        </Card>

        {/* Related Articles */}
        <div>
          <h3 className="text-xl font-semibold mb-6">Related Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
              <Card
                key={article.id}
                className="glass hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:glow-cyan"
                onClick={() => onViewPost(article.id)}
              >
                <div className="p-6">
                  <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10 mb-3">
                    {article.category}
                  </Badge>
                  <h4 className="font-semibold mb-3 line-clamp-2 group-hover:text-neon-cyan transition-colors">
                    {article.title}
                  </h4>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {article.readTime} min read
                    </div>
                    <span>{article.views.toLocaleString()} views</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}