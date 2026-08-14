import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Plus,
  Mic,
  Paperclip,
  Send,
  Sparkles,
  Bot,
  User,
  Edit,
  Trash2,
  Clock,
  Search,
  Settings,
  Briefcase,
  FileText,
  TrendingUp,
  Code,
  Lightbulb,
  Zap,
  BookOpen,
  Target
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar } from './ui/avatar';

interface Agent {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  preview: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ActionCard {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  prompt: string;
  color: string;
}

interface ModernAIChatInterfaceProps {
  userName?: string;
}

export function ModernAIChatInterface({ userName = 'User' }: ModernAIChatInterfaceProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showAgentsDropdown, setShowAgentsDropdown] = useState(false);
  const [showConversationsDropdown, setShowConversationsDropdown] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock agents
  const agents: Agent[] = [
    {
      id: 'career-advisor',
      name: 'Career Advisor',
      icon: Briefcase,
      description: 'Get personalized career guidance and job recommendations',
      color: 'neon-cyan'
    },
    {
      id: 'resume-expert',
      name: 'Resume Expert',
      icon: FileText,
      description: 'Optimize your resume and cover letters',
      color: 'neon-purple'
    },
    {
      id: 'interview-coach',
      name: 'Interview Coach',
      icon: Target,
      description: 'Practice interviews and get feedback',
      color: 'neon-pink'
    },
    {
      id: 'skill-builder',
      name: 'Skill Builder',
      icon: TrendingUp,
      description: 'Learn new skills and track your progress',
      color: 'neon-green'
    },
    {
      id: 'code-mentor',
      name: 'Code Mentor',
      icon: Code,
      description: 'Learn programming and get coding help',
      color: 'neon-yellow'
    }
  ];

  // Mock conversations
  const conversations: Conversation[] = [
    {
      id: '1',
      title: 'Job search in tech',
      timestamp: '2 hours ago',
      preview: 'Looking for backend engineer roles...'
    },
    {
      id: '2',
      title: 'Resume review',
      timestamp: 'Yesterday',
      preview: 'Can you help me improve my resume?'
    },
    {
      id: '3',
      title: 'Interview preparation',
      timestamp: '2 days ago',
      preview: 'Practice questions for system design...'
    }
  ];

