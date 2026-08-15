import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Play, Clock, Users, Star, Brain, Sparkles, ChevronRight, Award, Target, Zap, GraduationCap, TrendingUp, MessageCircle, ExternalLink, CheckCircle, Eye, Heart, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Course {
  id: string;
  title: string;
  description: string;
  aiSummary: string;
  platform: 'Coursera' | 'Udemy' | 'YouTube' | 'Qelsa';
  type: 'course' | 'video';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  thumbnail: string;
  rating: number;
  learners: number;
  instructor: string;
  skills: string[];
  price: 'Free' | 'Paid';
  category: string;
  certification: boolean;
  modules?: number;
  isRecommended?: boolean;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  duration: string;
  courses: Course[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  skills: string[];
}

interface CoursesPageProps {
  onNavigate?: (section: string) => void;
}

export function CoursesPage({ onNavigate }: CoursesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    platform: 'all',
    difficulty: 'all',
    duration: 'all',
    type: 'all',
    price: 'all'
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiChatCourse, setAiChatCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('discover');

  // Mock course data
  const courses: Course[] = [
    {
      id: '1',
      title: 'Complete Python Bootcamp: From Zero to Hero',
      description: 'Learn Python programming from scratch with hands-on projects and real-world applications.',
      aiSummary: 'Master Python fundamentals, data structures, and object-oriented programming. Perfect for beginners looking to break into tech.',
      platform: 'Udemy',
      type: 'course',
      difficulty: 'Beginner',
      duration: '22 hours',
      thumbnail: 'python-course',
      rating: 4.8,
      learners: 850000,
      instructor: 'Jose Portilla',
      skills: ['Python', 'Programming', 'Data Analysis', 'Web Development'],
      price: 'Paid',
      category: 'Programming',
      certification: true,
      modules: 24,
      isRecommended: true
    },
    {
      id: '2',
      title: 'Machine Learning Specialization',
      description: 'Build ML models with NumPy & scikit-learn, build & train supervised models for classification & regression.',
      aiSummary: 'Comprehensive introduction to machine learning by Andrew Ng. Covers supervised learning, neural networks, and practical applications.',
      platform: 'Coursera',
      type: 'course',
      difficulty: 'Intermediate',
      duration: '3 months',
      thumbnail: 'ml-course',
      rating: 4.9,
      learners: 120000,
      instructor: 'Andrew Ng',
      skills: ['Machine Learning', 'Python', 'TensorFlow', 'Neural Networks'],
      price: 'Paid',
      category: 'AI/ML',
      certification: true,
      modules: 11,
      isRecommended: true
    },
    {
      id: '3',
      title: 'React JS Tutorial for Beginners',
      description: 'Learn React from scratch with this comprehensive tutorial covering components, hooks, and state management.',
      aiSummary: 'Quick start guide to React development. Covers modern React patterns including hooks and functional components.',
      platform: 'YouTube',
      type: 'video',
      difficulty: 'Beginner',
      duration: '3.5 hours',
      thumbnail: 'react-tutorial',
      rating: 4.6,
      learners: 450000,
      instructor: 'Mosh Hamedani',
      skills: ['React', 'JavaScript', 'Frontend Development', 'Web Development'],
      price: 'Free',
      category: 'Web Development',
      certification: false
    },
    {
      id: '4',
      title: 'Data Science Career Accelerator',
      description: 'Qelsa\'s exclusive program combining technical skills with career guidance for data science roles.',
      aiSummary: 'AI-powered learning path with personalized mentorship, real projects, and direct connections to hiring partners.',
      platform: 'Qelsa',
      type: 'course',
      difficulty: 'Intermediate',
      duration: '6 months',
      thumbnail: 'data-science-qelsa',
      rating: 4.9,
      learners: 12000,
      instructor: 'Qelsa AI Team',
      skills: ['Data Science', 'Python', 'SQL', 'Machine Learning', 'Career Development'],
      price: 'Paid',
      category: 'Data Science',
      certification: true,
      modules: 18,
      isRecommended: true
    },
    {
      id: '5',
      title: 'UI/UX Design Fundamentals',
      description: 'Learn the principles of user interface and user experience design with hands-on projects.',
      aiSummary: 'Master design thinking, wireframing, and prototyping. Includes real-world case studies and portfolio projects.',
      platform: 'Coursera',
      type: 'course',
      difficulty: 'Beginner',
      duration: '2 months',
      thumbnail: 'ux-design',
      rating: 4.7,
      learners: 85000,
      instructor: 'Google',
      skills: ['UI Design', 'UX Design', 'Figma', 'Prototyping', 'User Research'],
      price: 'Paid',
      category: 'Design',
      certification: true,
      modules: 8
    },
    {
      id: '6',
      title: 'SQL for Data Analysis',
      description: 'Master SQL queries, joins, and advanced analytics functions for data analysis.',
      aiSummary: 'Essential SQL skills for data professionals. Covers advanced querying techniques and database optimization.',
      platform: 'Udemy',
      type: 'course',
      difficulty: 'Intermediate',
      duration: '12 hours',
      thumbnail: 'sql-course',
      rating: 4.8,
      learners: 200000,
      instructor: 'Jose Portilla',
      skills: ['SQL', 'Database Management', 'Data Analysis', 'PostgreSQL'],
      price: 'Paid',
      category: 'Data Analysis',
      certification: true,
      modules: 15
    }
  ];

  // Mock learning paths
  const learningPaths: LearningPath[] = [
    {
      id: '1',
      title: 'Data Analyst in 3 Months',
      description: 'Complete roadmap from beginner to job-ready data analyst with personalized AI guidance.',
      duration: '3 months',
      difficulty: 'Beginner',
      skills: ['Python', 'SQL', 'Excel', 'Tableau', 'Statistics'],
      courses: [courses[0], courses[5], courses[3]]
    },
    {
      id: '2',
      title: 'From Beginner to AI Engineer',
      description: 'Comprehensive path covering programming fundamentals to advanced machine learning.',
      duration: '6 months',
      difficulty: 'Beginner',
      skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'MLOps'],
      courses: [courses[0], courses[1], courses[3]]
    },
    {
      id: '3',
      title: 'Full-Stack Developer Journey',
      description: 'Master both frontend and backend development with modern technologies.',
      duration: '4 months',
      difficulty: 'Intermediate',
      skills: ['React', 'Node.js', 'Database Design', 'APIs', 'Deployment'],
      courses: [courses[2], courses[0]]
    }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPlatform = selectedFilters.platform === 'all' || course.platform === selectedFilters.platform;
    const matchesDifficulty = selectedFilters.difficulty === 'all' || course.difficulty === selectedFilters.difficulty;
    const matchesType = selectedFilters.type === 'all' || course.type === selectedFilters.type;
    const matchesPrice = selectedFilters.price === 'all' || course.price === selectedFilters.price;
    
    return matchesSearch && matchesPlatform && matchesDifficulty && matchesType && matchesPrice;
  });

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
  };

  const handleAIChatClick = (course: Course) => {
    setAiChatCourse(course);
    setShowAIChat(true);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Qelsa': return 'text-neon-cyan border-neon-cyan/30 bg-neon-cyan/10';
      case 'Coursera': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'Udemy': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'YouTube': return 'text-red-400 border-red-400/30 bg-red-400/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-400/10';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'course' 
      ? 'text-neon-green border-neon-green/30 bg-neon-green/10'
      : 'text-neon-yellow border-neon-yellow/30 bg-neon-yellow/10';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-neon-purple" />
              <h1 className="text-2xl font-bold text-white">Courses</h1>
              <Badge className="glass border-neon-purple/30 text-neon-purple">AI-Powered</Badge>
            </div>
            <Button
              variant="ghost"
              className="glass hover:glass-strong border-neon-cyan/30 text-neon-cyan hover:text-neon-cyan"
              onClick={() => setShowAIChat(true)}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* AI-Enhanced Search */}
        <Card className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-neon-cyan" />
              <h3 className="text-lg font-semibold text-white">Smart Course Discovery</h3>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses or try: 'Show me beginner-friendly AI courses for finance professionals'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass bg-input-background border-glass-border text-white placeholder:text-muted-foreground"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Select value={selectedFilters.platform} onValueChange={(value) => setSelectedFilters({...selectedFilters, platform: value})}>
                <SelectTrigger className="glass bg-input-background border-glass-border text-white">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-glass-border">
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="Qelsa">Qelsa</SelectItem>
                  <SelectItem value="Coursera">Coursera</SelectItem>
                  <SelectItem value="Udemy">Udemy</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFilters.difficulty} onValueChange={(value) => setSelectedFilters({...selectedFilters, difficulty: value})}>
                <SelectTrigger className="glass bg-input-background border-glass-border text-white">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-glass-border">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFilters.type} onValueChange={(value) => setSelectedFilters({...selectedFilters, type: value})}>
                <SelectTrigger className="glass bg-input-background border-glass-border text-white">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-glass-border">
                  <SelectItem value="all">All Formats</SelectItem>
                  <SelectItem value="course">Full Courses</SelectItem>
                  <SelectItem value="video">Video Resources</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedFilters.price} onValueChange={(value) => setSelectedFilters({...selectedFilters, price: value})}>
                <SelectTrigger className="glass bg-input-background border-glass-border text-white">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent className="glass-strong border-glass-border">
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className="glass hover:glass-strong border-neon-purple/30 text-neon-purple hover:text-neon-purple"
                onClick={() => setSelectedFilters({platform: 'all', difficulty: 'all', duration: 'all', type: 'all', price: 'all'})}
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass border-glass-border">
            <TabsTrigger value="discover" className="data-[state=active]:glass-strong data-[state=active]:text-neon-cyan">
              <BookOpen className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="paths" className="data-[state=active]:glass-strong data-[state=active]:text-neon-purple">
              <Target className="h-4 w-4 mr-2" />
              Learning Paths
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Personalization Nudges */}
            <Card className="glass hover:glass-strong p-4 rounded-xl border border-glass-border">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-neon-cyan mt-1" />
                <div>
                  <p className="text-white">
                    <span className="text-neon-cyan">AI Insight:</span> Since you&apos;re exploring Product Management, here are GenAI-specific PM courses that align with your profile.
                  </p>
                </div>
              </div>
            </Card>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card 
                  key={course.id} 
                  className={`group cursor-pointer transition-all duration-300 rounded-2xl border border-glass-border overflow-hidden flex flex-col h-full ${
                    course.type === 'course' 
                      ? 'glass hover:glass-strong hover:glow-cyan' 
                      : 'glass hover:glass-strong hover:glow-yellow'
                  }`}
                  onClick={() => handleCourseClick(course)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop`}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {/* Type indicator overlay */}
                    {course.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-12 w-12 text-white opacity-80" />
                      </div>
                    )}
                    
                    {/* Recommended badge */}
                    {course.isRecommended && (
                      <Badge className="absolute top-3 left-3 bg-neon-cyan text-black border-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Recommended
                      </Badge>
                    )}
                    
                    {/* Platform badge */}
                    <Badge className={`absolute top-3 right-3 border ${getPlatformColor(course.platform)}`}>
                      {course.platform}
                    </Badge>
                  </div>

                  <div className="p-6 space-y-4 flex flex-col flex-grow">
                    {/* Title and Description */}
                    <div>
                      <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-neon-cyan transition-colors">
                        {course.title}
                      </h3>
                    </div>

                    {/* Qelsa Course Creator */}
                    {course.platform === 'Qelsa' && (
                      <div className="flex items-center gap-3 p-3 glass rounded-lg border border-glass-border">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`} />
                          <AvatarFallback className="bg-neon-cyan text-black">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white font-medium">{course.instructor}</p>
                            <Badge className="text-xs border border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10">
                              Creator
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Course created by community member</p>
                        </div>
                      </div>
                    )}

                    {/* AI Summary */}
                    <div className="p-3 glass rounded-lg border border-glass-border">
                      <div className="flex items-start gap-2">
                        <Brain className="h-4 w-4 text-neon-cyan mt-0.5" />
                        <p className="text-xs text-foreground">
                          <span className="text-neon-cyan font-medium">AI Summary:</span> {course.aiSummary}
                        </p>
                      </div>
                    </div>

                    {/* Course Details */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        {course.platform === 'YouTube' ? (
                          <>
                            <Eye className="h-4 w-4" />
                            {/* {course.learners.toLocaleString()} views */}
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4" />
                            {/* {course.learners.toLocaleString()} */}
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {course.platform === 'YouTube' ? (
                          <>
                            <Heart className="h-4 w-4 fill-current text-red-400" />
                            {(course.rating * 10000).toLocaleString()}
                          </>
                        ) : (
                          <>
                            <Star className="h-4 w-4 fill-current text-yellow-400" />
                            {course.rating}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Type and Difficulty */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={`border ${getTypeColor(course.type)}`}>
                          {course.type === 'course' ? (
                            <>
                              <BookOpen className="h-3 w-3 mr-1" />
                              Full Course
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Video Resource
                            </>
                          )}
                        </Badge>
                        {course.certification && (
                          <Badge className="border border-neon-green/30 text-neon-green bg-neon-green/10">
                            <Award className="h-3 w-3 mr-1" />
                            Certificate
                          </Badge>
                        )}
                      </div>
                      <Badge variant={course.difficulty === 'Beginner' ? 'secondary' : course.difficulty === 'Intermediate' ? 'outline' : 'destructive'}>
                        {course.difficulty}
                      </Badge>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1">
                      {course.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs border-glass-border text-muted-foreground">
                          {skill}
                        </Badge>
                      ))}
                      {course.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs border-glass-border text-muted-foreground">
                          +{course.skills.length - 3} more
                        </Badge>
                      )}
                    </div>


                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="paths" className="space-y-6">
            {/* AI-Generated Learning Paths */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-6 w-6 text-neon-purple" />
                <h2 className="text-xl font-semibold text-white">AI-Curated Learning Paths</h2>
                <Badge className="glass border-neon-purple/30 text-neon-purple">Personalized</Badge>
              </div>

              {learningPaths.map((path) => (
                <Card key={path.id} className="glass hover:glass-strong p-6 rounded-2xl border border-glass-border">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">{path.title}</h3>
                        <p className="text-muted-foreground">{path.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{path.duration}</span>
                          <Badge variant="outline">{path.difficulty}</Badge>
                          <span>{path.courses.length} courses</span>
                        </div>
                      </div>
                      <Button className="glass hover:glass-strong border-neon-purple/30 text-neon-purple hover:text-neon-purple">
                        Start Learning
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2">
                      {path.skills.map((skill) => (
                        <Badge key={skill} className="glass border-neon-cyan/30 text-neon-cyan">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <Separator className="bg-glass-border" />

                    {/* Course Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {path.courses.slice(0, 3).map((course, index) => (
                        <div key={course.id} className="flex items-center gap-3 p-3 glass rounded-lg">
                          <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                            <span className="text-xs text-neon-cyan font-medium">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium line-clamp-1">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.platform} • {course.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Details Dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="glass-strong max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedCourse?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="space-y-6">
              {/* Course details content would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=300&fit=crop"
                      alt={selectedCourse.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-white">Course Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="text-white ml-2">{selectedCourse.duration}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Difficulty:</span>
                        <span className="text-white ml-2">{selectedCourse.difficulty}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Instructor:</span>
                        <span className="text-white ml-2">{selectedCourse.instructor}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Platform:</span>
                        <span className="text-white ml-2">{selectedCourse.platform}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2">Skills You&apos;ll Learn</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourse.skills.map((skill) => (
                        <Badge key={skill} className="glass border-neon-cyan/30 text-neon-cyan">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 glass rounded-lg">
                    <div className="flex items-start gap-2">
                      <Brain className="h-5 w-5 text-neon-cyan mt-0.5" />
                      <div>
                        <h4 className="font-medium text-neon-cyan mb-1">AI Summary</h4>
                        <p className="text-sm text-foreground">{selectedCourse.aiSummary}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1 bg-neon-cyan text-black hover:bg-neon-cyan/90">
                      Enroll Now
                    </Button>
                    <Button variant="outline" className="glass border-neon-purple/30 text-neon-purple">
                      Add to Wishlist
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chat Dialog */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="glass-strong max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-neon-cyan" />
              AI Course Assistant
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Get personalized guidance and insights about your learning journey.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 glass rounded-lg">
              <p className="text-sm text-foreground">
                Hi! I&apos;m your AI learning assistant. I can help you with course recommendations, 
                learning paths, and answer questions about any course. What would you like to know?
              </p>
            </div>
            
            {aiChatCourse && (
              <div className="p-4 glass rounded-lg border border-neon-cyan/30">
                <p className="text-sm text-neon-cyan mb-2">Currently discussing:</p>
                <p className="text-white font-medium">{aiChatCourse.title}</p>
              </div>
            )}

            <div className="space-y-2">
              <Input
                placeholder="Ask me anything about courses or learning paths..."
                className="glass bg-input-background border-glass-border text-white placeholder:text-muted-foreground"
              />
              <Button className="w-full bg-neon-cyan text-black hover:bg-neon-cyan/90">
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}