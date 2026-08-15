"use client";

import { BookOpen, Calendar, Clock, Search, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { BlogPost as BlogManagerPost, useBlogManager } from "./BlogManager";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishDate: string;
  readTime: number;
  category: string;
  tags: string[];
  views: number;
  likes: number;
  shares: number;
  aiSummary: string;
  featured: boolean;
  trending: boolean;
  thumbnail: string;
}

interface BlogListingPageProps {
  onViewPost: (postId: string) => void;
  onCreatePost?: () => void;
  onEditPost?: (post: BlogManagerPost) => void;
}

export function BlogListingPage({ onViewPost, onCreatePost, onEditPost }: BlogListingPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [showAISummaries, setShowAISummaries] = useState(false);
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const { getPublishedBlogs } = useBlogManager();

  // Get published blogs from blog manager with fallback data
  const publishedBlogs = getPublishedBlogs();
  const fallbackBlogPosts: BlogPost[] = [
    {
      id: "1",
      title: "The Future of AI in Career Development: Transforming How We Learn and Grow",
      excerpt: "Discover how artificial intelligence is revolutionizing career development, from personalized learning paths to AI-powered skill assessments.",
      author: {
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=100&h=100&fit=crop&crop=face",
        role: "AI Research Lead",
      },
      publishDate: "2024-01-15",
      readTime: 8,
      category: "Technology",
      tags: ["AI", "Career Development", "Future of Work"],
      views: 2847,
      likes: 234,
      shares: 156,
      aiSummary: "This article explores how AI is transforming career development through personalized learning, skill gap analysis, and intelligent career recommendations.",
      featured: true,
      trending: true,
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop",
    },
    {
      id: "2",
      title: "Remote Work Mastery: Building a Thriving Career from Anywhere",
      excerpt: "Learn the essential skills and strategies needed to excel in remote work environments and build meaningful professional relationships.",
      author: {
        name: "Marcus Rodriguez",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        role: "Remote Work Consultant",
      },
      publishDate: "2024-01-12",
      readTime: 6,
      category: "Career Growth",
      tags: ["Remote Work", "Productivity", "Work-Life Balance"],
      views: 1923,
      likes: 142,
      shares: 89,
      aiSummary: "A comprehensive guide to remote work success, covering productivity techniques, communication strategies, and career advancement in distributed teams.",
      featured: false,
      trending: true,
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
    },
    {
      id: "3",
      title: "Data Science Career Path: From Beginner to Expert in 2024",
      excerpt: "Complete roadmap for aspiring data scientists, including essential skills, tools, and real-world project recommendations.",
      author: {
        name: "Dr. Emily Watson",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
        role: "Data Science Director",
      },
      publishDate: "2024-01-10",
      readTime: 12,
      category: "Career Paths",
      tags: ["Data Science", "Programming", "Analytics"],
      views: 3241,
      likes: 287,
      shares: 201,
      aiSummary: "Step-by-step career progression guide for data science, covering technical skills, portfolio building, and industry insights.",
      featured: true,
      trending: false,
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop",
    },
    {
      id: "4",
      title: "Networking in the Digital Age: Building Authentic Professional Connections",
      excerpt: "Modern networking strategies that go beyond traditional approaches to create genuine, lasting professional relationships.",
      author: {
        name: "Alex Thompson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
        role: "Career Coach",
      },
      publishDate: "2024-01-08",
      readTime: 7,
      category: "Networking",
      tags: ["Networking", "Social Media", "Professional Growth"],
      views: 1567,
      likes: 89,
      shares: 78,
      aiSummary: "Practical networking strategies for the digital era, focusing on authentic relationship building and leveraging social platforms effectively.",
      featured: false,
      trending: false,
      thumbnail: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=800&h=400&fit=crop",
    },
    {
      id: "5",
      title: "Cybersecurity Career Opportunities: Protecting the Digital Future",
      excerpt: "Explore the diverse and growing field of cybersecurity, from entry-level positions to specialized expert roles.",
      author: {
        name: "Jessica Park",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
        role: "Cybersecurity Analyst",
      },
      publishDate: "2024-01-05",
      readTime: 10,
      category: "Career Paths",
      tags: ["Cybersecurity", "Technology", "Career Growth"],
      views: 2156,
      likes: 167,
      shares: 134,
      aiSummary: "Comprehensive overview of cybersecurity career paths, required skills, certifications, and industry growth projections.",
      featured: false,
      trending: true,
      thumbnail: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop",
    },
    {
      id: "6",
      title: "Leadership Skills for the Next Generation of Professionals",
      excerpt: "Essential leadership competencies for emerging professionals in a rapidly changing business landscape.",
      author: {
        name: "Michael Chang",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=100&h=100&fit=crop&crop=face",
        role: "Leadership Development Manager",
      },
      publishDate: "2024-01-03",
      readTime: 9,
      category: "Leadership",
      tags: ["Leadership", "Management", "Professional Development"],
      views: 1834,
      likes: 125,
      shares: 92,
      aiSummary: "Modern leadership framework covering emotional intelligence, digital transformation leadership, and inclusive management practices.",
      featured: false,
      trending: false,
      thumbnail: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=400&fit=crop",
    },
  ];

  // Combine published blogs with fallback data for demo purposes
  const allBlogPosts: BlogPost[] = [
    ...publishedBlogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      excerpt: blog.excerpt || blog.content.substring(0, 150) + "...",
      author: blog.author,
      publishDate: blog.publishedAt || blog.updatedAt,
      readTime: blog.readTime,
      category: blog.category,
      tags: blog.tags,
      views: blog.views,
      likes: blog.likes || 0,
      shares: blog.shares,
      aiSummary: blog.aiSummary,
      featured: blog.featured,
      trending: blog.trending,
      thumbnail: blog.thumbnail,
    })),
    ...fallbackBlogPosts,
  ];

  const blogPosts = allBlogPosts;
  const categories = ["all", "Technology", "Career Growth", "Career Paths", "Networking", "Leadership", "Career Development"];
  const allTags = ["all", ...Array.from(new Set(blogPosts.flatMap((post) => post.tags)))];

  // Filter and sort posts
  const filteredPosts = blogPosts
    .filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
      const matchesTag = selectedTag === "all" || post.tags.includes(selectedTag);

      return matchesSearch && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "trending":
          return (b.trending ? 1 : 0) - (a.trending ? 1 : 0) || b.views - a.views;
        case "popular":
          return b.views - a.views;
        case "latest":
        default:
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      }
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-animated flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Qelsa Blog</h1>
                  <p className="text-muted-foreground text-sm">Insights for your career journey</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {onCreatePost && (
                <Button onClick={onCreatePost} className="gradient-animated text-black font-medium shadow-lg hover:scale-105 transition-all duration-300">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Blog
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAISummaries(!showAISummaries)}
                className={`border-glass-border ${showAISummaries ? "bg-neon-cyan/10 border-neon-cyan text-neon-cyan" : ""}`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Summaries
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search articles, authors, or topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-glass-bg border-glass-border" />
            </div>

            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-glass-bg border-glass-border">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-40 bg-glass-bg border-glass-border">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag === "all" ? "All Tags" : tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 bg-glass-bg border-glass-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="popular">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              className="glass hover:glass-strong transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:glow-cyan"
              onMouseEnter={() => setHoveredPost(post.id)}
              onMouseLeave={() => setHoveredPost(null)}
              onClick={() => onViewPost(post.id)}
            >
              {/* Thumbnail */}
              {post.thumbnail && (
                <div className="aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan bg-neon-cyan/10">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {post.featured && (
                      <Badge variant="outline" className="border-neon-pink/30 text-neon-pink bg-neon-pink/10 text-xs">
                        Featured
                      </Badge>
                    )}
                    {post.trending && <TrendingUp className="w-4 h-4 text-neon-yellow" />}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg mb-3 line-clamp-2 group-hover:text-neon-cyan transition-colors">{post.title}</h3>

                {/* Excerpt */}
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{post.excerpt}</p>

                {/* AI Summary (when enabled and hovered) */}
                {showAISummaries && hoveredPost === post.id && (
                  <div className="mb-4 p-3 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-neon-purple" />
                      <span className="text-xs font-medium text-neon-purple">AI Summary</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{post.aiSummary}</p>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{post.tags.length - 3} more
                    </Badge>
                  )}
                </div>

                {/* Author and Meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">{post.author.name}</p>
                      <p className="text-xs text-muted-foreground">{post.author.role}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3 h-3" />
                      {/* {new Date(post.publishDate).toLocaleDateString()} */}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {post.readTime} min read
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-glass-border">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{post.views.toLocaleString()} views</span>
                    <span>{post.likes} likes</span>
                    <span>{post.shares} shares</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10">
                    Read More
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
