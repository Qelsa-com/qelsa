import { X, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Job } from '@/types/job';

interface CompareJobsTrayProps {
  jobs: Job[];
  onRemoveJob: (jobId: number) => void;
  onCompare: () => void;
  onClear: () => void;
}

export function CompareJobsTray({ jobs, onRemoveJob, onCompare, onClear }: CompareJobsTrayProps) {
  if (jobs.length === 0) return null;

  const getSourceColor = (platform: string) => {
    switch (platform) {
      case 'Qelsa': return 'border-neon-cyan text-neon-cyan';
      case 'LinkedIn': return 'border-blue-500 text-blue-400';
      case 'Indeed': return 'border-blue-600 text-blue-400';
      case 'Naukri': return 'border-purple-500 text-purple-400';
      case 'AngelList': return 'border-gray-400 text-gray-300';
      case 'Glassdoor': return 'border-green-500 text-green-400';
      default: return 'border-gray-400 text-gray-300';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:bottom-4 lg:left-4 lg:right-4 lg:max-w-6xl lg:mx-auto">
      <div className="glass-strong border border-glass-border rounded-t-2xl lg:rounded-2xl shadow-2xl">
        <div className="px-4 py-3 lg:px-6 lg:py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-cyan" />
              <h3 className="text-white">
                Compare Jobs ({jobs.length}/{jobs.length >= 4 ? '4 max' : '4'})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-muted-foreground hover:text-white"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 mb-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="glass rounded-xl p-3 relative group hover:bg-white/10 transition-all"
              >
                <button
                  onClick={() => onRemoveJob(job.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                
                <div className="flex items-start gap-2">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    {job.company_logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={job.company_logo} alt={job.company_name || job.page?.name} className="w-8 h-8 rounded object-cover" />
                    ) : (
                      <span className="text-xs">{job.company_name?.charAt(0) || job.page?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-1">{job.job_title?.name ?? job.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{job.company_name || job.page?.name}</p>
                    <div className={`text-xs mt-1 ${getSourceColor(job.resource)}`}>
                      {job.resource}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 4 - jobs.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="border-2 border-dashed border-glass-border rounded-xl p-3 flex items-center justify-center"
              >
                <p className="text-xs text-muted-foreground">Add job {jobs.length + i + 1}</p>
              </div>
            ))}
          </div>

          {/* Compare Button */}
          <Button
            onClick={onCompare}
            disabled={jobs.length < 2}
            className="w-full gradient-animated text-black hover:opacity-90 transition-opacity"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Compare {jobs.length} Jobs
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          {jobs.length < 2 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Add at least 2 jobs to compare
            </p>
          )}
        </div>
      </div>
    </div>
  );
}