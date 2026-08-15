import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Briefcase, TrendingUp, Award, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';

interface PostCardProps {
  post: {
    id: string;
    author: {
      name: string;
      title: string;
      avatar: string;
      verified: boolean;
      isCompany?: boolean;
    };
    content: string;
    type: string;
    timestamp: string;
    likes: number;
    comments: number;
    shares: number;
    tags: string[];
    engagement: {
      liked: boolean;
      bookmarked: boolean;
    };
  };
  onInteraction: (postId: string, action: 'like' | 'bookmark') => void;
}

const postTypeIcons = {
  career_update: { icon: TrendingUp, color: 'text-neon-green', bgColor: 'bg-neon-green/10' },
  insight: { icon: Lightbulb, color: 'text-neon-yellow', bgColor: 'bg-neon-yellow/10' },
  job_posting: { icon: Briefcase, color: 'text-neon-cyan', bgColor: 'bg-neon-cyan/10' },
  motivation: { icon: Heart, color: 'text-neon-pink', bgColor: 'bg-neon-pink/10' },
  achievement: { icon: Award, color: 'text-neon-purple', bgColor: 'bg-neon-purple/10' }
};

export function PostCard({ post, onInteraction }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const typeConfig = postTypeIcons[post.type as keyof typeof postTypeIcons] || postTypeIcons.insight;
  const TypeIcon = typeConfig.icon;

  const handleLike = () => {
    onInteraction(post.id, 'like');
  };

  const handleBookmark = () => {
    onInteraction(post.id, 'bookmark');
  };

  const handleShare = () => {
    // Simulate sharing functionality
    navigator.clipboard?.writeText(`Check out this post from ${post.author.name}: ${post.content.slice(0, 100)}...`);
  };

  const formatContent = (content: string) => {
    // Enhanced content formatting with hashtags and mentions
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line.split(' ').map((word, wordIndex) => {
          if (word.startsWith('#')) {
            return (
              <span key={wordIndex} className="text-neon-cyan hover:text-neon-purple cursor-pointer font-medium">
                {word}{' '}
              </span>
            );
          } else if (word.startsWith('@')) {
            return (
              <span key={wordIndex} className="text-neon-purple hover:text-neon-cyan cursor-pointer font-medium">
                {word}{' '}
              </span>
            );
          }
          return word + ' ';
        })}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="glass hover:glass-strong border-glass-border rounded-xl p-6 transition-all duration-300 hover:glow-cyan">
      {/* Post Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <Avatar className="h-12 w-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-full h-full object-cover"
            />
          </Avatar>
          {post.author.verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon-cyan rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full"></div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground">{post.author.name}</h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${typeConfig.bgColor}`}>
              <TypeIcon className={`h-3 w-3 ${typeConfig.color}`} />
              <span className={`text-xs font-medium ${typeConfig.color}`}>
                {post.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{post.author.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{post.timestamp}</p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <div className="text-foreground leading-relaxed">
          {formatContent(post.content)}
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="glass border-glass-border text-neon-cyan hover:bg-neon-cyan/10 cursor-pointer transition-colors"
            >
              #{tag.toLowerCase().replace(/\s+/g, '')}
            </Badge>
          ))}
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b border-glass-border">
        <span className="hover:text-neon-cyan cursor-pointer">{post.likes} likes</span>
        <span className="hover:text-neon-cyan cursor-pointer">{post.comments} comments</span>
        <span className="hover:text-neon-cyan cursor-pointer">{post.shares} shares</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`text-muted-foreground hover:text-neon-pink transition-all duration-300 ${
              post.engagement.liked ? 'text-neon-pink glow-pink' : ''
            }`}
          >
            <Heart className={`h-4 w-4 mr-2 ${post.engagement.liked ? 'fill-current' : ''}`} />
            Like
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="text-muted-foreground hover:text-neon-cyan transition-colors"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-muted-foreground hover:text-neon-green transition-colors"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
          className={`text-muted-foreground hover:text-neon-yellow transition-all duration-300 ${
            post.engagement.bookmarked ? 'text-neon-yellow glow-yellow' : ''
          }`}
        >
          <Bookmark className={`h-4 w-4 ${post.engagement.bookmarked ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-glass-border">
          <div className="flex gap-3 mb-4">
            <Avatar className="h-8 w-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
            </Avatar>
            <div className="flex-1">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full glass border-glass-border rounded-lg p-3 text-sm text-foreground placeholder-muted-foreground resize-none"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  className="gradient-animated text-black font-medium"
                  disabled={!comment.trim()}
                >
                  Post Comment
                </Button>
              </div>
            </div>
          </div>

          {/* Sample Comments */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face"
                  alt="Commenter"
                  className="w-full h-full object-cover"
                />
              </Avatar>
              <div className="flex-1">
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground">Jake Wilson</span>
                    <span className="text-xs text-muted-foreground">2h ago</span>
                  </div>
                  <p className="text-sm text-foreground">Congratulations! Your journey is inspiring 🎉</p>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <button className="hover:text-neon-pink transition-colors">Like</button>
                  <button className="hover:text-neon-cyan transition-colors">Reply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}