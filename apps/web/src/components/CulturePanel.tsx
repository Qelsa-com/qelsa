import React, { useState } from 'react';
import {
  HelpCircle,
  Zap,
  Rocket,
  Building2,
  Home,
  Users2,
  Target,
  Heart,
  TrendingUp,
  Shield,
  BookOpen,
  BarChart3,
  Palette,
  MessageSquare,
  Globe2,
  Award,
  Coffee,
  Layers,
} from 'lucide-react';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { toast } from 'sonner';

export interface CultureAttribute {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export interface CulturePreset {
  id: string;
  name: string;
  attributes: string[];
}

export const CULTURE_ATTRIBUTES: CultureAttribute[] = [
  {
    key: 'collaborative',
    name: 'Collaborative / Team-first',
    icon: Users2,
    description: 'Strong teamwork and cross-functional collaboration'
  },
  {
    key: 'autonomous',
    name: 'Autonomous / High ownership',
    icon: Target,
    description: 'High degree of independence and self-direction'
  },
  {
    key: 'fast_paced',
    name: 'Fast-paced / Rapid iteration',
    icon: Zap,
    description: 'Quick iterations and rapid execution'
  },
  {
    key: 'structured',
    name: 'Structured / Process-oriented',
    icon: Layers,
    description: 'Well-defined processes and clear expectations'
  },
  {
    key: 'remote_first',
    name: 'Remote-first / Distributed',
    icon: Globe2,
    description: 'Designed for remote work by default'
  },
  {
    key: 'office_first',
    name: 'Office-first / In-person',
    icon: Building2,
    description: 'In-person collaboration is prioritized'
  },
  {
    key: 'flat_hierarchy',
    name: 'Flat / Low hierarchy',
    icon: Target,
    description: 'Minimal management layers and open access'
  },
  {
    key: 'career_growth',
    name: 'Clear career paths',
    icon: TrendingUp,
    description: 'Clear paths for advancement and development'
  },
  {
    key: 'mission_driven',
    name: 'Mission-driven / Impact-first',
    icon: Heart,
    description: 'Purpose and impact are central to our work'
  },
  {
    key: 'work_life_balance',
    name: 'Work-life balance',
    icon: Coffee,
    description: 'Sustainable pace and personal time respected'
  },
  {
    key: 'learning_mentorship',
    name: 'Learning-focused / Mentorship',
    icon: BookOpen,
    description: 'Continuous learning and knowledge sharing'
  },
  {
    key: 'data_driven',
    name: 'Data-driven / Metrics-first',
    icon: BarChart3,
    description: 'Decisions backed by analytics and metrics'
  },
  {
    key: 'design_driven',
    name: 'Design-driven / UX-first',
    icon: Palette,
    description: 'User experience and aesthetics are priorities'
  },
  {
    key: 'diversity_inclusion',
    name: 'Diversity & Inclusion emphasis',
    icon: Award,
    description: 'Commitment to diverse teams and perspectives'
  },
];

// Educational Institution Culture Attributes
export const EDUCATION_CULTURE_ATTRIBUTES: CultureAttribute[] = [
  {
    key: 'teaching_first',
    name: 'Teaching-first / Pedagogy-focused',
    icon: BookOpen,
    description: 'Emphasis on classroom teaching excellence and pedagogical innovation'
  },
  {
    key: 'research_intensive',
    name: 'Research-intensive / Lab-first',
    icon: BarChart3,
    description: 'Focus on original research, laboratories, and publications'
  },
  {
    key: 'hands_on',
    name: 'Hands-on / Project-based',
    icon: Zap,
    description: 'Practical learning through projects and real-world applications'
  },
  {
    key: 'industry_linked',
    name: 'Industry-linked / Placement-centric',
    icon: Building2,
    description: 'Strong employer partnerships and placement focus'
  },
  {
    key: 'global_exchange',
    name: 'Global / Exchange-oriented',
    icon: Globe2,
    description: 'International programs, partnerships, and student exchanges'
  },
  {
    key: 'career_employability',
    name: 'Career & Employability Focus',
    icon: TrendingUp,
    description: 'Strong emphasis on career development and job readiness'
  },
  {
    key: 'theory_heavy',
    name: 'Theory-heavy / Academic-rigor',
    icon: Award,
    description: 'Deep theoretical foundations and academic excellence'
  },
  {
    key: 'interdisciplinary',
    name: 'Interdisciplinary / Cross-functional',
    icon: Layers,
    description: 'Encourages learning across multiple disciplines'
  },
  {
    key: 'small_classes',
    name: 'Small class sizes / Personalized attention',
    icon: Users2,
    description: 'Intimate learning environment with individual focus'
  },
  {
    key: 'online_hybrid',
    name: 'Online / Hybrid-friendly',
    icon: MessageSquare,
    description: 'Flexible delivery with online and hybrid options'
  },
  {
    key: 'scholarship_access',
    name: 'Scholarship & Access-focused',
    icon: Heart,
    description: 'Commitment to financial accessibility and scholarships'
  },
  {
    key: 'competitive_merit',
    name: 'Competitive / Merit-driven',
    icon: Target,
    description: 'Excellence-focused with competitive admissions and standards'
  },
  {
    key: 'entrepreneurship',
    name: 'Entrepreneurship & Incubation',
    icon: Rocket,
    description: 'Supports startup culture and business incubation'
  },
  {
    key: 'community_engaged',
    name: 'Community-engaged / Social impact',
    icon: Heart,
    description: 'Active community service and social responsibility'
  },
  {
    key: 'inclusive_diversity',
    name: 'Inclusive & Diversity-first',
    icon: Award,
    description: 'Commitment to inclusive education and diverse perspectives'
  },
  {
    key: 'vocational_cert',
    name: 'Vocational Certification & Micro-credentials',
    icon: Shield,
    description: 'Industry certifications and skills-based credentials'
  },
  {
    key: 'values_mission',
    name: 'Values-driven / Mission-led',
    icon: Target,
    description: 'Strong institutional values and clear mission focus'
  },
  {
    key: 'student_led',
    name: 'Student-led / Clubs & Activities–centric',
    icon: Users2,
    description: 'Vibrant student life with clubs and extracurricular activities'
  },
  {
    key: 'innovation_tech',
    name: 'Innovation-focused / Emerging Tech Labs',
    icon: Zap,
    description: 'Cutting-edge technology and innovation labs'
  },
  {
    key: 'holistic_development',
    name: 'Holistic development / Sports & Arts emphasis',
    icon: Palette,
    description: 'Well-rounded development including sports, arts, and culture'
  },
];

const CULTURE_PRESETS: CulturePreset[] = [
  {
    id: 'startup',
    name: 'Startup (fast-paced)',
    attributes: ['fast_paced', 'autonomous', 'flat_hierarchy', 'mission_driven']
  },
  {
    id: 'enterprise',
    name: 'Enterprise (structured)',
    attributes: ['structured', 'career_growth', 'work_life_balance', 'data_driven']
  },
  {
    id: 'remote_first',
    name: 'Remote-first',
    attributes: ['remote_first', 'autonomous', 'work_life_balance']
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    attributes: ['office_first', 'collaborative', 'work_life_balance']
  },
  {
    id: 'mission_driven',
    name: 'Mission-driven',
    attributes: ['mission_driven', 'collaborative', 'diversity_inclusion']
  },
  {
    id: 'balanced',
    name: 'Work-life balanced',
    attributes: ['work_life_balance', 'structured', 'career_growth']
  },
];

// Educational Institution Presets
const EDUCATION_PRESETS: CulturePreset[] = [
  {
    id: 'research_university',
    name: 'Research University',
    attributes: ['research_intensive', 'theory_heavy', 'global_exchange', 'innovation_tech']
  },
  {
    id: 'teaching_college',
    name: 'Teaching-focused College',
    attributes: ['teaching_first', 'small_classes', 'holistic_development', 'student_led']
  },
  {
    id: 'industry_linked',
    name: 'Industry-linked / Placement-focused',
    attributes: ['industry_linked', 'career_employability', 'hands_on', 'entrepreneurship']
  },
  {
    id: 'vocational',
    name: 'Vocational / Skill-first Institute',
    attributes: ['hands_on', 'vocational_cert', 'industry_linked', 'career_employability']
  },
  {
    id: 'global_exchange',
    name: 'Global / Exchange-friendly',
    attributes: ['global_exchange', 'inclusive_diversity', 'interdisciplinary', 'online_hybrid']
  },
];

interface CulturePanelProps {
  data: {
    attributes: string[];
    cultureStatement: string;
    jobMatchingImportance: number;
  };
  onChange: (data: { attributes: string[]; cultureStatement: string; jobMatchingImportance: number }) => void;
  onDraftChange: () => void;
  pageType?: 'company' | 'institution'; // Add page type prop
}

export function CulturePanel({ data, onChange, onDraftChange, pageType = 'company' }: CulturePanelProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(data.attributes || []);
  const [cultureStatement, setCultureStatement] = useState(data.cultureStatement || '');
  const [jobMatchingImportance, setJobMatchingImportance] = useState(data.jobMatchingImportance || 50);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleApplyPreset = (preset: CulturePreset) => {
    setSelectedPreset(preset.id);
    setSelectedAttributes(preset.attributes);
    onChange({ attributes: preset.attributes, cultureStatement, jobMatchingImportance });
    onDraftChange();
    
    toast.success('Preset applied', {
      description: 'Review and customize the selected attributes',
    });
  };

  const handleToggleAttribute = (key: string) => {
    setSelectedAttributes(prev => {
      const newAttributes = prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key];
      onChange({ attributes: newAttributes, cultureStatement, jobMatchingImportance });
      return newAttributes;
    });
    onDraftChange();
  };

