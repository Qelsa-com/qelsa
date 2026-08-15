import { useState } from 'react';
import { Mail, X, Minimize2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';

interface FloatingMessagesProps {}

const mockConversations = [
  {
    id: '1',
    user: {
      name: 'Sarah Chen',
      title: 'Product Manager',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      online: true
    },
    lastMessage: "Thanks for the interview tips!",
    timestamp: '2m ago',
    unread: 2
  },
  {
    id: '2',
    user: {
      name: 'Marcus Johnson',
      title: 'Senior Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      online: true
    },
    lastMessage: "Could you share that course?",
    timestamp: '15m ago',
    unread: 0
  },
  {
    id: '3',
    user: {
      name: 'TechStart Inc.',
      title: 'HR Team',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop',
      online: false
    },
    lastMessage: "Let's schedule an interview",
    timestamp: '1h ago',
    unread: 1
  }
];

export function FloatingMessages({}: FloatingMessagesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const toggleOpen = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else if (isOpen && !isMinimized) {
      setIsOpen(false);
      setIsMinimized(false);
      setSelectedConversation(null);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setSelectedConversation(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setSelectedConversation(null);
  };

  const totalUnread = mockConversations.reduce((sum, conv) => sum + conv.unread, 0);
  const selectedUser = mockConversations.find(conv => conv.id === selectedConversation);

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 lg:bottom-8 lg:right-8">

        </div>
      )}

      {/* Floating messages widget */}
      {isOpen && (
        <div 
          className={`fixed z-50 transition-all duration-300 ease-in-out ${
            isMinimized 
              ? 'bottom-6 right-6 w-80 h-14 lg:bottom-8 lg:right-8' 
              : 'bottom-6 right-6 w-96 h-[600px] lg:bottom-8 lg:right-8 lg:w-[480px] lg:h-[640px]'
          }`}
        >
          <div className="glass-strong border border-glass-border rounded-2xl shadow-2xl glow-cyan overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-glass-border bg-gradient-to-r from-glass-bg to-transparent">
              <div className="flex items-center gap-3">
                {selectedConversation && !isMinimized && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                    className="h-8 w-8 text-muted-foreground hover:text-neon-cyan"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div className="w-8 h-8 rounded-xl gradient-animated flex items-center justify-center">
                  <Mail className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h3 className="font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    {selectedConversation && !isMinimized ? selectedUser?.user.name : 'Messages'}
                  </h3>
                  {!isMinimized && (
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation ? selectedUser?.user.title : `${totalUnread} unread messages`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isMinimized && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMinimize}
                    className="h-8 w-8 text-muted-foreground hover:text-neon-cyan"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 text-muted-foreground hover:text-neon-pink"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="h-[calc(100%-73px)] overflow-hidden">
                {!selectedConversation ? (
                  // Conversations List
                  <div className="h-full overflow-y-auto">
                    {mockConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className="p-3 border-b border-glass-border cursor-pointer transition-all duration-200 hover:glass-strong"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={conversation.user.avatar}
                                alt={conversation.user.name}
                                className="w-full h-full object-cover"
                              />
                            </Avatar>
                            {conversation.user.online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-background"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-foreground text-sm truncate">{conversation.user.name}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                                {conversation.unread > 0 && (
                                  <Badge className="bg-neon-cyan text-black text-xs px-1.5">
                                    {conversation.unread}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{conversation.user.title}</p>
                            <p className="text-xs text-foreground truncate">{conversation.lastMessage}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Chat View
                  <div className="h-full flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      <div className="flex justify-start">
                        <div className="max-w-xs px-3 py-2 rounded-2xl glass border-glass-border text-foreground">
                          <p className="text-sm">Hey! How did your interview go?</p>
                          <p className="text-xs text-muted-foreground mt-1">10:30 AM</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <div className="max-w-xs px-3 py-2 rounded-2xl gradient-animated text-black">
                          <p className="text-sm">It went really well! Thanks for the tips.</p>
                          <p className="text-xs text-black/70 mt-1">10:32 AM</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-start">
                        <div className="max-w-xs px-3 py-2 rounded-2xl glass border-glass-border text-foreground">
                          <p className="text-sm">Thanks for the interview tips! The session went really well 🎉</p>
                          <p className="text-xs text-muted-foreground mt-1">10:40 AM</p>
                        </div>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="p-3 border-t border-glass-border">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Type a message..."
                          className="flex-1 glass border-glass-border text-sm"
                        />
                        <Button
                          size="sm"
                          className="gradient-animated text-black shadow-lg"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for mobile when widget is open */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleClose}
        />
      )}
    </>
  );
}