import { ArrowLeft, Award, Brain, Briefcase, CheckCircle2, ChevronDown, ChevronUp, Clock, DollarSign, ExternalLink, MapPin, Save, Share2, Sparkles, Star, Target, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { Job } from "@/types/job";

interface JobComparisonPageProps {
  jobs: Job[];
  onBack: () => void;
  // onApply: (jobId: number) => void;
  onRemoveJob: (jobId: number) => void;
}

type PreferenceKey = "salary" | "growth" | "workLife" | "stability";

interface Preferences {
  salary: number;
  growth: number;
  workLife: number;
  stability: number;
}

export function JobComparisonPage({ jobs, onBack, onRemoveJob }: JobComparisonPageProps) {
  const [preferences, setPreferences] = useState<Preferences>({
    salary: 25,
    growth: 25,
    workLife: 25,
    stability: 25,
  });
  const [showPreferences, setShowPreferences] = useState(true);
  const [savedComparison, setSavedComparison] = useState(false);

  // Mock AI data - in real implementation, this would come from AI analysis
  const getAIInsights = (job: Job) => {
    const insights = {
      skillMatch: Math.floor(Math.random() * 30) + 70, // 70-100%
      careerFit: ["Product Management", "Leadership", "Technical Growth"][Math.floor(Math.random() * 3)],
      summary:
        job.resource === "Qelsa"
          ? "Best for candidates seeking fast growth in innovative tech startups with strong mentorship."
          : job.resource === "LinkedIn"
          ? "Best for candidates prioritizing stable MNC careers with comprehensive benefits."
          : "Best for candidates looking for work-life balance and established company culture.",
      strengths: ["Competitive salary", "Strong team culture", "Growth opportunities"],
      // improvements: job.skillMatch < 80 ? ["SQL proficiency", "Cloud architecture knowledge"] : [],
      scores: {
        salary: Math.floor(Math.random() * 30) + 70,
        growth: Math.floor(Math.random() * 30) + 70,
        workLife: Math.floor(Math.random() * 30) + 70,
        stability: Math.floor(Math.random() * 30) + 70,
      },
    };
    return insights;
  };

  const calculateQelsaScore = (job: Job) => {
    const insights = getAIInsights(job);
    const totalWeight = preferences.salary + preferences.growth + preferences.workLife + preferences.stability;

    if (totalWeight === 0) return 0;

    const score =
      (insights.scores.salary * preferences.salary +
        insights.scores.growth * preferences.growth +
        insights.scores.workLife * preferences.workLife +
        insights.scores.stability * preferences.stability) /
      totalWeight;

    return Math.round(score);
  };

  const getSourceColor = (platform: string) => {
    switch (platform) {
      case "Qelsa":
        return "bg-neon-cyan/10 text-neon-cyan border-neon-cyan";
      case "LinkedIn":
        return "bg-blue-500/10 text-blue-400 border-blue-500";
      case "Indeed":
        return "bg-blue-600/10 text-blue-400 border-blue-600";
      case "Naukri":
        return "bg-purple-500/10 text-purple-400 border-purple-500";
      case "AngelList":
        return "bg-gray-400/10 text-gray-300 border-gray-400";
      case "Glassdoor":
        return "bg-green-500/10 text-green-400 border-green-500";
      default:
        return "bg-gray-400/10 text-gray-300 border-gray-400";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-neon-green";
    if (score >= 70) return "text-neon-cyan";
    if (score >= 60) return "text-neon-yellow";
    return "text-orange-400";
  };

  const handlePreferenceChange = (key: PreferenceKey, value: number[]) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value[0],
    }));
  };

  const handleSaveComparison = () => {
    setSavedComparison(true);
    setTimeout(() => setSavedComparison(false), 2000);
    console.log("Comparison saved");
  };

  const handleShareComparison = () => {
    console.log("Share comparison with mentor/advisor");
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      {/* Header */}
      <div className="glass-strong border-b border-glass-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-neon-cyan" />
                  Compare Jobs
                </h1>
                <p className="text-sm text-muted-foreground">AI-powered comparison • {jobs.length} jobs</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleShareComparison} className="hidden lg:flex text-muted-foreground hover:text-white">
                <Share2 className="w-4 h-4 mr-2" />
                Share with Mentor
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSaveComparison} className="text-muted-foreground hover:text-white">
                <Save className="w-4 h-4 mr-2" />
                {savedComparison ? "Saved!" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:px-6">
        {/* AI Preference Controls */}
        <div className="glass-strong rounded-2xl p-4 lg:p-6 mb-6 border border-glass-border">
          <button onClick={() => setShowPreferences(!showPreferences)} className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-neon-purple" />
              <h2 className="text-white">Personalize Your Comparison</h2>
            </div>
            {showPreferences ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showPreferences && (
            <>
              <p className="text-sm text-muted-foreground mb-6">Adjust what matters most to you. The Qelsa Score will be calculated based on your preferences.</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-neon-green" />
                      Salary & Compensation
                    </label>
                    <span className="text-sm text-neon-cyan">{preferences.salary}%</span>
                  </div>
                  <Slider value={[preferences.salary]} onValueChange={(value) => handlePreferenceChange("salary", value)} max={100} step={5} className="mb-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-neon-cyan" />
                      Career Growth
                    </label>
                    <span className="text-sm text-neon-cyan">{preferences.growth}%</span>
                  </div>
                  <Slider value={[preferences.growth]} onValueChange={(value) => handlePreferenceChange("growth", value)} max={100} step={5} className="mb-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neon-purple" />
                      Work-Life Balance
                    </label>
                    <span className="text-sm text-neon-cyan">{preferences.workLife}%</span>
                  </div>
                  <Slider value={[preferences.workLife]} onValueChange={(value) => handlePreferenceChange("workLife", value)} max={100} step={5} className="mb-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-neon-yellow" />
                      Job Stability
                    </label>
                    <span className="text-sm text-neon-cyan">{preferences.stability}%</span>
                  </div>
                  <Slider value={[preferences.stability]} onValueChange={(value) => handlePreferenceChange("stability", value)} max={100} step={5} className="mb-2" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {jobs.map((job) => {
              const insights = getAIInsights(job);
              const qelsaScore = calculateQelsaScore(job);

              return (
                <div key={job.id} className="glass-strong rounded-2xl overflow-hidden border border-glass-border">
                  {/* Top Section */}
                  <div className="p-4 lg:p-6 border-b border-glass-border">
                    {/* Company Logo & Basic Info */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        {job.company_logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={job.company_logo} alt={job.company_name || job.page?.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : <Briefcase className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white mb-1 line-clamp-2">{job.job_title?.name ?? job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company_name || job.page?.name}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs mt-2 ${getSourceColor(job.resource)}`}>
                          <ExternalLink className="w-3 h-3" />
                          {job.resource}
                          {/* {job.source.verified && <CheckCircle2 className="w-3 h-3 ml-1" />} */}
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-white">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="text-white">{job.work_type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-white">{job.experience}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-neon-green" />
                          <span className="text-white">{job.salary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI-Enhanced Middle Section */}
                  <div className="p-4 lg:p-6 border-b border-glass-border bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5">
                    {/* Qelsa Score */}
                    <div className="glass rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-neon-cyan" />
                          Qelsa Score
                        </span>
                        <span className={`text-2xl ${getScoreColor(qelsaScore)}`}>{qelsaScore}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-500" style={{ width: `${qelsaScore}%` }} />
                      </div>
                    </div>

                    {/* Skill Match */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white flex items-center gap-2">
                          <Target className="w-4 h-4 text-neon-pink" />
                          Skill Match
                        </span>
                        <span className={`text-lg ${getScoreColor(insights.skillMatch)}`}>{insights.skillMatch}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-neon-pink transition-all duration-500" style={{ width: `${insights.skillMatch}%` }} />
                      </div>
                    </div>

                    {/* Career Path Fit */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Career Path Fit</p>
                      <Badge variant="outline" className="bg-neon-cyan/10 text-neon-cyan border-neon-cyan">
                        {insights.careerFit}
                      </Badge>
                    </div>

                    {/* AI Summary */}
                    <div className="glass rounded-lg p-3 bg-white/5">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Summary
                      </p>
                      <p className="text-sm text-white">{insights.summary}</p>
                    </div>

                    {/* Improvement Suggestions */}
                    {/* {insights.improvements.length > 0 && (
                      <div className="mt-3 glass rounded-lg p-3 bg-neon-yellow/5 border border-neon-yellow/20">
                        <p className="text-xs text-neon-yellow mb-2">💡 To improve your match:</p>
                        <ul className="text-xs text-white space-y-1">
                          {insights.improvements.map((improvement, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-neon-yellow">•</span>
                              <span>Learn {improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )} */}
                  </div>

                  {/* Bottom Section */}
                  <div className="p-4 lg:p-6">
                    {/* Benefits */}
                    {/* {job.benefits && job.benefits.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-white mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-neon-yellow" />
                          Benefits & Perks
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.benefits.slice(0, 4).map((benefit, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-white/5">
                              {benefit}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )} */}

                    {/* Company Rating */}
                    {/* {job.companyInfo?.rating && (
                      <div className="mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-neon-yellow fill-neon-yellow" />
                        <span className="text-sm text-white">{job.companyInfo.rating.toFixed(1)}</span>
                        {job.companyInfo.reviews && <span className="text-xs text-muted-foreground">({job.companyInfo.reviews.toLocaleString()} reviews)</span>}
                      </div>
                    )} */}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button  className="w-full gradient-animated text-black hover:opacity-90">
                        Apply Now
                      </Button>
                      <Button variant="outline" onClick={() => onRemoveJob(job.id)} className="w-full text-muted-foreground hover:text-white">
                        Remove from Comparison
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex flex-col lg:flex-row gap-4 items-center justify-center">
          <Button variant="outline" onClick={handleSaveComparison} className="w-full lg:w-auto">
            <Save className="w-4 h-4 mr-2" />
            {savedComparison ? "Comparison Saved!" : "Save for Later"}
          </Button>
          <Button variant="outline" onClick={handleShareComparison} className="w-full lg:w-auto">
            <Share2 className="w-4 h-4 mr-2" />
            Share with Mentor
          </Button>
        </div>
      </div>
    </div>
  );
}
