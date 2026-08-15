import { Briefcase, GraduationCap, Lightbulb, Search, ExternalLink, Play, CheckCircle, Target, MapPin, DollarSign, Clock, Building, Shield, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

interface ResponseData {
  id: string;
  title: string;
  description: string;
  relevance: string;
  actionLabel: string;
  actionType: 'view' | 'learn' | 'apply';
  category: 'student' | 'professional' | 'job' | 'skill';
  source?: {
    platform: 'Qelsa' | 'LinkedIn' | 'Indeed' | 'Naukri' | 'AngelList' | 'Glassdoor';
    verified?: boolean;
    exclusive?: boolean;
  };
  jobDetails?: {
    company: string;
    location: string;
    salary?: string;
    workType?: string;
    experience: string;
    responsibilities: string[];
    requirements: string[];
    preferred: string[];
    benefits: string[];
  };
}

interface ResponseCardProps {
  response: ResponseData;
  onCheckFit?: (jobId: string, jobTitle: string) => void;
  onViewJobDetails?: (jobId: string) => void;
  variant?: 'default' | 'compact';
}

const categoryIcons = {
  student: GraduationCap,
  professional: Briefcase,
  job: Search,
  skill: Lightbulb
};

const categoryColors = {
  student: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20',
  professional: 'bg-neon-purple/10 text-neon-purple border-neon-purple/20',
  job: 'bg-neon-green/10 text-neon-green border-neon-green/20',
  skill: 'bg-neon-pink/10 text-neon-pink border-neon-pink/20'
};

const actionIcons = {
  view: ExternalLink,
  learn: Play,
  apply: CheckCircle
};

const actionColors = {
  view: 'hover:bg-glass-bg hover:text-neon-cyan',
  learn: 'hover:bg-neon-cyan/10 text-neon-cyan hover:text-neon-cyan',
  apply: 'hover:bg-neon-green/10 text-neon-green hover:text-neon-green'
};

export function ResponseCard({ response, onCheckFit, onViewJobDetails, variant = 'default' }: ResponseCardProps) {
  const CategoryIcon = categoryIcons[response.category];
  const ActionIcon = actionIcons[response.actionType];

  // Source badge styling
  const getSourceBadge = (source: ResponseData['source']) => {
    if (!source) return null;

    const isQelsa = source.platform === 'Qelsa';
    const baseClasses = "text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1";
    
    if (isQelsa) {
      const qelsaClasses = source.exclusive 
        ? "bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30 glow-cyan"
        : "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20";
      
      return (
        <div className={`${baseClasses} ${qelsaClasses}`}>
          <div className="w-6 h-4 rounded gradient-animated flex items-center justify-center">
            <span className="text-black text-xs font-bold">Q</span>
          </div>
          {source.exclusive && <Star className="h-3 w-3" />}
          {source.verified && <Shield className="h-3 w-3" />}
        </div>
      );
    } else {
      const thirdPartyClasses = source.verified
        ? "bg-muted/20 text-muted-foreground border-muted-foreground/20"
        : "bg-muted/10 text-muted-foreground border-muted-foreground/10";
      
      return (
        <div className={`${baseClasses} ${thirdPartyClasses}`}>
          <span>{source.platform}</span>
          {source.verified && <Shield className="h-3 w-3" />}
        </div>
      );
    }
  };

  const handleAction = () => {
    if (response.category === 'job' && response.actionType === 'view' && onViewJobDetails) {
      onViewJobDetails(response.id);
    } else {
      // In a real implementation, this would handle the specific action
      console.log(`${response.actionType}: ${response.title}`);
    }
  };

  const handleCheckFit = () => {
    if (onCheckFit) {
      onCheckFit(response.id, response.title);
    }
  };

  const handleCardClick = () => {
    if (response.category === 'job' && onViewJobDetails) {
      onViewJobDetails(response.id);
    }
  };

  // Render job cards with summary information
  if (response.category === 'job' && response.jobDetails) {
    const { jobDetails } = response;
    
    // Compact variant for grid layouts
    if (variant === 'compact') {
      return (
        <Card 
          className="p-4 glass hover:glass-strong hover:glow-cyan transition-all duration-300 border-glass-border cursor-pointer aspect-square flex flex-col group"
          onClick={handleCardClick}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${categoryColors[response.category]}`}>
              <Building className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-neon-cyan transition-colors flex-1">
                  {response.title}
                </h3>
                {getSourceBadge(response.source)}
              </div>
              <p className="text-neon-purple font-medium text-sm">{jobDetails.company}</p>
            </div>
          </div>
          
          {/* Key info compact */}
          <div className="space-y-2 text-sm text-muted-foreground mb-3 flex-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-neon-cyan" />
              <span className="truncate text-foreground">{jobDetails.location.split(',')[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-neon-purple" />
              <span className="text-xs glass px-2 py-1 rounded border-glass-border text-neon-cyan">{jobDetails.experience}</span>
            </div>
          </div>

          {/* Why it's relevant section */}
          <div className="glass-strong rounded-lg p-3 mb-3 border border-glass-border glow-cyan hover:glow-cyan transition-all duration-300">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <Target className="w-3 h-3 text-neon-cyan" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-neon-cyan">Why it&apos;s relevant:</span> {response.relevance}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action buttons compact - Only show if callbacks are provided */}
          {(onViewJobDetails || onCheckFit) && (
            <div className="space-y-2 mt-auto">
              {onViewJobDetails && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction();
                  }}
                  className={`w-full flex items-center justify-center gap-2 text-sm px-3 py-2 glass border-glass-border text-foreground ${actionColors[response.actionType]} transition-all duration-300`}
                  variant="outline"
                  size="sm"
                >
                  <ActionIcon className="h-3 w-3" />
                  {response.actionLabel}
                </Button>
              )}
              
              {onCheckFit && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckFit();
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 glass border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan transition-all duration-300"
                >
                  <Target className="h-3 w-3" />
                  Check Fit
                </Button>
              )}
            </div>
          )}
        </Card>
      );
    }
    
    // Default variant (existing layout)
    return (
      <Card 
        className="p-5 glass hover:glass-strong hover:glow-cyan transition-all duration-300 border-glass-border cursor-pointer group"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg flex-shrink-0 ${categoryColors[response.category]}`}>
            <Building className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Job header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-foreground group-hover:text-neon-cyan transition-colors flex-1">
                    {response.title}
                  </h3>
                  {getSourceBadge(response.source)}
                </div>
                <p className="text-neon-purple font-medium text-sm mb-2">{jobDetails.company}</p>
                <Badge variant="secondary" className={`text-xs px-2 py-1 ${categoryColors[response.category]} border`}>
                  {response.category}
                </Badge>
              </div>
            </div>
            
            {/* Key info preview */}
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neon-cyan" />
                <span className="text-foreground">{jobDetails.location.split(',')[0]}</span>
              </div>
              {jobDetails.salary && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-neon-green" />
                  <span className="font-medium text-neon-green">{jobDetails.salary}</span>
                </div>
              )}
              {jobDetails.workType && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neon-purple" />
                  <span className="text-foreground">{jobDetails.workType}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs glass px-2 py-1 rounded border-glass-border text-neon-cyan">{jobDetails.experience}</span>
              </div>
            </div>
            
            {/* Short description */}
            <p className="text-muted-foreground mb-3 leading-relaxed text-sm line-clamp-2">
              {response.description}
            </p>
            
            {/* Why it's relevant */}
            <div className="glass rounded-lg p-3 mb-4 border border-glass-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-neon-cyan">Why it&apos;s relevant:</span> {response.relevance}
              </p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction();
                  }}
                  className={`flex items-center gap-2 text-sm px-4 py-2 glass border-glass-border text-foreground ${actionColors[response.actionType]} transition-all duration-300`}
                  variant="outline"
                >
                  <ActionIcon className="h-4 w-4" />
                  {response.actionLabel}
                </Button>
                
                {onCheckFit && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckFit();
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-sm px-3 py-2 glass border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan transition-all duration-300"
                  >
                    <Target className="h-4 w-4" />
                    Check Fit
                  </Button>
                )}
              </div>
              
              {response.actionType === 'apply' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-neon-green rounded-full glow-cyan"></div>
                  <span>Active hiring</span>
                </div>
              )}
              
              <div className="text-xs text-neon-cyan font-medium">
                Click to view details →
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Default card layout for non-job categories
  return (
    <Card className="p-5 glass hover:glass-strong hover:glow-cyan transition-all duration-300 border-glass-border group">
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg flex-shrink-0 ${categoryColors[response.category]}`}>
          <CategoryIcon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-foreground mb-1 group-hover:text-neon-cyan transition-colors">
                {response.title}
              </h3>
              <Badge variant="secondary" className={`text-xs px-2 py-1 ${categoryColors[response.category]} border`}>
                {response.category}
              </Badge>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-3 leading-relaxed">
            {response.description}
          </p>
          
          <div className="glass-strong rounded-lg p-4 mb-4 border border-glass-border glow-cyan hover:glow-cyan transition-all duration-300">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <Target className="w-4 h-4 text-neon-cyan" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-neon-cyan">Why it&apos;s relevant:</span> {response.relevance}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAction}
                className={`flex items-center gap-2 text-sm px-4 py-2 glass border-glass-border text-foreground ${actionColors[response.actionType]} transition-all duration-300`}
                variant="outline"
              >
                <ActionIcon className="h-4 w-4" />
                {response.actionLabel}
              </Button>
              
              {response.category === 'job' && onCheckFit && (
                <Button
                  onClick={handleCheckFit}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-sm px-3 py-2 glass border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan transition-all duration-300"
                >
                  <Target className="h-4 w-4" />
                  Check Fit
                </Button>
              )}
            </div>
            
            {response.actionType === 'apply' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-neon-green rounded-full glow-cyan"></div>
                <span>Active hiring</span>
              </div>
            )}
            
            {response.actionType === 'learn' && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-neon-cyan rounded-full glow-cyan"></div>
                <span>Self-paced</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}