import { ArrowRight, Construction, Sparkles, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Simplified background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-neon-cyan/5 rounded-full blur-xl opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-neon-purple/5 rounded-full blur-xl opacity-50"></div>
      </div>

      <Card className="relative max-w-lg w-full glass-strong border border-glass-border rounded-3xl p-8 text-center hover:glow-cyan transition-all duration-500">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-3xl gradient-animated flex items-center justify-center mx-auto pulse-glow">
            <Icon className="h-10 w-10 text-black" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink opacity-50 blur-xl animate-pulse"></div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">{description}</p>
        
        <div className="flex items-center justify-center gap-3 text-sm glass rounded-2xl p-4 mb-8 border border-glass-border">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-neon-yellow animate-pulse" />
            <span className="text-neon-yellow font-medium">Coming Soon</span>
          </div>
          <div className="w-px h-4 bg-glass-border"></div>
          <div className="flex items-center gap-2">
            <Construction className="h-4 w-4 text-neon-cyan" />
            <span className="text-muted-foreground">Under Development</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            Stay tuned for exciting updates!
          </div>
        </div>
      </Card>
    </div>
  );
}