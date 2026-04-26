import { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Send, 
  Sparkles, 
  Image, 
  Video, 
  Link, 
  Bold, 
  Italic, 
  List, 
  Quote, 
  Code,
  Type,
  Hash,
  FileText,
  Eye,
  Wand2,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  Lightbulb,
  Target,
  BookOpen,
  Share2,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

interface BlogEditorProps {
  initialData?: {
    id?: string;
    title?: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    category?: string;
    isDraft?: boolean;
    thumbnail?: string;
  };
  onSave?: (blogData: any) => void;
  onPublish?: (blogData: any) => void;
  onCancel?: () => void;
}

interface AIAssistanceState {
  isGenerating: boolean;
  suggestions: string[];
  currentTone: 'professional' | 'casual' | 'storytelling' | 'persuasive';
}

const toneOptions = [
  { value: 'professional', label: 'Professional', desc: 'Formal and business-appropriate' },
  { value: 'casual', label: 'Casual', desc: 'Friendly and conversational' },
  { value: 'storytelling', label: 'Storytelling', desc: 'Narrative and engaging' },
  { value: 'persuasive', label: 'Persuasive', desc: 'Compelling and action-oriented' }
];

const categoryOptions = [
  'Career Development',
  'Technology & Innovation',
  'Leadership & Management',
  'Industry Insights',
  'Professional Growth',
  'Workplace Culture',
  'Skills & Learning',
  'Entrepreneurship',
  'Networking',
  'Job Search Tips'
];

export function BlogEditor({ initialData, onSave, onPublish, onCancel }: BlogEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [category, setCategory] = useState(initialData?.category || categoryOptions[0]);
  const [metaDescription, setMetaDescription] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isDraft, setIsDraft] = useState(initialData?.isDraft ?? true);
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || '');
  const [showThumbnailOptions, setShowThumbnailOptions] = useState(false);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  
  // AI Assistance States
  const [aiAssistance, setAiAssistance] = useState<AIAssistanceState>({
    isGenerating: false,
    suggestions: [],
    currentTone: 'professional'
  });
  
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [contentSuggestions, setContentSuggestions] = useState<string[]>([]);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [moderationStatus, setModerationStatus] = useState<'checking' | 'approved' | 'flagged' | null>(null);
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);

  // Calculate word count and read time
  useEffect(() => {
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    setWordCount(words);
    setReadTime(Math.ceil(words / 200)); // Average reading speed: 200 words per minute
  }, [content]);

  // Simulate AI content moderation
  useEffect(() => {
    if (content.length > 100) {
      setModerationStatus('checking');
      const timer = setTimeout(() => {
        // Simple content check - in real app, this would be an AI API call
        const flaggedWords = ['inappropriate', 'harmful', 'spam'];
        const hasFlaggedContent = flaggedWords.some(word => 
          content.toLowerCase().includes(word)
        );
        setModerationStatus(hasFlaggedContent ? 'flagged' : 'approved');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content]);

  // AI Title Generator
  const generateTitles = async () => {
    setAiAssistance(prev => ({ ...prev, isGenerating: true }));
    
    // Simulate AI API call
    setTimeout(() => {
      const sampleTitles = [
        `${wordCount > 500 ? 'The Complete Guide to' : 'Essential Tips for'} ${category}`,
        `How AI is Transforming ${category}: A Professional's Perspective`,
        `5 Key Strategies Every Professional Should Know About ${category}`,
        `Breaking Down ${category}: What You Need to Know in 2024`,
        `From Beginner to Expert: Your ${category} Journey`
      ];
      
      setTitleSuggestions(sampleTitles);
      setAiAssistance(prev => ({ ...prev, isGenerating: false }));
      toast.success('AI title suggestions generated!');
    }, 1500);
  };

  // AI Tag Generator
  const generateTags = async () => {
    setAiAssistance(prev => ({ ...prev, isGenerating: true }));
    
    setTimeout(() => {
      const baseTags = ['career-development', 'professional-growth', 'skills', 'workplace'];
      const categoryTags = category.toLowerCase().split(' ').map(word => word.replace(/[^a-z]/g, ''));
      const contentTags = content.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 5)
        .slice(0, 3)
        .map(word => word.replace(/[^a-z]/g, ''));
      
      const suggestions = [...baseTags, ...categoryTags, ...contentTags]
        .filter((tag, index, self) => self.indexOf(tag) === index)
        .slice(0, 8);
      
      setTagSuggestions(suggestions);
      setAiAssistance(prev => ({ ...prev, isGenerating: false }));
      toast.success('AI tag suggestions generated!');
    }, 1000);
  };

  // AI Content Refinement
  const refineContent = async (tone: string) => {
    setAiAssistance(prev => ({ ...prev, isGenerating: true, currentTone: tone as any }));
    
    setTimeout(() => {
      let refinedContent = content;
      
      switch (tone) {
        case 'professional':
          refinedContent = content.replace(/\b(really|very|pretty)\b/gi, '').replace(/!/g, '.');
          break;
        case 'casual':
          refinedContent = content.replace(/\b(therefore|consequently|furthermore)\b/gi, 'so');
          break;
        case 'storytelling':
          refinedContent = content.replace(/^/gm, 'Picture this: ').substring(14);
          break;
        case 'persuasive':
          refinedContent = content.replace(/\./g, ' - and here\'s why this matters.');
          break;
      }
      
      setContentSuggestions([refinedContent]);
      setAiAssistance(prev => ({ ...prev, isGenerating: false }));
      toast.success(`Content refined in ${tone} tone!`);
    }, 2000);
  };

  // AI Summary Generator
  const generateSummary = async () => {
    setAiAssistance(prev => ({ ...prev, isGenerating: true }));
    
    setTimeout(() => {
      const summary = `This ${category.toLowerCase()} article explores key concepts and practical insights. With ${wordCount} words, it provides comprehensive coverage of the topic while maintaining professional clarity. Estimated reading time: ${readTime} minutes.`;
      const takeaways = [
        `Understanding the fundamentals of ${category.toLowerCase()}`,
        'Practical strategies for immediate implementation',
        'Expert insights from industry professionals',
        'Future trends and emerging opportunities',
        'Actionable next steps for continued growth'
      ].slice(0, Math.min(5, Math.ceil(wordCount / 200)));
      
      setAiSummary(summary);
      setKeyTakeaways(takeaways);
      setAiAssistance(prev => ({ ...prev, isGenerating: false }));
      toast.success('AI summary and key takeaways generated!');
    }, 1500);
  };

  // AI Meta Description Generator
  const generateMetaDescription = async () => {
    setAiAssistance(prev => ({ ...prev, isGenerating: true }));
    
    setTimeout(() => {
      const description = `Discover essential insights about ${category.toLowerCase()}. Learn from expert perspectives and practical strategies. ${readTime}-minute read.`.substring(0, 160);
      setMetaDescription(description);
      setAiAssistance(prev => ({ ...prev, isGenerating: false }));
      toast.success('Meta description generated!');
    }, 1000);
  };

  // AI Thumbnail Generator using Unsplash
  const generateAIThumbnail = async () => {
    setIsGeneratingThumbnail(true);
    
    try {
      // Create search query based on blog category and content
      let searchQuery = 'modern workplace professional';
      
      if (category.toLowerCase().includes('technology')) {
        searchQuery = 'technology workspace modern';
      } else if (category.toLowerCase().includes('career')) {
        searchQuery = 'professional development office';
      } else if (category.toLowerCase().includes('leadership')) {
        searchQuery = 'business leadership meeting';
      } else if (category.toLowerCase().includes('network')) {
        searchQuery = 'professional networking handshake';
      } else if (title) {
        // Use first few words of title for more relevant results
        const titleWords = title.toLowerCase().split(' ').slice(0, 3);
        if (titleWords.some(word => ['ai', 'artificial', 'intelligence', 'tech'].includes(word))) {
          searchQuery = 'artificial intelligence technology';
        } else if (titleWords.some(word => ['remote', 'work', 'home'].includes(word))) {
          searchQuery = 'remote work laptop';
        } else if (titleWords.some(word => ['data', 'science', 'analytics'].includes(word))) {
          searchQuery = 'data analytics dashboard';
        }
      }
      
      // Use a predefined set of high-quality professional images as fallback
      const fallbackImages = [
        'https://images.unsplash.com/photo-1549399905-5d1bad747576?w=800&h=400&fit=crop', // Modern workspace
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop', // Technology
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop', // Professional
        'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop', // Business meeting
        'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=400&fit=crop'  // Networking
      ];
      
      // Select a random fallback image
      const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      setThumbnail(randomImage);
      
      setIsGeneratingThumbnail(false);
      toast.success('AI thumbnail generated!');
    } catch (error) {
      // Fallback to default image
      setThumbnail('https://images.unsplash.com/photo-1549399905-5d1bad747576?w=800&h=400&fit=crop');
      setIsGeneratingThumbnail(false);
      toast.success('AI thumbnail generated!');
    }
  };

  // Handle custom thumbnail URL
  const handleCustomThumbnail = (url: string) => {
    setThumbnail(url);
    setShowThumbnailOptions(false);
    toast.success('Thumbnail updated!');
  };

  // Content expansion/shortening
  const adjustContent = (action: 'expand' | 'shorten') => {
    if (!selectedText) {
      toast.error('Please select text to modify');
      return;
    }
    
    setAiAssistance(prev => ({ ...prev, isGenerating: true }));
    
    setTimeout(() => {
      let newContent = content;
      if (action === 'expand') {
        newContent = content.replace(selectedText, selectedText + ' This concept deserves deeper exploration, as it encompasses multiple facets that professionals should consider.');
      } else {
        newContent = content.replace(selectedText, selectedText.split('.')[0] + '.');
      }
      setContent(newContent);
      setAiAssistance(prev => ({ ...prev, isGenerating: false }));
      toast.success(`Content ${action}ed successfully!`);
    }, 1000);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString());
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const applyTitleSuggestion = (suggestion: string) => {
    setTitle(suggestion);
    setTitleSuggestions([]);
    toast.success('Title applied!');
  };

  const applyTagSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      setTags([...tags, suggestion]);
      toast.success('Tag added!');
    }
  };

  const applyContentSuggestion = (suggestion: string) => {
    setContent(suggestion);
    setContentSuggestions([]);
    toast.success('Content applied!');
  };

  const handleSave = () => {
    const blogData = {
      id: initialData?.id,
      title,
      content,
      excerpt,
      tags,
      category,
      metaDescription,
      thumbnail,
      isDraft: true,
      wordCount,
      readTime,
      aiSummary,
      keyTakeaways,
      moderationStatus,
      updatedAt: new Date().toISOString()
    };
    
    onSave?.(blogData);
    toast.success('Blog saved as draft!');
  };

  const handlePublish = () => {
    if (!title || !content) {
      toast.error('Please provide title and content before publishing');
      return;
    }
    
    if (moderationStatus === 'flagged') {
      toast.error('Content needs review before publishing');
      return;
    }
    
    const blogData = {
      id: initialData?.id,
      title,
      content,
      excerpt,
      tags,
      category,
      metaDescription,
      thumbnail,
      isDraft: false,
      wordCount,
      readTime,
      aiSummary,
      keyTakeaways,
      moderationStatus,
      publishedAt: new Date().toISOString()
    };
    
    onPublish?.(blogData);
    toast.success('Blog published successfully!');
  };

  const insertFormatting = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'heading':
        formattedText = `## ${selectedText}`;
        break;
      case 'list':
        formattedText = `- ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-strong border-b border-glass-border backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
                Blog Editor
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{wordCount} words • {readTime} min read</span>
                {moderationStatus && (
                  <div className="flex items-center gap-1">
                    {moderationStatus === 'checking' && (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin text-neon-yellow" />
                        <span className="text-neon-yellow">Checking...</span>
                      </>
                    )}
                    {moderationStatus === 'approved' && (
                      <>
                        <CheckCircle className="h-3 w-3 text-neon-green" />
                        <span className="text-neon-green">Approved</span>
                      </>
                    )}
                    {moderationStatus === 'flagged' && (
                      <>
                        <AlertTriangle className="h-3 w-3 text-neon-pink" />
                        <span className="text-neon-pink">Needs Review</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`border-neon-purple/30 ${showAIPanel ? 'bg-neon-purple/10 text-neon-purple' : 'text-neon-purple hover:bg-neon-purple/10'}`}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              
              <Button
                onClick={handlePublish}
                disabled={!title || !content || moderationStatus === 'flagged'}
                className="gradient-animated text-black font-medium"
              >
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
              
              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  className="text-muted-foreground hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title */}
            <Card className="glass border-glass-border p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Blog Title</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateTitles}
                    disabled={aiAssistance.isGenerating}
                    className="text-neon-purple hover:bg-neon-purple/10"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Suggest
                  </Button>
                </div>
                
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your blog title..."
                  className="text-xl border-glass-border bg-glass text-white"
                />
                
                {titleSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">AI Suggestions:</p>
                    {titleSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-3 glass rounded-lg border border-glass-border hover:border-neon-purple/50 cursor-pointer transition-all"
                        onClick={() => applyTitleSuggestion(suggestion)}
                      >
                        <p className="text-sm text-white">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Content Editor */}
            <Card className="glass border-glass-border p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Content</label>
                  
                  {/* Formatting Toolbar */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('bold')}
                      className="text-muted-foreground hover:text-white"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('italic')}
                      className="text-muted-foreground hover:text-white"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('heading')}
                      className="text-muted-foreground hover:text-white"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('list')}
                      className="text-muted-foreground hover:text-white"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('quote')}
                      className="text-muted-foreground hover:text-white"
                    >
                      <Quote className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertFormatting('code')}
                      className="text-muted-foreground hover:text-white"
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onMouseUp={handleTextSelection}
                  placeholder="Start writing your blog content... You can use Markdown formatting."
                  className="min-h-[400px] border-glass-border bg-glass text-white resize-none"
                  rows={20}
                />
                
                {selectedText && (
                  <div className="flex items-center gap-2 p-3 glass rounded-lg border border-neon-cyan/30">
                    <p className="text-sm text-muted-foreground">Selected text:</p>
                    <p className="text-sm text-white truncate flex-1">`{selectedText.substring(0, 50)}...`</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => adjustContent('expand')}
                      className="text-neon-green hover:bg-neon-green/10"
                    >
                      <Plus className="h-4 w-4" />
                      Expand
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => adjustContent('shorten')}
                      className="text-neon-pink hover:bg-neon-pink/10"
                    >
                      <Minus className="h-4 w-4" />
                      Shorten
                    </Button>
                  </div>
                )}
                
                {contentSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">AI Refined Content:</p>
                    {contentSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-4 glass rounded-lg border border-glass-border hover:border-neon-purple/50 cursor-pointer transition-all"
                        onClick={() => applyContentSuggestion(suggestion)}
                      >
                        <p className="text-sm text-white line-clamp-3">{suggestion}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            Tone: {aiAssistance.currentTone}
                          </span>
                          <Button size="sm" variant="ghost" className="text-neon-purple">
                            Apply Changes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Blog Thumbnail */}
            <Card className="glass border-glass-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">Blog Thumbnail</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateAIThumbnail}
                  disabled={isGeneratingThumbnail}
                  className="text-neon-purple hover:bg-neon-purple/10"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGeneratingThumbnail ? 'Generating...' : 'AI Generate'}
                </Button>
              </div>
              
              {thumbnail ? (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-glass-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnail}
                      alt="Blog thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowThumbnailOptions(true)}
                        className="glass text-white"
                      >
                        Change Thumbnail
                      </Button>
                    </div>
                  </div>
                  
                  {showThumbnailOptions && (
                    <div className="space-y-3 p-4 glass rounded-lg border border-glass-border">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white">Thumbnail Options</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowThumbnailOptions(false)}
                          className="text-muted-foreground hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Custom URL</label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter image URL..."
                            className="border-glass-border bg-glass text-white"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCustomThumbnail(e.currentTarget.value);
                              }
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              if (input?.value) {
                                handleCustomThumbnail(input.value);
                              }
                            }}
                            className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomThumbnail('https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop')}
                          className="text-xs h-8 border-glass-border hover:border-neon-purple/50"
                        >
                          Tech Theme
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomThumbnail('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop')}
                          className="text-xs h-8 border-glass-border hover:border-neon-purple/50"
                        >
                          Business Theme
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomThumbnail('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop')}
                          className="text-xs h-8 border-glass-border hover:border-neon-purple/50"
                        >
                          Office Theme
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCustomThumbnail('https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=400&fit=crop')}
                          className="text-xs h-8 border-glass-border hover:border-neon-purple/50"
                        >
                          Team Theme
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-glass-border flex flex-col items-center justify-center space-y-3 bg-glass/30">
                  <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center">
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image className="h-8 w-8 text-neon-purple" aria-hidden="true" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">No thumbnail selected</p>
                    <p className="text-sm text-muted-foreground mb-4">Add a compelling image to attract readers</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={generateAIThumbnail}
                        disabled={isGeneratingThumbnail}
                        className="gradient-animated text-black font-medium"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {isGeneratingThumbnail ? 'Generating...' : 'AI Generate'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowThumbnailOptions(true)}
                        className="border-glass-border text-white hover:bg-glass"
                      >
                        <Link className="h-4 w-4 mr-2" />
                        Custom URL
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Media & Links */}
            <Card className="glass border-glass-border p-6">
              <h3 className="font-medium text-white mb-4">Media & Attachments</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-20 border-dashed border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 flex-col"
                >
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image className="h-6 w-6 mb-2" aria-hidden="true" />
                  <span className="text-sm">Add Image</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 border-dashed border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10 flex-col"
                >
                  <Video className="h-6 w-6 mb-2" />
                  <span className="text-sm">Add Video</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 border-dashed border-neon-green/30 text-neon-green hover:bg-neon-green/10 flex-col"
                >
                  <Link className="h-6 w-6 mb-2" />
                  <span className="text-sm">Add Link</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Options */}
            <Card className="glass border-glass-border p-6">
              <h3 className="font-medium text-white mb-4">Publishing</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-muted-foreground">Save as Draft</label>
                  <Switch checked={isDraft} onCheckedChange={setIsDraft} />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-white">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-2 p-2 glass border border-glass-border rounded-lg text-white bg-transparent"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat} className="bg-background">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Tags */}
            <Card className="glass border-glass-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">Tags</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateTags}
                  disabled={aiAssistance.isGenerating}
                  className="text-neon-cyan hover:bg-neon-cyan/10"
                >
                  <Hash className="h-4 w-4 mr-1" />
                  AI
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                    className="border-glass-border bg-glass text-white"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button
                    onClick={addTag}
                    size="sm"
                    className="gradient-animated text-black"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="glass border-glass-border text-white"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-neon-pink hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                
                {tagSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">AI Suggestions:</p>
                    <div className="flex flex-wrap gap-1">
                      {tagSuggestions.map((suggestion) => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="cursor-pointer border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                          onClick={() => applyTagSuggestion(suggestion)}
                        >
                          {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* AI Assistant Panel */}
            {showAIPanel && (
              <Card className="glass border-glass-border p-6">
                <h3 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-neon-purple" />
                  AI Assistant
                </h3>
                
                <div className="space-y-4">
                  {/* Content Refinement */}
                  <div>
                    <p className="text-sm font-medium text-white mb-2">Refine Content</p>
                    <div className="grid grid-cols-2 gap-2">
                      {toneOptions.map((tone) => (
                        <Button
                          key={tone.value}
                          variant="outline"
                          size="sm"
                          onClick={() => refineContent(tone.value)}
                          disabled={aiAssistance.isGenerating}
                          className="text-xs border-glass-border hover:border-neon-purple/50"
                        >
                          {tone.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="bg-glass-border" />
                  
                  {/* AI Tools */}
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateMetaDescription}
                      disabled={aiAssistance.isGenerating}
                      className="w-full justify-start text-neon-cyan hover:bg-neon-cyan/10"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Meta Description
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={generateSummary}
                      disabled={aiAssistance.isGenerating}
                      className="w-full justify-start text-neon-green hover:bg-neon-green/10"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Generate Summary
                    </Button>
                  </div>
                  
                  {aiAssistance.isGenerating && (
                    <div className="flex items-center gap-2 text-neon-purple">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is working...</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Meta Description */}
            {metaDescription && (
              <Card className="glass border-glass-border p-6">
                <h3 className="font-medium text-white mb-4">Meta Description</h3>
                <Textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO meta description..."
                  className="border-glass-border bg-glass text-white"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {metaDescription.length}/160 characters
                </p>
              </Card>
            )}

            {/* AI Summary & Takeaways */}
            {(aiSummary || keyTakeaways.length > 0) && (
              <Card className="glass border-glass-border p-6">
                <h3 className="font-medium text-white mb-4">AI Insights</h3>
                
                {aiSummary && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-neon-cyan mb-2">Summary</p>
                    <p className="text-sm text-muted-foreground">{aiSummary}</p>
                  </div>
                )}
                
                {keyTakeaways.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-neon-green mb-2">Key Takeaways</p>
                    <ul className="space-y-1">
                      {keyTakeaways.map((takeaway, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Lightbulb className="h-3 w-3 text-neon-yellow mt-0.5 flex-shrink-0" />
                          {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}