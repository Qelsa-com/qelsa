import { ChevronUp, FileText, Lightbulb, RotateCcw, Send, Sparkles, Target, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import type { Job } from "@/types/job";

interface JobAIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedJob: Job | null;
  jobs: Job[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  {
    icon: FileText,
    title: "Summarize this job",
    prompt: "Summarize this job in 5 bullets and list must-have vs nice-to-have skills",
    color: "cyan",
  },
  {
    icon: Target,
    title: "Estimate my fit",
    prompt: "Estimate my fit for this role and explain any skill gaps",
    color: "purple",
  },
  {
    icon: Sparkles,
    title: "Extract ATS keywords",
    prompt: "Extract ATS keywords from this posting that I should use in my resume",
    color: "pink",
  },
  {
    icon: FileText,
    title: "Draft cover letter",
    prompt: "Draft a 150-word cover letter for this role using my profile",
    color: "green",
  },
];

export function JobAIAssistantDrawer({ isOpen, onClose, selectedJob, jobs }: JobAIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset when drawer closes or job changes
  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setInput("");
      setShowSuggestions(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedJob && messages.length === 0) {
      setShowSuggestions(true);
    }
  }, [selectedJob, messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setShowSuggestions(false);

    // Simulate AI response based on prompt
    setTimeout(() => {
      const aiResponse = generateAIResponse(text, selectedJob);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const generateAIResponse = (prompt: string, job: Job | null): string => {
    if (!job) {
      return "Please select a job card first to get contextual assistance. Click on any job listing, then ask me questions about it.";
    }

    const promptLower = prompt.toLowerCase();

    // Summarize job
    if (promptLower.includes("summarize")) {
      return `**${job.title} at ${job.company_name}**

**Key Highlights:**
• ${job.work_type} role in ${job.location}
• ${job.experience} of experience required
• Salary range: ${job.salary || "Competitive compensation"}
• ${job.applications?.length ?? 0} applications so far

**Must-Have Skills:**
${
  job.requiredSkills
    ?.slice(0, 3)
    .map((skill) => `• ${skill}`)
    .join("\n") ||
  job.skills
    .slice(0, 3)
    .map((skill) => `• ${skill}`)
    .join("\n")
}

**Nice-to-Have Skills:**
${
  job.preferredSkills
    ?.slice(0, 3)
    .map((skill) => `• ${skill}`)
    .join("\n") ||
  job.skills
    .slice(3)
    .map((skill) => `• ${skill}`)
    .join("\n")
}

**AI Summary:** ${job.aiSummary}`;
    }

    // Fit scoring
    if (promptLower.includes("fit") || promptLower.includes("gap")) {
      const fitScore = job.fitScore || 75;
      const gaps = job.skillsGap || [];
      return `**Fit Analysis for ${job.title}**

**Overall Fit Score: ${fitScore}%** ${fitScore >= 80 ? "🟢" : fitScore >= 60 ? "🟡" : "🔴"}

**Strong Matches:**
${job.skills
  .slice(0, 3)
  .map((skill) => `• ${skill} - You have proven experience`)
  .join("\n")}

**Skill Gaps to Address:**
${gaps.length > 0 ? gaps.map((gap) => `• ${gap} - Consider highlighting transferable skills or taking a quick course`).join("\n") : "• No major gaps identified!"}

**Recommendation:** ${
        fitScore >= 80
          ? "Strong match! Apply with confidence."
          : fitScore >= 60
          ? "Good match. Tailor your resume to emphasize relevant experience."
          : "Consider upskilling in gap areas before applying."
      }

**Next Steps:**
1. Update resume to highlight ${job.skills[0]} and ${job.skills[1]} experience
2. Prepare examples of projects using these technologies
3. ${gaps.length > 0 ? `Research ${gaps[0]} basics to discuss in interview` : "Review the company culture and values"}`;
    }

    // Extract keywords
    if (promptLower.includes("keyword") || promptLower.includes("ats")) {
      return `**ATS Keywords for ${job.title}**

**Technical Skills (High Priority):**
${job.skills
  .slice(0, 5)
  .map((skill, i) => `${i + 1}. ${skill}`)
  .join("\n")}

**Role-Specific Terms:**
• ${job.title}
• ${job.experience}
• ${job.work_type}
• Team collaboration
• Agile methodology

**Action Verbs to Use:**
• Developed, Built, Designed, Implemented
• Optimized, Streamlined, Enhanced
• Collaborated, Led, Mentored
• Delivered, Shipped, Launched

**How to Use:**
1. Include these keywords naturally in your resume experience bullets
2. Mirror the exact phrasing from the job posting when possible
3. Use keywords in your LinkedIn headline and summary
4. Repeat top 3-5 keywords 2-3 times across your resume`;
    }

    // Draft materials
    if (promptLower.includes("draft") || promptLower.includes("cover letter") || promptLower.includes("resume")) {
      return `**Tailored Cover Letter Draft for ${job.title}**

Dear Hiring Manager,

I am excited to apply for the ${job.title} position at ${job.company_name}. With my strong background in ${job.skills[0]} and ${
        job.skills[1]
      }, I am confident I can contribute immediately to your team's success.

In my current role, I have successfully delivered projects using ${job.skills.slice(0, 3).join(", ")}, resulting in improved performance and user satisfaction. I am particularly drawn to ${
        job.company_name
      }'s focus on innovation and cutting-edge technology, which aligns perfectly with my passion for continuous learning.

I would welcome the opportunity to discuss how my experience with ${job.skills[0]} and collaborative approach can benefit your team. Thank you for considering my application.

---

**Resume Summary Bullet Points:**
• Developed scalable applications using ${job.skills.slice(0, 2).join(" and ")}, improving system performance by 40%
• Led cross-functional team of 5 engineers to deliver ${(job.work_type ?? "").toLowerCase()} projects using ${job.skills[2] || "modern frameworks"}
• Implemented best practices for code quality, testing, and deployment automation

**Tips:**
• Customize the metrics with your actual achievements
• Reference specific technologies from the job posting
• Use active voice and quantify results where possible`;
    }

    // Compare roles
    if (promptLower.includes("compare")) {
      const recentJobs = jobs.slice(0, 3);
      return `**Job Comparison Analysis**

${recentJobs
  .map(
    (j, i) => `**${i + 1}. ${j.title} at ${j.company_name}**
• Location: ${j.location} (${j.work_type})
• Experience: ${j.experience}
• Salary: ${j.salary || "Not disclosed"}
• Key Stack: ${j.skills.slice(0, 3).join(", ")}
• Fit Score: ${j.fitScore || 70}%
• Applications: ${j.applications?.length ?? 0}`
  )
  .join("\n\n")}

**Recommendation:**
Apply to the role with the highest fit score first. Focus on ${recentJobs[0].title} as it matches your skills best.`;
    }

    // Application checklist
    if (promptLower.includes("checklist") || promptLower.includes("application")) {
      return `**Application Checklist for ${job.title}**

**Before Applying:**
☐ Resume tailored with ${job.skills.slice(0, 3).join(", ")} keywords
☐ Cover letter references ${job.company_name} specifically
☐ LinkedIn profile updated with relevant skills
☐ Portfolio projects showcase ${job.skills[0]} work

**Resume Optimization:**
☐ Include top 5 keywords: ${job.skills.slice(0, 5).join(", ")}
☐ Quantify achievements (%, $, time saved)
☐ Match job title and seniority level
☐ Proofread for typos and formatting

**Application Materials:**
☐ PDF resume (not Word doc)
☐ Cover letter saved as separate PDF
☐ Portfolio links tested and working
☐ References contacted and ready

**Follow-up Plan:**
☐ Save job posting details
☐ Connect with ${job.company_name} employees on LinkedIn
☐ Set reminder to follow up in 1 week
☐ Prepare for potential interview questions`;
    }

    // Default response
    return `I can help you with this ${job.title} position at ${job.company_name}! Here are some things I can do:

• **Summarize** the role and extract must-have vs nice-to-have skills
• **Analyze your fit** and identify skill gaps
• **Extract ATS keywords** to optimize your resume
• **Draft tailored materials** like cover letters and resume bullets
• **Compare** this role with other jobs you're viewing
• **Create checklists** to ensure your application is complete

What would you like me to help with? Try asking "Summarize this job" or "What's my fit score?"`;
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    handleSendMessage(prompt);
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    setShowSuggestions(true);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case "cyan":
        return "border-neon-cyan/40 hover:border-neon-cyan hover:bg-neon-cyan/10 text-neon-cyan";
      case "purple":
        return "border-neon-purple/40 hover:border-neon-purple hover:bg-neon-purple/10 text-neon-purple";
      case "pink":
        return "border-neon-pink/40 hover:border-neon-pink hover:bg-neon-pink/10 text-neon-pink";
      case "green":
        return "border-neon-green/40 hover:border-neon-green hover:bg-neon-green/10 text-neon-green";
      default:
        return "border-neon-cyan/40 hover:border-neon-cyan hover:bg-neon-cyan/10 text-neon-cyan";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] lg:w-[600px] glass-strong border-l border-glass-border z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-animated flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">AI Job Assistant</h2>
              <p className="text-xs text-muted-foreground">Contextual copilot for smarter job search</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Job Context Bar */}
        {selectedJob && (
          <div className="p-4 border-b border-glass-border bg-neon-cyan/5">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {selectedJob.company_logo && <img src={selectedJob.company_logo} alt={selectedJob.company_name ?? ""} className="w-10 h-10 rounded-lg object-cover border border-glass-border" />}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1">{selectedJob.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedJob.company_name} • {selectedJob.location}
                </p>
                {selectedJob.fitScore && (
                  <div className="flex items-center gap-1 mt-1">
                    <Target className="w-3 h-3 text-neon-cyan" />
                    <span className="text-xs text-neon-cyan">{selectedJob.fitScore}% fit</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl gradient-animated flex items-center justify-center shadow-lg mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{selectedJob ? `Let's optimize your application` : "Select a job to get started"}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {selectedJob
                    ? `I'm here to help you with the ${selectedJob.title} role at ${selectedJob.company_name}. Choose a prompt below or ask me anything!`
                    : "Click on any job card to get personalized assistance with summaries, fit analysis, and application materials."}
                </p>
              </div>

              {/* Suggested Prompts */}
              {selectedJob && showSuggestions && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-neon-yellow" />
                    <span className="text-sm font-medium">Suggested Actions</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {SUGGESTED_PROMPTS.map((item, index) => (
                      <Card
                        key={index}
                        className={`p-4 glass border cursor-pointer transition-all duration-300 hover:scale-[1.02] ${getColorClass(item.color)}`}
                        onClick={() => handlePromptClick(item.prompt)}
                      >
                        <div className="flex items-start gap-3">
                          <item.icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Power Prompts */}
              {selectedJob && showSuggestions && (
                <div className="space-y-3 pt-4 border-t border-glass-border">
                  <button onClick={() => setShowSuggestions(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors">
                    <ChevronUp className="w-4 h-4" />
                    Hide suggestions
                  </button>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">More power prompts to try:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Compare this role with the last 3 jobs I viewed</li>
                      <li>Generate interview questions for this position</li>
                      <li>What does this company mean by &apos;product strategy&apos;?</li>
                      <li>Turn these keywords into resume bullet points</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === "user" ? "gradient-animated text-white" : "glass border-glass-border"}`}>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <span className="text-xs opacity-60 mt-2 block">{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass border-glass-border rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Reset conversation button */}
              {messages.length > 0 && (
                <div className="flex justify-center pt-4">
                  <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground hover:text-neon-cyan">
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Start new conversation
                  </Button>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-glass-border">
          {!selectedJob && (
            <div className="mb-3 p-3 rounded-lg bg-neon-yellow/10 border border-neon-yellow/20">
              <p className="text-xs text-neon-yellow flex items-center gap-2">
                <Lightbulb className="w-4 h-4 flex-shrink-0" />
                Click on a job card to activate contextual assistance
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={selectedJob ? "Ask anything about this job..." : "Select a job first..."}
              disabled={!selectedJob}
              className="min-h-[50px] max-h-[120px] resize-none glass border-glass-border focus:border-neon-cyan/40"
            />
            <Button onClick={() => handleSendMessage()} disabled={!input.trim() || !selectedJob} className="gradient-animated text-white h-[50px] px-4 shrink-0">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Press Enter to send • Shift + Enter for new line</p>
        </div>
      </div>
    </>
  );
}
