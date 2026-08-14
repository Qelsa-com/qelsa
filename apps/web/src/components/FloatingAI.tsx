import { useState } from 'react';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { Button } from './ui/button';
import { ChatInterface } from './ChatInterface';
import { SideNavigation } from './SideNavigation';

interface FloatingAIProps {
  onViewAllJobs: (searchQuery: string) => void;
}

export function FloatingAI({ onViewAllJobs }: FloatingAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleOpen = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else if (isOpen && !isMinimized) {
      setIsOpen(false);
      setIsMinimized(false);
      setSidebarOpen(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setSidebarOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-animated text-black shadow-xl glow-cyan hover:glow-purple transition-all duration-300 hover:scale-110 lg:bottom-8 lg:right-8"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Floating chat widget */}
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
                <div className="w-8 h-8 rounded-xl gradient-animated flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-black" />
                </div>
                <div>
                  <h3 className="font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                    Kelsa AI
                  </h3>
                  {!isMinimized && (
                    <p className="text-xs text-muted-foreground">Your career assistant</p>
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
              <div className="flex h-[calc(100%-73px)] relative overflow-hidden">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                  <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}
                
                {/* Side Navigation */}
                <div className={`${
                  sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } absolute lg:relative lg:translate-x-0 z-50 lg:z-0 transition-transform duration-300 ease-in-out h-full`}>
                  <SideNavigation 
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onClose={() => setSidebarOpen(false)}
                  />
                </div>

                {/* Main Chat Interface */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <ChatInterface 
                    activeFilter={activeFilter}
                    onMenuClick={() => setSidebarOpen(true)}
                    onViewAllJobs={onViewAllJobs}
                  />
                </div>
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