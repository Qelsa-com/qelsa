import { ArrowRight, Bot, ChevronDown, Menu, Search, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AIResponseBlock } from "./AIResponseBlock";
import { ChatInput } from "./ChatInput";
import { FeedbackButtons } from "./FeedbackButtons";
import { FeedbackModal } from "./FeedbackModal";
import { JobDetailsModal } from "./job/JobDetailsModal";
import { JobFitModal } from "./job/JobFitModal";
import { Button } from "./ui/button";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  responses?: ResponseData[];
  reasoning?: string;
  suggestedPrompts?: string[];
}

interface ResponseData {
  id: string;
  title: string;
  description: string;
  relevance: string;
  actionLabel: string;
  actionType: "view" | "learn" | "apply";
  category: "student" | "professional" | "job" | "skill";
  source?: {
    platform: "Qelsa" | "LinkedIn" | "Indeed" | "Naukri" | "AngelList" | "Glassdoor";
    verified?: boolean;
    exclusive?: boolean;
  };
  jobDetails?: {
    company: string;
    location: string;
    salary: string;
    workType: string;
    experience: string;
    responsibilities: string[];
    requirements: string[];
    preferred: string[];
    benefits: string[];
  };
}

// Plugin initial prompts
const pluginPrompts: { [key: string]: string } = {
  "weekly-planner":
    "Hi! I'm your Qelsa Weekly Goal Planner. Let's create actionable career goals for this week. What would you like to focus on? (job applications, skill development, networking, or something else?)",
  "resume-optimizer":
    "Welcome to Qelsa Resume Optimizer! I'll help you create a standout resume. Please share your current resume or tell me about your background, and I'll provide tailored recommendations.",
  "interview-coach":
    "Hello! I'm your Qelsa Interview Coach. Let's prepare you for success! What type of interview would you like to practice? (behavioral, technical, case study, or general questions?)",
  "salary-insights": "Hi! I'm your Qelsa Salary Insights advisor. I can help with market rates, negotiation strategies, and compensation analysis. What's your role, experience level, and location?",
  "skill-roadmap":
    "Welcome to Qelsa Skill Roadmap! I'll create a personalized learning path for you. What's your current role and where do you want to grow? (new skills, career transition, or advancement?)",
  "networking-assistant":
    "Hello! I'm your Qelsa Networking Assistant. I'll help you build meaningful professional connections. Are you looking to expand your network, reach out to someone specific, or attend networking events?",
  "career-tracker": "Hi! I'm your Qelsa Career Tracker. Let's analyze your career progress and plan your next moves. Tell me about your current role and career goals.",
  "company-insights":
    "Welcome to Qelsa Company Research! I'll help you understand companies inside and out. Which company would you like to research? I can provide culture insights, interview tips, and growth opportunities.",
};