  return (
    <div className="space-y-8">
      {/* Quick Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-white">Quick Presets</Label>
          <button className="p-1 hover:bg-white/10 rounded-full transition-colors group relative">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <div className="absolute left-0 top-full mt-2 w-64 p-3 glass-strong border border-glass-border rounded-lg text-xs text-muted-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              Click a preset to quickly configure common culture patterns. You can customize after applying.
            </div>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(pageType === 'company' ? CULTURE_PRESETS : EDUCATION_PRESETS).map(preset => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedPreset === preset.id
                  ? 'bg-glass-border text-white'
                  : 'glass-strong border border-glass-border hover:border-neon-cyan/30 hover:bg-white/5 text-muted-foreground'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-glass-border" />

      {/* Culture Attributes */}
      <div className="space-y-4">
        <Label className="text-white">Culture Attributes</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(pageType === 'company' ? CULTURE_ATTRIBUTES : EDUCATION_CULTURE_ATTRIBUTES).map(attr => {
            const AttrIcon = attr.icon;
            const isSelected = selectedAttributes.includes(attr.key);
            
            return (
              <button
                key={attr.key}
                onClick={() => handleToggleAttribute(attr.key)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'glass border-neon-cyan/30 bg-neon-cyan/5 text-white'
                    : 'glass-strong border-glass-border hover:border-glass-border/50 text-muted-foreground'
                }`}
              >
                <AttrIcon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-neon-cyan' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{attr.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator className="bg-glass-border" />

      {/* Overall Importance in Job Matching - Only show for companies */}
      {pageType === 'company' && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Overall Importance in Job Matching</Label>
              <span className="text-2xl font-bold text-neon-cyan">{jobMatchingImportance}%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={jobMatchingImportance}
                onChange={(e) => {
                  setJobMatchingImportance(Number(e.target.value));
                  onChange({ attributes: selectedAttributes, cultureStatement, jobMatchingImportance: Number(e.target.value) });
                  onDraftChange();
                }}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${jobMatchingImportance}%, rgba(255, 255, 255, 0.1) ${jobMatchingImportance}%)`,
                }}
              />
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: white;
                  cursor: pointer;
                  border: none;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                }
              `}</style>
            </div>
            <p className="text-xs text-muted-foreground">
              This controls how much culture fit affects your job recommendations
            </p>
          </div>

          <Separator className="bg-glass-border" />
        </>
      )}

      {/* Culture Statement */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="culture-statement" className="text-white">
            Culture Statement (Optional)
          </Label>
          <span className="text-xs text-muted-foreground">{cultureStatement.length}/140</span>
        </div>
        <Textarea
          id="culture-statement"
          value={cultureStatement}
          onChange={(e) => {
            const text = e.target.value.substring(0, 140);
            setCultureStatement(text);
            onChange({ attributes: selectedAttributes, cultureStatement: text, jobMatchingImportance });
            onDraftChange();
          }}
          placeholder="Describe your company culture in one sentence..."
          maxLength={140}
          rows={3}
          className="glass border-glass-border focus:border-neon-cyan resize-none"
        />
      </div>
    </div>
  );
}