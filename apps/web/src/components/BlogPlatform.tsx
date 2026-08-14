import { useState } from 'react';
import { BlogListingPage } from './BlogListingPage';
import { BlogDetailPage } from './BlogDetailPage';
import { BlogEditor } from './BlogEditor';
import { useBlogManager, BlogPost } from './BlogManager';
import { toast } from 'sonner';

interface BlogPlatformProps {
  onShareToFeed?: (blogPost: any) => void;
}

export function BlogPlatform({ onShareToFeed }: BlogPlatformProps) {
  const [currentView, setCurrentView] = useState<'listing' | 'detail' | 'editor'>('listing');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const { saveBlog, publishBlog, getBlog } = useBlogManager();

  const handleViewPost = (postId: string) => {
    setSelectedPostId(postId);
    setCurrentView('detail');
  };

  const handleBackToListing = () => {
    setCurrentView('listing');
    setSelectedPostId(null);
    setEditingPost(null);
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setCurrentView('editor');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setCurrentView('editor');
  };

  const handleSavePost = (blogData: any) => {
    const savedBlog = saveBlog({
      ...blogData,
      isDraft: true,
      author: {
        name: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'Content Creator'
      }
    });
    toast.success('Blog saved as draft!');
    handleBackToListing();
    return savedBlog;
  };

  const handlePublishPost = (blogData: any) => {
    const savedBlog = saveBlog({
      ...blogData,
      isDraft: false,
      author: {
        name: 'Current User',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'Content Creator'
      }
    });
    toast.success('Blog published successfully!');
    handleBackToListing();
    return savedBlog;
  };

  if (currentView === 'detail' && selectedPostId) {
    return (
      <BlogDetailPage
        postId={selectedPostId}
        onBack={handleBackToListing}
        onViewPost={handleViewPost}
        onShareToFeed={onShareToFeed}
      />
    );
  }

  if (currentView === 'editor') {
    return (
      <BlogEditor
        initialData={editingPost}
        onSave={handleSavePost}
        onPublish={handlePublishPost}
        onCancel={handleBackToListing}
      />
    );
  }

  return (
    <BlogListingPage 
      onViewPost={handleViewPost}
      onCreatePost={handleCreatePost}
      onEditPost={handleEditPost}
    />
  );
}