import { useState } from 'react';
import { X, Image, Video, Calendar, MapPin, Briefcase, Award, TrendingUp, Lightbulb, Heart } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';

interface CreatePostProps {
  onClose: () => void;
  onSubmit: (post: { content: string; type: string; tags: string[] }) => void;
}

const postTypes = [
  { id: 'insight', label: 'Share Insight', icon: Lightbulb, color: 'text-neon-yellow', description: 'Share knowledge or tips' },
  { id: 'career_update', label: 'Career Update', icon: TrendingUp, color: 'text-neon-green', description: 'Job change, promotion, etc.' },
  { id: 'achievement', label: 'Achievement', icon: Award, color: 'text-neon-purple', description: 'Celebrate accomplishments' },
  { id: 'job_posting', label: 'Job Posting', icon: Briefcase, color: 'text-neon-cyan', description: 'Share opportunities' },
  { id: 'motivation', label: 'Motivation', icon: Heart, color: 'text-neon-pink', description: 'Inspire others' }
];

const suggestedTags = [
  'Career Growth', 'Remote Work', 'Tech', 'Marketing', 'Leadership', 'Networking',
  'Startup', 'Productivity', 'Skills', 'Learning', 'Interview Tips', 'Work Life Balance'
];

export function CreatePost({ onClose, onSubmit }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState(postTypes[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    
    onSubmit({
      content: content.trim(),
      type: selectedType.id,
      tags: selectedTags
    });
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim()) && selectedTags.length < 5) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-strong border-glass-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <h2 className="font-bold text-xl bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            Create Post
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar className="h-12 w-12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                alt="Your avatar"
                className="w-full h-full object-cover"
              />
            </Avatar>
            <div>
              <h3 className="font-bold text-foreground">You</h3>
              <p className="text-sm text-muted-foreground">Your Professional Title</p>
            </div>
          </div>

          {/* Post Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">Post Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {postTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType.id === type.id;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`flex items-center gap-3 p-4 rounded-lg text-left transition-all duration-300 ${
                      isSelected 
                        ? 'glass-strong border-neon-cyan glow-cyan' 
                        : 'glass border-glass-border hover:border-neon-cyan/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isSelected ? 'text-neon-cyan' : type.color}`} />
                    <div>
                      <div className={`font-medium ${isSelected ? 'text-neon-cyan' : 'text-foreground'}`}>
                        {type.label}
                      </div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              What&apos;s on your mind?
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Share your ${selectedType.label.toLowerCase()}...`}
              className="w-full glass border-glass-border rounded-lg p-4 text-foreground placeholder-muted-foreground resize-none min-h-[120px] focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
              rows={6}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="text-xs text-muted-foreground">
                Tip: Use @ to mention people and # for hashtags
              </div>
              <div className={`text-xs ${content.length > 500 ? 'text-neon-pink' : 'text-muted-foreground'}`}>
                {content.length}/500
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              Tags (up to 5)
            </label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="glass-strong border-neon-cyan text-neon-cyan px-3 py-1 cursor-pointer hover:bg-neon-cyan/20"
                    onClick={() => toggleTag(tag)}
                  >
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Custom Tag */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                className="flex-1 glass border-glass-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground"
                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
              />
              <Button
                size="sm"
                onClick={addCustomTag}
                disabled={!customTag.trim() || selectedTags.length >= 5}
                className="glass hover:glass-strong border-glass-border text-foreground hover:text-neon-cyan"
              >
                Add
              </Button>
            </div>

            {/* Suggested Tags */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Suggested tags:</div>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.filter(tag => !selectedTags.includes(tag)).slice(0, 8).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    disabled={selectedTags.length >= 5}
                    className="text-xs px-3 py-1 rounded-full glass border-glass-border text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Media Attachments (Future Feature) */}
          <div className="mb-6">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-neon-cyan opacity-50 cursor-not-allowed"
                disabled
              >
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image className="h-4 w-4 mr-2" aria-hidden="true" />
                Photo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-neon-purple opacity-50 cursor-not-allowed"
                disabled
              >
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-neon-green opacity-50 cursor-not-allowed"
                disabled
              >
                <Calendar className="h-4 w-4 mr-2" />
                Event
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Media attachments coming soon!
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-glass-border">
          <div className="text-sm text-muted-foreground">
            Press Cmd+Enter to post
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="glass border-glass-border text-foreground hover:text-muted-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || content.length > 500}
              className="gradient-animated text-black font-medium px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}