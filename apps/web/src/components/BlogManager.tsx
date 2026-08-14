import { useState, useEffect } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  metaDescription: string;
  thumbnail: string;
  isDraft: boolean;
  wordCount: number;
  readTime: number;
  aiSummary: string;
  keyTakeaways: string[];
  moderationStatus: 'checking' | 'approved' | 'flagged' | null;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  publishedAt?: string;
  updatedAt: string;
  views: number;
  likes: number;
  shares: number;
  featured: boolean;
  trending: boolean;
}

class BlogStorage {
  private static STORAGE_KEY = 'qelsa-blog-posts';
  
  static getBlogs(): BlogPost[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  static saveBlog(blog: Partial<BlogPost>): BlogPost {
    const blogs = this.getBlogs();
    const now = new Date().toISOString();
    
    if (blog.id) {
      // Update existing
      const index = blogs.findIndex(b => b.id === blog.id);
      if (index >= 0) {
        const updatedBlog = { ...blogs[index], ...blog, updatedAt: now };
        blogs[index] = updatedBlog;
        this.saveBlogs(blogs);
        return updatedBlog;
      }
    }
    
    // Create new
    const newBlog: BlogPost = {
      id: `blog-${Date.now()}`,
      title: blog.title || '',
      content: blog.content || '',
      excerpt: blog.excerpt || '',
      tags: blog.tags || [],
      category: blog.category || 'Career Development',
      metaDescription: blog.metaDescription || '',
      thumbnail: blog.thumbnail || '',
      isDraft: blog.isDraft ?? true,
      wordCount: blog.wordCount || 0,
      readTime: blog.readTime || 0,
      aiSummary: blog.aiSummary || '',
      keyTakeaways: blog.keyTakeaways || [],
      moderationStatus: blog.moderationStatus || null,
      author: blog.author || {
        name: 'Anonymous',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'Writer'
      },
      publishedAt: blog.isDraft ? undefined : (blog.publishedAt || now),
      updatedAt: now,
      views: blog.views || 0,
      likes: blog.likes || 0,
      shares: blog.shares || 0,
      featured: blog.featured || false,
      trending: blog.trending || false
    };
    
    blogs.unshift(newBlog);
    this.saveBlogs(blogs);
    return newBlog;
  }
  
  static deleteBlog(id: string): void {
    const blogs = this.getBlogs().filter(b => b.id !== id);
    this.saveBlogs(blogs);
  }
  
  static publishBlog(id: string): BlogPost | null {
    const blogs = this.getBlogs();
    const index = blogs.findIndex(b => b.id === id);
    
    if (index >= 0) {
      const blog = {
        ...blogs[index],
        isDraft: false,
        publishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      blogs[index] = blog;
      this.saveBlogs(blogs);
      return blog;
    }
    
    return null;
  }
  
  static getBlog(id: string): BlogPost | null {
    return this.getBlogs().find(b => b.id === id) || null;
  }
  
  static getPublishedBlogs(): BlogPost[] {
    return this.getBlogs().filter(b => !b.isDraft);
  }
  
  static getDraftBlogs(): BlogPost[] {
    return this.getBlogs().filter(b => b.isDraft);
  }
  
  private static saveBlogs(blogs: BlogPost[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(blogs));
    } catch (error) {
      console.error('Failed to save blogs:', error);
    }
  }
}

export function useBlogManager() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setBlogs(BlogStorage.getBlogs());
    setIsLoading(false);
  }, []);
  
  const saveBlog = (blogData: Partial<BlogPost>) => {
    const savedBlog = BlogStorage.saveBlog(blogData);
    setBlogs(BlogStorage.getBlogs());
    return savedBlog;
  };
  
  const deleteBlog = (id: string) => {
    BlogStorage.deleteBlog(id);
    setBlogs(BlogStorage.getBlogs());
  };
  
  const publishBlog = (id: string) => {
    const published = BlogStorage.publishBlog(id);
    setBlogs(BlogStorage.getBlogs());
    return published;
  };
  
  const getBlog = (id: string) => {
    return BlogStorage.getBlog(id);
  };
  
  const getPublishedBlogs = () => {
    return BlogStorage.getPublishedBlogs();
  };
  
  const getDraftBlogs = () => {
    return BlogStorage.getDraftBlogs();
  };
  
  return {
    blogs,
    isLoading,
    saveBlog,
    deleteBlog,
    publishBlog,
    getBlog,
    getPublishedBlogs,
    getDraftBlogs
  };
}

export { BlogStorage };