const mockResponses: { [key: string]: ResponseData[] } = {
  "career options": [
    {
      id: "1",
      title: "Financial Analyst",
      description: "Analyze financial data, create reports, and provide investment recommendations for businesses.",
      relevance: "Perfect fit for B.Com graduates with strong analytical and numerical skills.",
      actionLabel: "View Jobs",
      actionType: "view",
      category: "professional",
    },
    {
      id: "2",
      title: "Chartered Accountant (CA)",
      description: "Professional certification path for accounting, auditing, and financial management.",
      relevance: "Natural progression for B.Com students wanting advanced accounting expertise.",
      actionLabel: "Learn More",
      actionType: "learn",
      category: "student",
    },
  ],
  "product manager jobs": [
    {
      id: "4",
      title: "Product Manager - Fintech",
      description: "Lead product strategy and development for next-generation digital payment solutions at a leading fintech startup.",
      relevance: "Perfect match for analytical professionals transitioning to product roles in financial services.",
      actionLabel: "Apply Now",
      actionType: "apply",
      category: "job",
      source: {
        platform: "Qelsa",
        verified: true,
        exclusive: true,
      },
      jobDetails: {
        company: "PayNxt Technologies",
        location: "Bangalore, Karnataka",
        salary: "₹15-25 LPA",
        workType: "Hybrid (3 days office)",
        experience: "2-4 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
  ],
};

interface ChatInterfaceProps {
  activeFilter: string;
  onMenuClick: () => void;
  onViewAllJobs?: (searchQuery: string, jobResults?: ResponseData[]) => void;
  onNavigateToProfile?: () => void;
  onProfileClick?: () => void;
  selectedPlugin?: { id: string; name: string } | null;
  onClearPlugin?: () => void;
}

export function ChatInterfaceWithFeedback({ activeFilter, onMenuClick, onViewAllJobs, onNavigateToProfile, onProfileClick, selectedPlugin, onClearPlugin }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [lastJobResults, setLastJobResults] = useState<ResponseData[]>([]);
  const [showMorePrompts, setShowMorePrompts] = useState(false);
  const [jobFitModal, setJobFitModal] = useState<{ isOpen: boolean; jobId: string; jobTitle: string }>({
    isOpen: false,
    jobId: "",
    jobTitle: "",
  });
  const [jobDetailsModal, setJobDetailsModal] = useState<{ isOpen: boolean; jobId: string }>({
    isOpen: false,
    jobId: "",
  });
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; messageId: string; messageContent: string }>({
    isOpen: false,
    messageId: "",
    messageContent: "",
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle plugin selection
  useEffect(() => {
    if (selectedPlugin && pluginPrompts[selectedPlugin.id]) {
      const pluginMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: pluginPrompts[selectedPlugin.id],
      };
      setMessages((prev) => [...prev, pluginMessage]);
    }
  }, [selectedPlugin]);

  // Feedback handlers
  const handlePositiveFeedback = async (messageId: string) => {
    console.log("Positive feedback for message:", messageId);
    const feedbackData = {
      messageId,
      rating: "positive" as const,
      timestamp: Date.now(),
    };
    localStorage.setItem(`feedback_${messageId}`, JSON.stringify(feedbackData));
  };

  const handleNegativeFeedback = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setFeedbackModal({
        isOpen: true,
        messageId,
        messageContent: message.content,
      });
    }
  };

  const handleSubmitDetailedFeedback = async (feedbackData: any) => {
    console.log("Detailed feedback submitted:", feedbackData);
    localStorage.setItem(`feedback_${feedbackData.messageId}`, JSON.stringify(feedbackData));
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      messageId: "",
      messageContent: "",
    });
  };

  const handleCheckFit = (jobId: string, jobTitle: string) => {
    setJobFitModal({
      isOpen: true,
      jobId,
      jobTitle,
    });
  };

  const closeJobFitModal = () => {
    setJobFitModal({
      isOpen: false,
      jobId: "",
      jobTitle: "",
    });
  };

  const handleViewJobDetails = (jobId: string) => {
    setJobDetailsModal({
      isOpen: true,
      jobId,
    });
  };

  const closeJobDetailsModal = () => {
    setJobDetailsModal({
      isOpen: false,
      jobId: "",
    });
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setLastSearchQuery(content);

    // Simulate AI processing
    setTimeout(() => {
      const lowerContent = content.toLowerCase();
      let responses: ResponseData[] = [];
      let reasoning = "";

      if (lowerContent.includes("career") || lowerContent.includes("options")) {
        responses = mockResponses["career options"];
        reasoning = `**🎯 Market Intelligence Analysis:**

I analyzed 12,000+ job postings and career transition data to curate these recommendations:

**📊 Industry Growth Indicators:**
• Financial services: 23% hiring growth (Q4 2024)
• Average placement rate: 85% for B.Com graduates in finance
• Salary growth: 15-20% annually for analytical roles

**🧠 Skills Alignment Score:**
• Your academic background matches 90% of required qualifications
• Analytical and numerical skills are in high demand
• Strong career progression paths available

**💡 Personalization Factors:**
• Filtered based on career goals and preferences
• Ranked by long-term growth potential
• Matched against similar successful career transitions`;
      } else if (lowerContent.includes("product manager")) {
        responses = mockResponses["product manager jobs"];
        reasoning = `**🎯 Product Manager Role Analysis:**

Analyzed 3,500+ PM positions across India's tech ecosystem:

**🏙️ Geographic Intelligence:**
• Bangalore: 42% of PM opportunities (tech hub advantage)
• Mumbai & Delhi: 28% combined (fintech & enterprise focus)
• Hyderabad & Pune: 18% (emerging tech centers)

**💰 Compensation Insights:**
• Entry Level (0-2 yrs): ₹12-18 LPA + equity
• Mid Level (3-5 yrs): ₹20-35 LPA + 0.1-0.5% equity
• Senior Level (5+ yrs): ₹35-50+ LPA + 0.2-0.8% equity

**🚀 Hiring Trends:**
• 67% of companies prioritizing PM hires in 2024
• Fintech & AI/ML companies showing highest demand
• Remote-first policies increasing opportunities by 34%`;
      } else {
        responses = [];
        reasoning = `**🤖 AI Assistant Capabilities:**

I leverage real-time market data and career analytics to provide personalized guidance:

**🎯 What I Can Help With:**
• **Smart Job Matching** - Find roles aligned with your skills and goals
• **Market Intelligence** - Salary insights, hiring trends, company culture
• **Career Planning** - Skill development roadmaps and transition strategies
• **Interview Prep** - Industry-specific questions and best practices

**📊 Data Sources:**
• 50,000+ job postings updated daily
• 10,000+ verified salary reports
• Career progression patterns from 100,000+ professionals

Ready to accelerate your career journey? Ask me anything!`;
      }

      const filteredResponses = activeFilter === "all" ? responses : responses.filter((r) => r.category === activeFilter.replace("_", ""));

      const jobResponses = filteredResponses.filter((r) => r.category === "job");
      if (jobResponses.length > 0) {
        setLastJobResults(jobResponses);
      }

      // Generate contextual suggested prompts
      const suggestedPrompts =
        lowerContent.includes("career") || lowerContent.includes("options")
          ? ["What are the salary ranges for these roles?", "Show me entry-level positions in finance", "What skills do I need to develop?"]
          : lowerContent.includes("product manager")
          ? ["Find remote product manager jobs", "What skills make a great PM?", "Compare PM salaries in different cities"]
          : ["Find jobs in my field", "Help me update my resume", "Plan my career transition"];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `I've analyzed your request and found ${filteredResponses.length} relevant ${
          filteredResponses.length === 1 ? "recommendation" : "recommendations"
        } based on current market data and your profile.`,
        responses: filteredResponses,
        reasoning,
        suggestedPrompts,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const getCurrentJob = () => {
    for (const message of messages) {
      if (message.responses) {
        const job = message.responses.find((r) => r.id === jobDetailsModal.jobId);
        if (job) return job;
      }
    }
    return null;
  };

  const handleApplyFromModal = () => {
    console.log("Apply clicked from modal");
    closeJobDetailsModal();
  };

  const handleCheckFitFromModal = () => {
    const currentJob = getCurrentJob();
    if (currentJob) {
      closeJobDetailsModal();
      handleCheckFit(jobDetailsModal.jobId, currentJob.title);
    }
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Simplified background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-neon-cyan/3 rounded-full blur-xl opacity-50"></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-neon-purple/3 rounded-full blur-xl opacity-50"></div>
      </div>

      {/* Mobile menu trigger */}
      <div className="lg:hidden absolute top-4 left-4 z-20">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="glass rounded-xl hover:glass-strong hover:glow-cyan transition-all duration-300">
          <Menu className="h-5 w-5 text-neon-cyan" />
        </Button>
      </div>

      {/* Mobile profile menu */}
      <div className="lg:hidden absolute top-4 right-4 z-20">
        <Button variant="ghost" size="icon" onClick={onProfileClick} className="glass rounded-xl hover:glass-strong hover:glow-purple transition-all duration-300">
          <User className="h-5 w-5 text-neon-purple" />
        </Button>
      </div>

      {/* Active Plugin Indicator */}
      {selectedPlugin && (
        <div className="relative z-10 border-b border-glass-border bg-glass-bg/50 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between glass border-glass-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-black" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Active: {selectedPlugin.name}</p>
                  <p className="text-xs text-muted-foreground">AI Co-Pilot Plugin</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClearPlugin} className="text-muted-foreground hover:text-neon-cyan">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-8">
        {messages.length === 0 && !selectedPlugin && (
          <div className="text-center space-y-8 mt-12">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full glass flex items-center justify-center mx-auto glow-cyan">
                <Bot className="h-10 w-10 text-neon-cyan" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-2">Welcome to Qelsa AI</h2>
                <p className="text-muted-foreground max-w-md mx-auto">Your intelligent career companion. Ask me about job opportunities, career transitions, skill development, or salary insights.</p>
              </div>
            </div>

            {/* Example Prompts */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Try these prompts:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  "Show me career options for B.Com graduates",
                  "Find product manager jobs in Bangalore",
                  "Help me transition from sales to marketing",
                  "What skills do I need for data science?",
                  "What are the highest paying tech jobs in India?",
                  "How do I negotiate salary in job interviews?",
                ]
                  .slice(0, showMorePrompts ? 6 : 4)
                  .map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 text-sm glass border-glass-border rounded-lg hover:glass-strong hover:glow-cyan transition-all duration-300 text-left group"
                    >
                      <div className="space-y-1">
                        <span className="text-muted-foreground group-hover:text-neon-cyan transition-colors block">{prompt}</span>
                        <span className="text-xs text-muted-foreground/70 group-hover:text-neon-cyan/70 transition-colors block">
                          {index === 0 && "Get career recommendations"}
                          {index === 1 && "Find relevant opportunities"}
                          {index === 2 && "Career transition guidance"}
                          {index === 3 && "Skill development roadmap"}
                          {index === 4 && "Salary insights and trends"}
                          {index === 5 && "Interview preparation tips"}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>

              {!showMorePrompts && (
                <Button variant="ghost" onClick={() => setShowMorePrompts(true)} className="text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/10">
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View More
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <div key={message.id} className="space-y-4">
            {message.type === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-2xl glass border-glass-border rounded-2xl px-4 py-3">
                  <p className="text-foreground">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Response Block */}
                <AIResponseBlock
                  summary={message.content}
                  responses={message.responses || []}
                  reasoning={message.reasoning}
                  suggestedPrompts={message.suggestedPrompts}
                  onCheckFit={handleCheckFit}
                  onViewJobDetails={handleViewJobDetails}
                  onSendPrompt={handleSendMessage}
                />

                {/* Feedback Buttons for AI messages */}
                <div className="ml-12">
                  <FeedbackButtons messageId={message.id} onPositiveFeedback={handlePositiveFeedback} onNegativeFeedback={handleNegativeFeedback} className="" />
                </div>

                {/* View All Jobs Button */}
                {message.responses && message.responses.some((r) => r.category === "job") && (
                  <div className="ml-12 flex justify-center pt-4">
                    <Button
                      onClick={() => onViewAllJobs?.(lastSearchQuery, lastJobResults)}
                      className="bg-neon-cyan text-black hover:bg-neon-cyan/90 px-6 py-2 rounded-lg flex items-center gap-2 transition-all duration-300"
                    >
                      <Search className="h-4 w-4" />
                      View All Jobs
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0 glow-cyan">
              <Bot className="h-4 w-4 text-neon-cyan" />
            </div>
            <div className="glass border-glass-border rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
              <span className="text-muted-foreground text-sm">AI is analyzing your request...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="relative z-10 border-t border-glass-border bg-glass-bg/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>

      {/* Modals */}
      <JobFitModal isOpen={jobFitModal.isOpen} onClose={closeJobFitModal} jobId={jobFitModal.jobId} jobTitle={jobFitModal.jobTitle} />

      {jobDetailsModal.isOpen &&
        (() => {
          const currentJob = getCurrentJob();
          return currentJob && currentJob.jobDetails ? (
            <JobDetailsModal
              isOpen={jobDetailsModal.isOpen}
              onClose={closeJobDetailsModal}
              jobTitle={currentJob.title}
              jobDescription={currentJob.description}
              jobDetails={currentJob.jobDetails}
              onApply={handleApplyFromModal}
              onCheckFit={handleCheckFitFromModal}
            />
          ) : null;
        })()}

      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={closeFeedbackModal}
        onSubmitFeedback={handleSubmitDetailedFeedback}
        messageId={feedbackModal.messageId}
        messageContent={feedbackModal.messageContent}
      />
    </div>
  );
}
