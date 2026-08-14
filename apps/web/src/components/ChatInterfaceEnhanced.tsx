import { Bot, Menu, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "./ChatInput";
import { EnhancedAIResponse } from "./EnhancedAIResponse";
import { FeedbackButtons } from "./FeedbackButtons";
import { Button } from "./ui/button";
import { Job } from "@/types/job";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  enhancedResponse?: {
    type: "skill-gap" | "comparison" | "career-forecast" | "interview-prep" | "qelsa-score";
    data: any;
  };
  suggestedPrompts?: string[];
}

interface ChatInterfaceEnhancedProps {
  contextJobs?: Job[];
  onMenuClick: () => void;
  onProfileClick?: () => void;
  onViewJob?: (jobId: string) => void;
  onApplyJob?: (jobId: string) => void;
  onViewAllJobs?: () => void;
}

export function ChatInterfaceEnhanced({ contextJobs = [], onMenuClick, onProfileClick, onViewJob, onApplyJob, onViewAllJobs }: ChatInterfaceEnhancedProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate AI responses based on query type
  const generateAIResponse = (query: string, jobIds?: string[]): Message => {
    const lowerQuery = query.toLowerCase();
    const relevantJobs = jobIds ? contextJobs.filter((j) => jobIds.includes(String(j.id))) : contextJobs;

    // Skill Gap Analysis
    if ((lowerQuery.includes("skill") && lowerQuery.includes("missing")) || lowerQuery.includes("skill gap")) {
      const job = relevantJobs[0];
      return {
        id: Date.now().toString(),
        type: "assistant",
        content: `I've analyzed your profile against the ${job.title} role at ${job.company_name}. Here's your personalized skill fit analysis:`,
        enhancedResponse: {
          type: "skill-gap",
          data: {
            job,
            matchedSkills: ["React", "TypeScript", "Node.js", "Git", "Agile"],
            missingSkills: ["GraphQL", "Docker", "AWS"],
            matchPercentage: 78,
            recommendations: [
              { skill: "GraphQL", priority: "high", course: "GraphQL Mastery Course" },
              { skill: "Docker", priority: "high", course: "Docker for Developers" },
              { skill: "AWS", priority: "medium", course: "AWS Certified Developer" },
            ],
          },
        },
        suggestedPrompts: ["Create a 2-week learning plan for these skills", "Show me online courses for GraphQL", "Prepare interview questions for this role"],
      };
    }

    // Job Comparison
    if (lowerQuery.includes("compare") && relevantJobs.length >= 2) {
      return {
        id: Date.now().toString(),
        type: "assistant",
        content: `I've compared ${relevantJobs.length} jobs side-by-side using AI analysis. Here's what I found:`,
        enhancedResponse: {
          type: "comparison",
          data: {
            jobs: relevantJobs.slice(0, 4),
            winner: {
              salary: relevantJobs[0].id,
              growth: relevantJobs[1]?.id || relevantJobs[0].id,
              workLife: relevantJobs[0].id,
              stability: relevantJobs[0].id,
            },
            recommendation: `Based on your profile and career goals, ${relevantJobs[0].title} at ${relevantJobs[0].company_name} offers the best overall fit. It provides strong salary potential (${relevantJobs[0].salary}), excellent growth opportunities, and aligns well with your skill set. The role is also from ${relevantJobs[0].resource}, giving you direct access to verified opportunities.`,
          },
        },
        suggestedPrompts: ["Show me detailed comparison with custom weights", "What are the career paths for these roles?", "Help me prepare for interviews at these companies"],
      };
    }

    // Career Path Forecast
    if (lowerQuery.includes("career path") || lowerQuery.includes("career forecast")) {
      const job = relevantJobs[0];
      return {
        id: Date.now().toString(),
        type: "assistant",
        content: `Here's your personalized career path forecast for becoming a ${job.title}:`,
        enhancedResponse: {
          type: "career-forecast",
          data: {
            currentRole: "Junior Developer",
            targetRole: job.title,
            timelineMonths: 18,
            successRate: 82,
            steps: [
              {
                title: "Master Core Technologies",
                duration: "3-4 months",
                skills: ["Advanced React", "State Management", "Testing"],
              },
              {
                title: "Build Portfolio Projects",
                duration: "2-3 months",
                skills: ["Full-Stack Apps", "CI/CD", "Cloud Deployment"],
              },
              {
                title: "Gain Leadership Experience",
                duration: "6-8 months",
                skills: ["Code Reviews", "Mentoring", "Technical Decisions"],
              },
              {
                title: "Interview & Transition",
                duration: "3-4 months",
                skills: ["System Design", "Behavioral Interview", "Salary Negotiation"],
              },
            ],
          },
        },
        suggestedPrompts: ["Create a detailed learning roadmap", "Find courses for these skills", "Show me similar career transitions"],
      };
    }

    // Interview Preparation
    if (lowerQuery.includes("interview") || lowerQuery.includes("prepare")) {
      const job = relevantJobs[0];
      return {
        id: Date.now().toString(),
        type: "assistant",
        content: `I've created a comprehensive interview preparation plan for ${job.title} at ${job.company_name}:`,
        enhancedResponse: {
          type: "interview-prep",
          data: {
            jobTitle: job.title,
            company: job.company_name,
            estimatedPrepTime: "2 weeks",
            topics: [
              {
                category: "Technical Questions",
                questions: [
                  "Explain the virtual DOM and how React uses it for optimization",
                  "How do you handle state management in large React applications?",
                  "What are React hooks and when would you create custom hooks?",
                  "Describe your experience with TypeScript and its benefits",
                  "How do you optimize React application performance?",
                ],
              },
              {
                category: "System Design",
                questions: [
                  "Design a scalable notification system",
                  "How would you architect a real-time chat application?",
                  "Explain your approach to API design and versioning",
                  "Design a caching strategy for a high-traffic web application",
                ],
              },
              {
                category: "Behavioral Questions",
                questions: [
                  "Tell me about a challenging bug you solved recently",
                  "Describe a time when you had to learn a new technology quickly",
                  "How do you handle disagreements with team members?",
                  "Share an example of how you improved code quality in your team",
                ],
              },
              {
                category: "Company-Specific",
                questions: [
                  `Why do you want to work at ${job.company_name}?`,
                  "What do you know about our products and services?",
                  "How would you contribute to our engineering culture?",
                  "Where do you see yourself in 3-5 years at our company?",
                ],
              },
            ],
          },
        },
        suggestedPrompts: ["Generate sample answers for these questions", "Show me coding challenges for this role", "What should I ask the interviewer?"],
      };
    }

    // Qelsa Score Analysis
    if (lowerQuery.includes("match") || lowerQuery.includes("fit") || lowerQuery.includes("score")) {
      const job = relevantJobs[0];
      return {
        id: Date.now().toString(),
        type: "assistant",
        content: `I've calculated your Qelsa Score for ${job.title} at ${job.company_name}. This AI-powered analysis considers multiple factors:`,
        enhancedResponse: {
          type: "qelsa-score",
          data: {
            job,
            score: {
              overall: 85,
              breakdown: {
                skillMatch: 88,
                salaryFit: 92,
                growthPotential: 85,
                workLifeBalance: 78,
                companyStability: 82,
              },
            },
            insights: [
              "Strong technical skill alignment (88%) - Your React and TypeScript expertise matches 9 out of 10 required skills",
              "Excellent salary fit (92%) - The offered range ₹15-25 LPA aligns perfectly with your experience level",
              "High growth potential (85%) - This role offers clear progression to Tech Lead within 18-24 months",
              "The company is a verified Qelsa partner with excellent track record of employee growth and satisfaction",
            ],
          },
        },
        suggestedPrompts: ["Show me the skills I need to develop", "Compare this with other opportunities", "Create interview preparation plan"],
      };
    }

    // Default response
    return {
      id: Date.now().toString(),
      type: "assistant",
      content: `I can help you with that! I have access to ${contextJobs.length} relevant job${contextJobs.length !== 1 ? "s" : ""} and can provide:

• **Skill Gap Analysis** - See which skills you have and which you need
• **Job Comparisons** - Compare opportunities side-by-side with AI insights
• **Career Forecasting** - Map your path to your dream role
• **Interview Preparation** - Get personalized questions and prep plans
• **Qelsa Scores** - AI-powered fit analysis for each role

What would you like to explore?`,
      suggestedPrompts: [`Analyze my fit for ${contextJobs[0]?.title || "these roles"}`, "Compare the top jobs for me", "Show me skill gaps for these opportunities", "Create interview prep plan"],
    };
  };

  const handleSendMessage = async (content: string, jobIds?: string[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      const aiResponse = generateAIResponse(content, jobIds);
      setMessages((prev) => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleAction = (action: string, payload?: any) => {
    switch (action) {
      case "apply":
        onApplyJob?.(payload.jobId);
        break;
      case "view-job":
        onViewJob?.(payload.jobId);
        break;
      case "view-full-comparison":
        onViewAllJobs?.();
        break;
      case "prep-plan":
        handleSendMessage(`Create a detailed preparation plan for job ${payload.jobId}`);
        break;
      case "similar":
        handleSendMessage(`Show me similar jobs to ${payload.jobId}`);
        break;
      case "course":
        handleSendMessage(`Recommend courses for skills needed in ${payload.jobId}`);
        break;
    }
  };

  const handlePositiveFeedback = async (messageId: string) => {
    console.log("Positive feedback for message:", messageId);
  };

  const handleNegativeFeedback = async (messageId: string) => {
    console.log("Negative feedback for message:", messageId);
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

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-8">
        {messages.length === 0 && (
          <div className="text-center space-y-8 mt-12">
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full glass flex items-center justify-center mx-auto glow-cyan">
                <Bot className="h-10 w-10 text-neon-cyan" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent mb-2">Enhanced AI Job Assistant</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Get personalized insights, skill analysis, and career guidance powered by AI.
                  {contextJobs.length > 0 && ` I'm analyzing ${contextJobs.length} job${contextJobs.length !== 1 ? "s" : ""} for you.`}
                </p>
              </div>
            </div>

            {/* Context-aware prompts */}
            {contextJobs.length > 0 && (
              <div className="space-y-4 max-w-2xl mx-auto">
                <h3 className="font-semibold text-foreground">Based on these jobs, you can ask:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    `What skills am I missing for ${contextJobs[0].title}?`,
                    contextJobs.length >= 2 ? `Compare top ${Math.min(contextJobs.length, 4)} jobs` : `Show me career path for ${contextJobs[0].title}`,
                    `Prepare me for ${contextJobs[0].company_name} interview`,
                    `Which job best matches my profile?`,
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-3 text-sm glass border-glass-border rounded-lg hover:glass-strong hover:glow-cyan transition-all duration-300 text-left group"
                    >
                      <span className="text-muted-foreground group-hover:text-neon-cyan transition-colors">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                {/* AI Response */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0 glow-cyan">
                    <Bot className="h-4 w-4 text-neon-cyan" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="glass border-glass-border rounded-2xl px-4 py-3">
                      <p className="text-foreground">{message.content}</p>
                    </div>

                    {/* Enhanced Response Component */}
                    {message.enhancedResponse && <EnhancedAIResponse type={message.enhancedResponse.type} data={message.enhancedResponse.data} onAction={handleAction} />}

                    {/* Suggested Prompts */}
                    {message.suggestedPrompts && message.suggestedPrompts.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">You might also want to:</p>
                        <div className="flex flex-wrap gap-2">
                          {message.suggestedPrompts.map((prompt, index) => (
                            <button
                              key={index}
                              onClick={() => handleSendMessage(prompt)}
                              className="text-sm px-3 py-1.5 glass border-glass-border rounded-lg hover:glass-strong hover:border-neon-cyan/50 hover:text-neon-cyan transition-all duration-300"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Feedback Buttons */}
                    <FeedbackButtons messageId={message.id} onPositiveFeedback={handlePositiveFeedback} onNegativeFeedback={handleNegativeFeedback} className="" />
                  </div>
                </div>
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
              <span className="text-muted-foreground text-sm">AI is analyzing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="relative z-10 border-t border-glass-border bg-glass-bg/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput onSendMessage={(content) => handleSendMessage(content)} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
