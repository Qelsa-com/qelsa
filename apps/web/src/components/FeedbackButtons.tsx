import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { Button } from './ui/button';

interface FeedbackButtonsProps {
  messageId: string;
  onPositiveFeedback: (messageId: string) => void;
  onNegativeFeedback: (messageId: string) => void;
  className?: string;
}

export function FeedbackButtons({ 
  messageId, 
  onPositiveFeedback, 
  onNegativeFeedback,
  className = ''
}: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePositiveFeedback = async () => {
    if (feedback === 'positive' || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onPositiveFeedback(messageId);
      setFeedback('positive');
    } catch (error) {
      console.error('Error submitting positive feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegativeFeedback = async () => {
    if (feedback === 'negative' || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onNegativeFeedback(messageId);
      setFeedback('negative');
    } catch (error) {
      console.error('Error submitting negative feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 glass rounded-lg p-1 border border-glass-border">
        {/* Thumbs Up Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePositiveFeedback}
          disabled={isSubmitting || feedback !== null}
          className={`h-8 px-2 hover:bg-green-500/10 hover:text-green-400 transition-all duration-200 ${
            feedback === 'positive' 
              ? 'bg-green-500/20 text-green-400' 
              : 'text-muted-foreground hover:text-green-400'
          }`}
        >
          {feedback === 'positive' ? (
            <Check className="h-4 w-4" />
          ) : (
            <ThumbsUp className="h-4 w-4" />
          )}
        </Button>

        {/* Thumbs Down Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNegativeFeedback}
          disabled={isSubmitting || feedback !== null}
          className={`h-8 px-2 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 ${
            feedback === 'negative' 
              ? 'bg-red-500/20 text-red-400' 
              : 'text-muted-foreground hover:text-red-400'
          }`}
        >
          {feedback === 'negative' ? (
            <Check className="h-4 w-4" />
          ) : (
            <ThumbsDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Feedback Status */}
      {feedback && (
        <div className="flex items-center gap-1 text-xs">
          <div className={`w-2 h-2 rounded-full ${
            feedback === 'positive' ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="text-muted-foreground">
            {feedback === 'positive' ? 'Helpful' : 'Feedback sent'}
          </span>
        </div>
      )}
    </div>
  );
}