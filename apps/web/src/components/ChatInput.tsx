import { useState, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const scrollHeight = Math.min(textarea.scrollHeight, 120); // Max height of ~3 lines
    textarea.style.height = scrollHeight + 'px';
  };

  const handleMicClick = () => {
    // In a real implementation, this would handle speech recognition
    setIsRecording(!isRecording);
    
    // Simulate speech input (remove in production)
    if (!isRecording) {
      setTimeout(() => {
        setMessage("I am a B.Com student, what are my career options?");
        setIsRecording(false);
      }, 2000);
    }
  };

  const placeholders = [
    "Ask me about career options...",
    "Find jobs in your area...", 
    "Explore skill development paths...",
    "Get personalized career guidance..."
  ];

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="relative glass-strong border-2 border-glass-border rounded-3xl hover:glow-cyan focus-within:glow-purple transition-all duration-300">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholders[Math.floor(Math.random() * placeholders.length)]}
          disabled={disabled}
          className="min-h-[60px] resize-none border-0 bg-transparent px-6 py-4 pr-28 text-base text-white focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
          rows={1}
        />
        
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleMicClick}
            disabled={disabled}
            className={`h-10 w-10 rounded-full glass hover:glass-strong transition-all duration-300 ${
              isRecording ? 'text-neon-pink glow-pink' : 'text-neon-cyan hover:glow-cyan'
            }`}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-10 w-10 rounded-full gradient-animated text-black hover:scale-110 shadow-lg glow-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {isRecording && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 glass-strong border border-neon-pink text-white px-4 py-2 rounded-2xl text-sm flex items-center gap-2 shadow-lg glow-pink">
          <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></div>
          Recording...
          <div className="w-12 h-1 bg-glass-bg rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-neon-pink to-neon-purple animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
}