import { useState } from 'react';
import { ChatInterfaceWithFeedback } from './ChatInterfaceWithFeedback';
import { SideNavigation } from './SideNavigation';

interface KelsaAIPageProps {
  onViewAllJobs: (searchQuery: string) => void;
  onNavigateToProfile?: () => void;
  onProfileClick?: () => void;
}

export function KelsaAIPage({ onViewAllJobs, onNavigateToProfile, onProfileClick }: KelsaAIPageProps) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<{ id: string; name: string } | null>(null);

  const handlePluginSelect = (pluginId: string, pluginName: string) => {
    setSelectedPlugin({ id: pluginId, name: pluginName });
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="h-screen flex relative overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Side Navigation - Professional Search History */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } absolute lg:relative lg:translate-x-0 z-50 lg:z-0 transition-transform duration-300 ease-in-out h-full`}>
        <SideNavigation 
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onClose={() => setSidebarOpen(false)}
          onPluginSelect={handlePluginSelect}
        />
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatInterfaceWithFeedback 
          activeFilter={activeFilter}
          onMenuClick={() => setSidebarOpen(true)}
          onViewAllJobs={onViewAllJobs}
          onNavigateToProfile={onNavigateToProfile}
          onProfileClick={onProfileClick}
          selectedPlugin={selectedPlugin}
          onClearPlugin={() => setSelectedPlugin(null)}
        />
      </div>
    </div>
  );
}