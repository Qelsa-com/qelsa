import { useState } from 'react';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  Eye, 
  Filter,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BarChart3,
  MessageSquare,
  Download,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';

interface Candidate {
  id: string;
  name: string;
  email: string;
  appliedDate: string;
  skillMatchScore: number;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected';
  aiEvaluation: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    topSkills: string[];
    recommendation: 'strong' | 'moderate' | 'weak';
  };
  answers: Record<string, any>;
}

interface RecruiterDashboardProps {
  jobId: string;
  jobTitle: string;
  onBack: () => void;
}

export function RecruiterDashboard({ jobId, jobTitle, onBack }: RecruiterDashboardProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score-desc');

  // Mock candidates data
  const [candidates] = useState<Candidate[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah.chen@email.com',
      appliedDate: '2024-01-15',
      skillMatchScore: 92,
      status: 'shortlisted',
      aiEvaluation: {
        overallScore: 92,
        strengths: [
          'Excellent problem-solving approach in coding challenge',
          'Strong understanding of microservices architecture',
          'Clear communication in behavioral responses'
        ],
        weaknesses: [
          'Limited experience with GraphQL mentioned',
          'Could provide more specific metrics in examples'
        ],
        topSkills: ['Node.js', 'AWS', 'System Design', 'Problem Solving'],
        recommendation: 'strong'
      },
      answers: {}
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      email: 'marcus.j@email.com',
      appliedDate: '2024-01-14',
      skillMatchScore: 88,
      status: 'reviewed',
      aiEvaluation: {
        overallScore: 88,
        strengths: [
          'Solid coding fundamentals demonstrated',
          'Good experience with Docker and Kubernetes',
          'Team leadership experience evident'
        ],
        weaknesses: [
          'Some edge cases not addressed in coding solution',
          'Behavioral responses could be more detailed'
        ],
        topSkills: ['Python', 'Docker', 'Leadership', 'PostgreSQL'],
        recommendation: 'strong'
      },
      answers: {}
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      email: 'elena.rod@email.com',
      appliedDate: '2024-01-13',
      skillMatchScore: 76,
      status: 'pending',
      aiEvaluation: {
        overallScore: 76,
        strengths: [
          'Creative approach to problem-solving',
          'Diverse technology stack experience',
          'Shows eagerness to learn'
        ],
        weaknesses: [
          'Less experience with required AWS services',
          'Coding solution needs optimization',
          'Limited microservices experience'
        ],
        topSkills: ['Node.js', 'MongoDB', 'REST APIs'],
        recommendation: 'moderate'
      },
      answers: {}
    },
    {
      id: '4',
      name: 'David Park',
      email: 'david.park@email.com',
      appliedDate: '2024-01-12',
      skillMatchScore: 65,
      status: 'pending',
      aiEvaluation: {
        overallScore: 65,
        strengths: [
          'Basic understanding of core concepts',
          'Willing to learn new technologies'
        ],
        weaknesses: [
          'Limited production experience',
          'Incomplete coding challenge solution',
          'Lacks specific examples in behavioral questions',
          'Experience level below requirement'
        ],
        topSkills: ['JavaScript', 'Express.js'],
        recommendation: 'weak'
      },
      answers: {}
    }
  ]);

  const stats = {
    totalApplicants: candidates.length,
    avgSkillMatch: Math.round(candidates.reduce((sum, c) => sum + c.skillMatchScore, 0) / candidates.length),
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    pending: candidates.filter(c => c.status === 'pending').length
  };

  const filteredCandidates = candidates
    .filter(c => filterStatus === 'all' || c.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'score-desc') return b.skillMatchScore - a.skillMatchScore;
      if (sortBy === 'score-asc') return a.skillMatchScore - b.skillMatchScore;
      if (sortBy === 'date-desc') return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
      if (sortBy === 'date-asc') return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
      return 0;
    });

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-neon-green';
    if (score >= 70) return 'text-neon-cyan';
    if (score >= 60) return 'text-neon-yellow';
    return 'text-muted-foreground';
  };

  const getRecommendationBadge = (recommendation: string) => {
    if (recommendation === 'strong') {
      return <Badge className="bg-neon-green/20 text-neon-green border-0">Strong Match</Badge>;
    }
    if (recommendation === 'moderate') {
      return <Badge className="bg-neon-yellow/20 text-neon-yellow border-0">Moderate Match</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground border-0">Weak Match</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
                Applicant Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">{jobTitle}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button className="gradient-animated">
                <Eye className="w-4 h-4 mr-2" />
                View Job Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 glass border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalApplicants}</p>
                <p className="text-xs text-muted-foreground">Total Applicants</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 glass border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgSkillMatch}%</p>
                <p className="text-xs text-muted-foreground">Avg. Skill Match</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 glass border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-green/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-neon-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.shortlisted}</p>
                <p className="text-xs text-muted-foreground">Shortlisted</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 glass border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-yellow/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-neon-yellow" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 glass border-glass-border mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-3 flex-1">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="glass border-glass-border w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Candidates</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="glass border-glass-border w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score-desc">Highest Score First</SelectItem>
                  <SelectItem value="score-asc">Lowest Score First</SelectItem>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              <span className="text-sm text-muted-foreground">AI-Ranked by Skill Match</span>
            </div>
          </div>
        </Card>

        {/* Candidates List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {filteredCandidates.map((candidate) => (
              <Card
                key={candidate.id}
                className={`p-6 glass border-glass-border cursor-pointer transition-all duration-300 hover:border-neon-cyan/50 ${
                  selectedCandidate?.id === candidate.id ? 'border-neon-cyan shadow-lg shadow-neon-cyan/20' : ''
                }`}
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{candidate.name}</h3>
                      {getRecommendationBadge(candidate.aiEvaluation.recommendation)}
                    </div>
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied {new Date(candidate.appliedDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(candidate.skillMatchScore)}`}>
                      {candidate.skillMatchScore}%
                    </div>
                    <p className="text-xs text-muted-foreground">Skill Match</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.aiEvaluation.topSkills.slice(0, 4).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-neon-green mb-1">✓ Key Strengths</p>
                    <p className="text-xs text-muted-foreground">
                      {candidate.aiEvaluation.strengths[0]}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 gradient-animated">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Shortlist
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 border-glass-border">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Candidate Detail Panel */}
          <div className="lg:col-span-1">
            {selectedCandidate ? (
              <div className="sticky top-6 space-y-4">
                <Card className="p-6 glass border-glass-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                      <span className="text-lg font-bold text-black">
                        {selectedCandidate.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{selectedCandidate.name}</h3>
                      <p className="text-xs text-muted-foreground">{selectedCandidate.email}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Overall Score</p>
                        <span className={`text-xl font-bold ${getScoreColor(selectedCandidate.aiEvaluation.overallScore)}`}>
                          {selectedCandidate.aiEvaluation.overallScore}%
                        </span>
                      </div>
                      <Progress value={selectedCandidate.aiEvaluation.overallScore} className="h-2" />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2 text-neon-green">Strengths</p>
                      <ul className="space-y-2">
                        {selectedCandidate.aiEvaluation.strengths.map((strength, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="w-3 h-3 text-neon-green mt-0.5 flex-shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2 text-neon-yellow">Areas for Improvement</p>
                      <ul className="space-y-2">
                        {selectedCandidate.aiEvaluation.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                            <AlertCircle className="w-3 h-3 text-neon-yellow mt-0.5 flex-shrink-0" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Top Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedCandidate.aiEvaluation.topSkills.map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 glass border-glass-border bg-gradient-to-br from-neon-purple/10 to-neon-cyan/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-neon-purple" />
                    <p className="text-sm font-medium">AI Recommendation</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedCandidate.aiEvaluation.recommendation === 'strong' &&
                      'This candidate demonstrates strong technical skills and cultural fit. Recommend moving forward to interview.'}
                    {selectedCandidate.aiEvaluation.recommendation === 'moderate' &&
                      'This candidate shows potential but has some gaps in required skills. Consider for roles with training opportunities.'}
                    {selectedCandidate.aiEvaluation.recommendation === 'weak' &&
                      'This candidate may not meet the current requirements. Consider for junior positions or future opportunities.'}
                  </p>
                </Card>

                <div className="flex gap-2">
                  <Button className="flex-1 gradient-animated">
                    Schedule Interview
                  </Button>
                  <Button variant="outline" className="border-destructive/30 text-destructive">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-8 glass border-glass-border text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a candidate to view detailed AI evaluation
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