  // Suggested action cards
  const actionCards: ActionCard[] = [
    {
      id: '1',
      icon: Edit,
      title: 'Polish my writing',
      subtitle: 'Copy-edit this text',
      prompt: 'Help me improve and polish this text for professional clarity',
      color: 'neon-cyan'
    },
    {
      id: '2',
      icon: Briefcase,
      title: 'Find me a job',
      subtitle: 'Search opportunities',
      prompt: 'Help me find job opportunities that match my skills and interests',
      color: 'neon-purple'
    },
    {
      id: '3',
      icon: FileText,
      title: 'Review my resume',
      subtitle: 'Get feedback',
      prompt: 'Review my resume and suggest improvements to make it more effective',
      color: 'neon-pink'
    },
    {
      id: '4',
      icon: TrendingUp,
      title: 'Career roadmap',
      subtitle: 'Plan your growth',
      prompt: 'Create a personalized career development roadmap for me',
      color: 'neon-green'
    },
    {
      id: '5',
      icon: Lightbulb,
      title: 'Learn new skills',
      subtitle: 'Upskill yourself',
      prompt: 'Suggest skills I should learn to advance my career',
      color: 'neon-yellow'
    },
    {
      id: '6',
      icon: Target,
      title: 'Interview prep',
      subtitle: 'Practice questions',
      prompt: 'Help me prepare for my upcoming job interview with practice questions',
      color: 'neon-cyan'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you're interested in "${message}". Let me help you with that. ${
          selectedAgent 
            ? `As your ${selectedAgent.name}, I'll provide specialized guidance.` 
            : 'I\'m here to assist you with your career goals.'
        }`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleActionCardClick = (prompt: string) => {
    setMessage(prompt);
    inputRef.current?.focus();
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // Implement voice recording logic here
  };

  const getAgentColor = (color: string) => {
    switch (color) {
      case 'neon-cyan': return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30';
      case 'neon-purple': return 'bg-neon-purple/20 text-neon-purple border-neon-purple/30';
      case 'neon-pink': return 'bg-neon-pink/20 text-neon-pink border-neon-pink/30';
      case 'neon-green': return 'bg-neon-green/20 text-neon-green border-neon-green/30';
      case 'neon-yellow': return 'bg-neon-yellow/20 text-neon-yellow border-neon-yellow/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-72 border-r border-glass-border glass-strong flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-animated flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-semibold">Qelsa AI</h2>
              <p className="text-xs text-muted-foreground">Your career assistant</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {/* New Chat Button */}
          <Button 
            className="w-full justify-start mb-6 gradient-animated"
            onClick={() => {
              setMessages([]);
              setSelectedAgent(null);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>

          {/* Agents Section */}
          <div className="mb-6">
            <button
              onClick={() => setShowAgentsDropdown(!showAgentsDropdown)}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-neon-purple" />
                <span className="text-sm font-medium">Agents</span>
              </div>
              {showAgentsDropdown ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showAgentsDropdown && (
              <div className="mt-2 space-y-1 animate-in slide-in-from-top-2">
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  const isSelected = selectedAgent?.id === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        isSelected 
                          ? 'bg-white/10 border border-neon-purple/30' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getAgentColor(agent.color)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{agent.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 border-glass-border"
                  onClick={() => console.log('Create new agent')}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Create Agent
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Conversations Section */}
          <div>
            <button
              onClick={() => setShowConversationsDropdown(!showConversationsDropdown)}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-neon-cyan" />
                <span className="text-sm font-medium">Recent</span>
              </div>
              {showConversationsDropdown ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {showConversationsDropdown && (
              <div className="mt-2 space-y-1 animate-in slide-in-from-top-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors group relative"
                  >
                    <button
                      className="flex items-start justify-between gap-2 w-full text-left"
                      onClick={() => console.log('Load conversation:', conversation.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conversation.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.preview}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conversation.timestamp}
                        </p>
                      </div>
                    </button>
                    <div className="absolute right-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Edit conversation:', conversation.id);
                        }}
                        className="h-6 w-6 p-0 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Delete conversation:', conversation.id);
                        }}
                        className="h-6 w-6 p-0 rounded-md hover:bg-white/10 text-destructive flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-glass-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            // Welcome Screen
            <div className="max-w-4xl mx-auto">
              {/* Welcome Message */}
              <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4">
                <div className="w-20 h-20 rounded-2xl gradient-animated flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-black" />
                </div>
                <h1 className="text-4xl font-bold mb-3">
                  Welcome, <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">{userName}</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  How can I help you today?
                </p>
                {selectedAgent && (
                  <Badge className={`mt-4 ${getAgentColor(selectedAgent.color)}`}>
                    <selectedAgent.icon className="w-3 h-3 mr-1" />
                    {selectedAgent.name} Active
                  </Badge>
                )}
              </div>

              {/* Action Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Suggested actions</h3>
                  <button className="text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors">
                    See more →
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {actionCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleActionCardClick(card.prompt)}
                        className="p-6 rounded-2xl glass border-glass-border hover:border-neon-purple/50 transition-all duration-300 text-left group hover:-translate-y-1 hover:shadow-lg hover:shadow-neon-purple/10 animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${getAgentColor(card.color)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-semibold mb-1 group-hover:text-neon-purple transition-colors">
                          {card.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {card.subtitle}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Chat Messages
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 animate-in fade-in slide-in-from-bottom-4 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-xl gradient-animated flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-black" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-2xl p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'glass-strong border border-neon-cyan/30'
                        : 'glass border-glass-border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-neon-cyan" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-4 animate-in fade-in">
                  <div className="w-10 h-10 rounded-xl gradient-animated flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-black" />
                  </div>
                  <div className="glass border-glass-border p-4 rounded-2xl">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" style={{ animationDelay: '200ms' }} />
                      <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-glass-border glass-strong p-6">
          <div className="max-w-4xl mx-auto">
            {/* Input Bar */}
            <div className="relative">
              <div className="flex items-center gap-2 glass-strong border border-glass-border rounded-2xl p-3 focus-within:border-neon-purple/50 transition-colors">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-neon-cyan"
                  onClick={() => console.log('Attachments')}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>

                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                />

                <Button
                  size="sm"
                  variant="ghost"
                  className={`text-muted-foreground transition-colors ${
                    isRecording ? 'text-neon-pink' : 'hover:text-neon-cyan'
                  }`}
                  onClick={handleVoiceInput}
                >
                  <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                </Button>

                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="gradient-animated disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span>Press Enter to send</span>
              <span>•</span>
              <span>Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}