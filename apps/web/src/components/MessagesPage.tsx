import { useState } from 'react';
import { MessageSquare, Search, Phone, Video, MoreHorizontal, Plus, Send, Paperclip, Smile } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Input } from './ui/input';

interface MessagesPageProps {}

const mockConversations = [
  {
    id: '1',
    user: {
      name: 'Sarah Chen',
      title: 'Product Manager at TechCorp',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
      online: true
    },
    lastMessage: "Thanks for the interview tips! The session went really well 🎉",
    timestamp: '2m ago',
    unread: 2,
    type: 'mentor'
  },
  {
    id: '2',
    user: {
      name: 'Marcus Johnson',
      title: 'Senior Software Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      online: true
    },
    lastMessage: "Could you share that React course you mentioned?",
    timestamp: '15m ago',
    unread: 0,
    type: 'peer'
  },
  {
    id: '3',
    user: {
      name: 'TechStart Inc.',
      title: 'HR Team',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=150&fit=crop',
      online: false
    },
    lastMessage: "We'd love to schedule a follow-up interview. Are you available this week?",
    timestamp: '1h ago',
    unread: 1,
    type: 'company'
  },
  {
    id: '4',
    user: {
      name: 'Alex Rivera',
      title: 'UX Designer & Career Mentor',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      online: false
    },
    lastMessage: "Your portfolio looks amazing! Just sent you some feedback.",
    timestamp: '3h ago',
    unread: 0,
    type: 'mentor'
  },
  {
    id: '5',
    user: {
      name: 'Priya Patel',
      title: 'Data Scientist at FinanceFlow',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
      online: true
    },
    lastMessage: "Let's connect at the networking event next week!",
    timestamp: '5h ago',
    unread: 0,
    type: 'peer'
  }
];

const mockMessages = [
  {
    id: '1',
    senderId: '1',
    message: "Hey! How did your interview preparation go?",
    timestamp: '10:30 AM',
    isMe: false
  },
  {
    id: '2',
    senderId: 'me',
    message: "It went really well! I followed your advice about researching the company culture and preparing behavioral examples.",
    timestamp: '10:32 AM',
    isMe: true
  },
  {
    id: '3',
    senderId: '1',
    message: "That's fantastic! I'm so proud of how much you've grown. What was the most challenging question they asked?",
    timestamp: '10:33 AM',
    isMe: false
  },
  {
    id: '4',
    senderId: 'me',
    message: "They asked about a time I had to handle conflicting priorities. I used the STAR method you taught me and gave the example about managing the marketing campaign while learning product management.",
    timestamp: '10:35 AM',
    isMe: true
  },
  {
    id: '5',
    senderId: '1',
    message: "Perfect! That's exactly the kind of example that shows your adaptability and growth mindset. When do you expect to hear back?",
    timestamp: '10:36 AM',
    isMe: false
  },
  {
    id: '6',
    senderId: 'me',
    message: "They said by end of week. I'm trying not to overthink it, but I'm really excited about this opportunity!",
    timestamp: '10:38 AM',
    isMe: true
  },
  {
    id: '7',
    senderId: '1',
    message: "Thanks for the interview tips! The session went really well 🎉",
    timestamp: '10:40 AM',
    isMe: false
  }
];

export function MessagesPage({}: MessagesPageProps) {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = mockConversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const selectedUser = mockConversations.find(conv => conv.id === selectedConversation);

  return (
    <div className="h-screen glass-strong flex">
      {/* Conversations List */}
      <div className="w-full md:w-96 border-r border-glass-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-glass-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-bold text-xl bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              Messages
            </h1>
            <Button
              size="icon"
              className="gradient-animated text-black shadow-lg hover:scale-110 transition-all duration-300"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass border-glass-border"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`p-4 border-b border-glass-border cursor-pointer transition-all duration-200 hover:glass-strong ${
                selectedConversation === conversation.id ? 'glass-strong border-l-2 border-l-neon-cyan' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
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
                    <h3 className="font-medium text-foreground truncate">{conversation.user.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                      {conversation.unread > 0 && (
                        <Badge className="bg-neon-cyan text-black text-xs px-2">
                          {conversation.unread}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{conversation.user.title}</p>
                  <p className="text-sm text-foreground truncate">{conversation.lastMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col min-w-0 hidden md:flex">
          {/* Chat Header */}
          <div className="p-4 border-b border-glass-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedUser?.user.avatar}
                    alt={selectedUser?.user.name}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
                {selectedUser?.user.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-background"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{selectedUser?.user.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser?.user.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-neon-cyan"
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-neon-cyan"
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.isMe 
                    ? 'gradient-animated text-black ml-auto' 
                    : 'glass border-glass-border text-foreground'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${message.isMe ? 'text-black/70' : 'text-muted-foreground'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-glass-border">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-neon-cyan"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="glass border-glass-border pr-12"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-neon-cyan"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="gradient-animated text-black shadow-lg hover:scale-110 transition-all duration-300"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">Select a conversation</h3>
            <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}

      {/* Mobile: Show chat fullscreen when conversation selected */}
      {selectedConversation && (
        <div className="md:hidden fixed inset-0 z-50 glass-strong flex flex-col">
          {/* Mobile Chat Header */}
          <div className="p-4 border-b border-glass-border flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="text-muted-foreground hover:text-neon-cyan"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedUser?.user.avatar}
                    alt={selectedUser?.user.name}
                    className="w-full h-full object-cover"
                  />
                </Avatar>
                {selectedUser?.user.online && (
                  <div className="absolute bottom-0 right-0 w-2 h-2 bg-neon-green rounded-full border border-background"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{selectedUser?.user.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedUser?.user.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-neon-cyan"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-neon-cyan"
              >
                <Video className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs px-3 py-2 rounded-2xl ${
                  message.isMe 
                    ? 'gradient-animated text-black ml-auto' 
                    : 'glass border-glass-border text-foreground'
                }`}>
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${message.isMe ? 'text-black/70' : 'text-muted-foreground'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Message Input */}
          <div className="p-4 border-t border-glass-border pb-safe">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="glass border-glass-border"
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                size="icon"
                className="gradient-animated text-black shadow-lg"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}