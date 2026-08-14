import { useState } from 'react';
import { X, MessageSquareX, AlertTriangle, ThumbsDown, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (feedbackData: FeedbackData) => void;
  messageId: string;
  messageContent: string;
}

interface FeedbackData {
  messageId: string;
  rating: 'positive' | 'negative';
  selectedReasons: string[];
  customFeedback: string;
  timestamp: number;
}

const FEEDBACK_REASONS = [
  {
    id: 'irrelevant',
    label: 'Results not relevant to my query',
    description: 'The jobs/recommendations don\'t match what I was looking for'
  },
  {
    id: 'inaccurate',
    label: 'Inaccurate information',
    description: 'Job details, salary ranges, or requirements seem incorrect'
  },
  {
    id: 'outdated',
    label: 'Outdated job listings',
    description: 'Jobs appear to be expired or no longer available'
  },
  {
    id: 'poor_quality',
    label: 'Poor job quality',
    description: 'Jobs don\'t meet professional standards or seem suspicious'
  },
  {
    id: 'missing_info',
    label: 'Missing important information',
    description: 'Key details like location, salary, or requirements are missing'
  },
  {
    id: 'wrong_experience',
    label: 'Wrong experience level',
    description: 'Jobs require different experience level than requested'
  },
  {
    id: 'ai_reasoning',
    label: 'AI reasoning is unclear',
    description: 'The explanation for why jobs were recommended is confusing'
  },
  {
    id: 'technical_issues',
    label: 'Technical problems',
    description: 'Links don\'t work, formatting issues, or other technical problems'
  }
];

export function FeedbackModal({ isOpen, onClose, onSubmitFeedback, messageId, messageContent }: FeedbackModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customFeedback, setCustomFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleReasonToggle = (reasonId: string) => {
    setSelectedReasons(prev => 
      prev.includes(reasonId) 
        ? prev.filter(id => id !== reasonId)
        : [...prev, reasonId]
    );
  };

  const handleSubmit = async () => {
    if (selectedReasons.length === 0 && !customFeedback.trim()) {
      return; // Require at least one form of feedback
    }

    setIsSubmitting(true);

    const feedbackData: FeedbackData = {
      messageId,
      rating: 'negative',
      selectedReasons,
      customFeedback: customFeedback.trim(),
      timestamp: Date.now()
    };

    try {
      await onSubmitFeedback(feedbackData);
      
      // Reset form
      setSelectedReasons([]);
      setCustomFeedback('');
      onClose();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReasons([]);
    setCustomFeedback('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <Card className="relative w-full max-w-2xl max-h-[80vh] m-4 glass-strong border-glass-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <ThumbsDown className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Help us improve</h2>
              <p className="text-sm text-muted-foreground">What went wrong with this response?</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="hover:bg-glass-bg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col max-h-[60vh] overflow-y-auto">
          {/* AI Response Preview */}
          <div className="p-6 border-b border-glass-border">
            <div className="glass rounded-lg p-4 border border-glass-border">
              <div className="flex items-start gap-2 mb-2">
                <MessageSquareX className="h-4 w-4 text-neon-cyan mt-1 flex-shrink-0" />
                <p className="text-sm font-medium text-neon-cyan">AI Response</p>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {messageContent.length > 150 
                  ? `${messageContent.substring(0, 150)}...` 
                  : messageContent
                }
              </p>
            </div>
          </div>

          {/* Feedback Reasons */}
          <div className="p-6">
            <div className="mb-6">
              <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                What specifically went wrong? (Select all that apply)
              </h3>
              <div className="space-y-3">
                {FEEDBACK_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className="flex items-start gap-3 p-3 rounded-lg glass hover:glass-strong cursor-pointer transition-all duration-200 border border-glass-border hover:border-neon-cyan/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason.id)}
                      onChange={() => handleReasonToggle(reason.id)}
                      className="mt-1 w-4 h-4 rounded border-glass-border bg-glass-bg text-neon-cyan focus:ring-neon-cyan focus:ring-2"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{reason.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{reason.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Feedback */}
            <div className="mb-6">
              <label className="block font-medium text-foreground mb-3">
                Additional feedback (optional)
              </label>
              <Textarea
                value={customFeedback}
                onChange={(e) => setCustomFeedback(e.target.value)}
                placeholder="Tell us more about what went wrong or how we can improve..."
                className="min-h-[100px] glass border-glass-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-neon-cyan focus:border-neon-cyan resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {customFeedback.length}/500 characters
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-glass-border bg-glass-bg/50">
          <p className="text-xs text-muted-foreground">
            Your feedback helps us improve our AI recommendations
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="glass border-glass-border text-foreground hover:bg-glass-bg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedReasons.length === 0 && !customFeedback.trim() || isSubmitting}
              className="bg-neon-cyan text-black hover:bg-neon-cyan/90 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}