import { ArrowRight, ChevronDown, ChevronUp, Menu, Search, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AiMarkdown } from "./ai/AiMarkdown";
import { ChatInput } from "./ChatInput";
import { FeedbackModal } from "./FeedbackModal";
import { ResponseCard } from "./ResponseCard";
import { JobDetailsModal } from "./job/JobDetailsModal";
import { JobFitModal } from "./job/JobFitModal";
import { Button } from "./ui/button";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  responses?: ResponseData[];
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
    {
      id: "3",
      title: "Investment Banking Associate",
      description: "Work on mergers, acquisitions, and capital raising for corporate clients.",
      relevance: "High-growth career leveraging your commerce background and analytical skills.",
      actionLabel: "View Requirements",
      actionType: "view",
      category: "professional",
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
        responsibilities: [
          "Define and execute product roadmap for digital payment features",
          "Collaborate with engineering, design, and business teams",
          "Analyze user behavior and market trends to identify opportunities",
          "Write detailed product requirements and user stories",
          "Monitor product KPIs and optimize for user engagement",
        ],
        requirements: [
          "Bachelor's degree in Business, Engineering, or related field",
          "2+ years in product management, consulting, or business analysis",
          "Strong analytical and problem-solving skills",
          "Experience with data analysis tools (SQL, Excel, Analytics)",
          "Understanding of fintech or payments ecosystem",
        ],
        preferred: ["MBA or relevant advanced degree", "Previous fintech or banking experience", "Technical background or CS fundamentals", "Experience with agile development methodologies"],
        benefits: ["Equity participation in growing startup", "Health insurance for family", "Flexible working hours", "Learning & development budget ₹50K/year"],
      },
    },
    {
      id: "5",
      title: "Senior Product Manager - E-commerce",
      description: "Drive product strategy for India's fastest-growing marketplace platform, focusing on seller tools and buyer experience.",
      relevance: "Senior role ideal for experienced professionals looking to scale e-commerce products.",
      actionLabel: "View Details",
      actionType: "view",
      category: "job",
      source: {
        platform: "LinkedIn",
        verified: false,
      },
      jobDetails: {
        company: "ShopEase India",
        location: "Bangalore, Karnataka",
        salary: "₹20-35 LPA",
        workType: "Remote-first with quarterly team meetups",
        experience: "4-7 years",
        responsibilities: [
          "Own end-to-end product lifecycle for seller onboarding platform",
          "Lead cross-functional teams of 15+ engineers and designers",
          "Drive A/B testing and experimentation framework",
          "Develop go-to-market strategies for new product features",
          "Collaborate with business stakeholders to define success metrics",
        ],
        requirements: [
          "Bachelor's degree in Engineering, Business, or equivalent",
          "4+ years of product management experience",
          "Proven track record of launching successful digital products",
          "Strong technical aptitude and API understanding",
          "Experience with e-commerce, marketplace, or consumer tech",
        ],
        preferred: [
          "Experience at unicorn startups or top-tier tech companies",
          "Background in building B2B or seller-facing products",
          "Knowledge of ML/AI applications in e-commerce",
          "Previous experience managing large engineering teams",
        ],
        benefits: [
          "Stock options with high growth potential",
          "Premium health insurance + wellness budget",
          "Unlimited PTO policy",
          "₹1L annual learning & conference budget",
          "Top-tier laptop and home office setup",
        ],
      },
    },
    {
      id: "6",
      title: "Product Manager - SaaS Platform",
      description: "Build and scale B2B SaaS products for enterprise customers in the HR tech space.",
      relevance: "Great opportunity to work with enterprise clients and build scalable SaaS solutions.",
      actionLabel: "Apply Now",
      actionType: "apply",
      category: "job",
      source: {
        platform: "Qelsa",
        verified: true,
        exclusive: false,
      },
      jobDetails: {
        company: "HRTech Pro",
        location: "Mumbai, Maharashtra",
        salary: "₹18-30 LPA",
        workType: "Hybrid (2 days office)",
        experience: "3-5 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
    {
      id: "7",
      title: "Associate Product Manager",
      description: "Join our product team to work on consumer mobile apps with millions of users.",
      relevance: "Perfect entry-level position for product management with consumer tech focus.",
      actionLabel: "View Details",
      actionType: "view",
      category: "job",
      source: {
        platform: "Indeed",
        verified: true,
      },
      jobDetails: {
        company: "MobileFirst Inc",
        location: "Hyderabad, Telangana",
        salary: "₹12-18 LPA",
        workType: "Remote",
        experience: "1-3 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
    {
      id: "8",
      title: "Product Manager - AI/ML",
      description: "Lead AI-powered product initiatives and work with machine learning engineering teams.",
      relevance: "Emerging field with high growth potential, perfect for tech-savvy product managers.",
      actionLabel: "Apply Now",
      actionType: "apply",
      category: "job",
      source: {
        platform: "Qelsa",
        verified: true,
        exclusive: true,
      },
      jobDetails: {
        company: "AI Innovations",
        location: "Pune, Maharashtra",
        salary: "₹25-40 LPA",
        workType: "On-site",
        experience: "4-6 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
    {
      id: "9",
      title: "Product Manager - Healthcare",
      description: "Transform healthcare delivery through innovative digital health products and telemedicine.",
      relevance: "Impact-driven role in growing healthtech sector with social impact.",
      actionLabel: "View Details",
      actionType: "view",
      category: "job",
      source: {
        platform: "Naukri",
        verified: false,
      },
      jobDetails: {
        company: "HealthTech Solutions",
        location: "Delhi, NCR",
        salary: "₹16-28 LPA",
        workType: "Hybrid (3 days office)",
        experience: "2-5 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
    {
      id: "10",
      title: "Product Manager - Gaming",
      description: "Shape the future of mobile gaming with data-driven product decisions and user engagement.",
      relevance: "Exciting opportunity in the booming gaming industry with creative product challenges.",
      actionLabel: "Apply Now",
      actionType: "apply",
      category: "job",
      source: {
        platform: "AngelList",
        verified: true,
      },
      jobDetails: {
        company: "GameStudio+",
        location: "Bangalore, Karnataka",
        salary: "₹14-22 LPA",
        workType: "Hybrid (2 days office)",
        experience: "2-4 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
    {
      id: "11",
      title: "Product Manager - EdTech",
      description: "Build educational technology products that impact millions of students across India.",
      relevance: "Mission-driven role combining education and technology for social impact.",
      actionLabel: "View Details",
      actionType: "view",
      category: "job",
      source: {
        platform: "Qelsa",
        verified: true,
        exclusive: false,
      },
      jobDetails: {
        company: "EduLearn Pro",
        location: "Chennai, Tamil Nadu",
        salary: "₹13-20 LPA",
        workType: "Remote",
        experience: "2-4 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
  ],
  "sales to marketing": [
    {
      id: "6",
      title: "Digital Marketing Fundamentals",
      description: "Master SEO, SEM, social media marketing, and analytics tools.",
      relevance: "Essential skills to transition from sales to marketing effectively.",
      actionLabel: "Start Learning",
      actionType: "learn",
      category: "skill",
    },
    {
      id: "7",
      title: "Marketing Analytics",
      description: "Learn to measure campaign performance and optimize marketing ROI.",
      relevance: "Leverage your sales experience to understand customer behavior better.",
      actionLabel: "Explore Course",
      actionType: "learn",
      category: "skill",
    },
  ],
  "data scientist skills": [
    {
      id: "12",
      title: "Python Programming for Data Science",
      description: "Master Python programming, pandas, numpy, and data manipulation libraries.",
      relevance: "Foundation skill for all data science roles with high industry demand.",
      actionLabel: "Start Learning",
      actionType: "learn",
      category: "skill",
    },
    {
      id: "13",
      title: "Machine Learning Fundamentals",
      description: "Learn supervised and unsupervised learning algorithms and model evaluation.",
      relevance: "Core competency for data scientist positions across all industries.",
      actionLabel: "Explore Course",
      actionType: "learn",
      category: "skill",
    },
    {
      id: "14",
      title: "Data Scientist - Tech Startup",
      description: "Build predictive models and drive data-driven decision making at a fast-growing startup.",
      relevance: "Perfect match for analytical professionals with Python and ML skills.",
      actionLabel: "View Jobs",
      actionType: "view",
      category: "job",
      source: {
        platform: "Qelsa",
        verified: true,
        exclusive: true,
      },
      jobDetails: {
        company: "DataTech Solutions",
        location: "Bangalore, Karnataka",
        salary: "₹12-22 LPA",
        workType: "Hybrid (3 days office)",
        experience: "2-4 years",
        responsibilities: [],
        requirements: [],
        preferred: [],
        benefits: [],
      },
    },
  ],
  "salary negotiation": [
    {
      id: "15",
      title: "Interview Negotiation Strategies",
      description: "Learn proven techniques to negotiate salary, benefits, and work terms effectively.",
      relevance: "Essential skill that can increase your earning potential by 15-25%.",
      actionLabel: "Learn Techniques",
      actionType: "learn",
      category: "skill",
    },
    {
      id: "16",
      title: "Market Research Tools",
      description: "Use salary benchmarking tools and market research to support your negotiation.",
      relevance: "Data-driven approach to strengthen your negotiation position.",
      actionLabel: "Explore Tools",
      actionType: "learn",
      category: "professional",
    },
    {
      id: "17",
      title: "Communication & Soft Skills",
      description: "Develop confidence, communication skills, and professional presence.",
      relevance: "Critical for successful negotiations and career advancement.",
      actionLabel: "Start Course",
      actionType: "learn",
      category: "professional",
    },
  ],
};

interface ChatInterfaceProps {
  activeFilter: string;
  onMenuClick: () => void;
  onViewAllJobs?: (searchQuery: string, jobResults?: ResponseData[]) => void;
  onNavigateToProfile?: () => void;
  onProfileClick?: () => void;
}

export function ChatInterface({ activeFilter, onMenuClick, onViewAllJobs, onNavigateToProfile, onProfileClick }: ChatInterfaceProps) {
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

  const getCurrentJob = () => {
    for (const message of messages) {
      if (message.responses) {
        const job = message.responses.find((r) => r.id === jobDetailsModal.jobId);
        if (job) return job;
      }
    }
    return null;
  };

  // Feedback handlers
  const handlePositiveFeedback = async (messageId: string) => {
    console.log("Positive feedback for message:", messageId);
    // In a real implementation, this would send feedback to the backend
    // For now, we'll just log it
    const feedbackData = {
      messageId,
      rating: "positive" as const,
      timestamp: Date.now(),
    };

    // Store feedback locally (in real app, send to backend)
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

    // Store feedback locally (in real app, send to backend)
    localStorage.setItem(`feedback_${feedbackData.messageId}`, JSON.stringify(feedbackData));

    // You could also send to analytics service or backend API here
    // await analytics.track('ai_feedback_submitted', feedbackData);
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      messageId: "",
      messageContent: "",
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

      if (lowerContent.includes("career") || lowerContent.includes("b.com") || lowerContent.includes("options")) {
        responses = mockResponses["career options"];
        reasoning = `🎯 **AI Reasoning & Analysis:**

Based on your B.Com background, I've analyzed the current job market and identified these career paths using several key factors:

**📊 Market Analysis:**
• Financial services sector showing 23% growth in hiring
• Commerce graduates have 85% job placement rate in finance roles
• Strong demand for analytical skills in business operations

**🧠 Skills Assessment:**
• Your quantitative background aligns perfectly with financial analysis roles
• Commerce fundamentals provide excellent foundation for accounting certifications
• Business acumen from B.Com curriculum matches investment banking requirements

**💼 Career Trajectory:**
• Entry-level positions: ₹3-6 LPA starting salaries
• Mid-level potential: ₹8-15 LPA within 3-5 years  
• Senior roles: ₹20+ LPA with specializations like CA or CFA

These recommendations are ranked by market demand, salary potential, and skill alignment with your academic background.`;
      } else if (lowerContent.includes("product manager") || lowerContent.includes("bangalore")) {
        responses = mockResponses["product manager jobs"];
        reasoning = `🎯 **AI Reasoning & Analysis:**

I've curated 8+ Product Manager opportunities across India's top tech hubs based on comprehensive market intelligence:

**🏙️ Location Intelligence:**
• Bangalore: India's Silicon Valley with 40% of product management jobs
• Mumbai, Pune, Hyderabad: Emerging PM hubs with 25% salary growth
• 1,200+ tech companies actively hiring PMs nationwide
• Remote/hybrid options increasing by 60% post-2023

**📈 Role Suitability Analysis:**
• Fintech PM: High growth sector (45% YoY), matches analytical background
• E-commerce PM: Established market, clear career progression paths
• SaaS PM: Enterprise focus, great for business development skills
• AI/ML PM: Emerging field with premium salaries (₹25-40 LPA)

**💰 Compensation Analysis:**
• Market rate: ₹12-40 LPA for 1-6 years experience
• Equity opportunities: 0.1-0.8% typical range for startups
• Bonus structure: 10-25% of base salary performance-linked
• Specialized domains (AI, HealthTech) command 20-30% premium

**🚀 Growth Potential:**
• PM roles have 65% promotion rate within 18 months
• Natural progression to Senior PM, Director, VP Product
• High demand skills: Data analysis, user research, technical aptitude
• Cross-industry mobility: FinTech → E-commerce → SaaS

**🎯 Market Insights:**
• 8 immediate openings across diverse sectors
• Mix of Kelsa exclusives and verified third-party listings
• Strong bias toward hybrid/remote work models
• Priority hiring for analytical professionals transitioning to product roles

These positions are filtered for immediate hiring needs and cultural fit based on your profile.`;
      } else if (lowerContent.includes("sales") && lowerContent.includes("marketing")) {
        responses = mockResponses["sales to marketing"];
        reasoning = `🎯 **AI Reasoning & Analysis:**

Your transition from sales to marketing is strategically sound. Here's my analytical framework:

**🔄 Skill Transfer Analysis:**
• Customer insights from sales → Customer persona development
• Persuasion & communication → Content marketing & copywriting  
• Pipeline management → Marketing funnel optimization
• Relationship building → Community & brand management

**📊 Market Transition Data:**
• 78% of sales professionals successfully transition to marketing
• Average salary increase: 15-25% post-transition
• Most in-demand skills: Digital marketing, analytics, automation

**🎯 Learning Path Optimization:**
• Digital Marketing: Foundation for modern marketing roles
• Marketing Analytics: Leverages your numbers-driven sales background
• Timeline: 3-6 months intensive learning for junior marketing roles

**💼 Career Trajectory:**
• Marketing Associate: ₹4-8 LPA starting range
• Marketing Manager: ₹8-15 LPA within 2-3 years
• Marketing Director: ₹20+ LPA senior level

Your sales experience provides unique advantages in understanding customer pain points and conversion psychology that many marketers lack.`;
      } else if (lowerContent.includes("data scientist") || lowerContent.includes("skills")) {
        responses = mockResponses["data scientist skills"];
        reasoning = `🎯 **AI Reasoning & Analysis:**

Based on current market trends, here's your comprehensive roadmap to becoming a Data Scientist:

**📊 Core Technical Skills:**
• Python Programming: Essential for 95% of data science roles
• Statistics & Mathematics: Foundation for understanding algorithms
• Machine Learning: Predictive modeling and pattern recognition
• SQL: Database querying and data extraction skills

**🔧 Tools & Technologies:**
• Jupyter Notebooks, pandas, numpy for data manipulation
• scikit-learn, TensorFlow for machine learning models
• Tableau/Power BI for data visualization
• Git for version control and collaboration

**💼 Market Demand Analysis:**
• Data Scientists earn ₹8-35 LPA depending on experience
• 67% job growth projected over next 5 years
• High demand in fintech, healthcare, e-commerce, and consulting
• Entry-level roles available with 6-12 months focused learning

**🎯 Learning Timeline:**
• Months 1-3: Python fundamentals and statistics
• Months 4-6: Machine learning and project portfolio
• Months 7-9: Advanced topics and specialization
• Month 10+: Job applications and interview preparation

Your analytical mindset gives you a strong foundation for this transition.`;
      } else if (lowerContent.includes("salary") && lowerContent.includes("negotiation")) {
        responses = mockResponses["salary negotiation"];
        reasoning = `🎯 **AI Reasoning & Analysis:**

Salary negotiation is a critical career skill that can significantly impact your earning potential:

**💰 Impact Analysis:**
• Successful negotiation increases initial salary by average 15-25%
• Over career lifetime, this compounds to ₹25-50 lakhs additional earnings
• 68% of employers expect candidates to negotiate
• Only 37% of professionals actually negotiate their offers

**🎯 Strategic Approach:**
• Research market rates using Glassdoor, Payscale, Ambition Box
• Document your achievements and unique value proposition
• Practice negotiation scenarios and responses
• Consider total compensation, not just base salary

**📈 Best Practices:**
• Wait for offer before discussing salary expectations
• Express enthusiasm for role before negotiating
• Use data and market research to support requests
• Be prepared to discuss alternative benefits if salary is fixed

**🤝 Professional Framework:**
• Frame negotiation as discussion, not confrontation
• Focus on mutual benefit and value creation
• Maintain positive relationship throughout process
• Always get final offer in writing

These skills will serve you throughout your career, not just in current job search.`;
      } else {
        // Default response
        responses = [
          {
            id: "default",
            title: "Personalized Career Guidance",
            description: "I can help you explore career options, find relevant jobs, and suggest skill development paths.",
            relevance: "Try asking about career options, job searches, or skill transitions.",
            actionLabel: "Get Started",
            actionType: "learn",
            category: "professional",
          },
        ];
        reasoning = `🤖 **AI Assistant Ready:**

I'm here to provide data-driven career guidance tailored to your unique background. I can help with:

• **Career Exploration** - Discover roles that match your skills and interests
• **Job Search Strategy** - Find opportunities in your target market  
• **Skill Development** - Plan your learning path for career transitions
• **Market Intelligence** - Get insights on salary, growth, and demand trends

Feel free to ask specific questions about your career goals, and I'll provide detailed analysis and recommendations!`;
      }

      // Filter responses based on active filter
      const filteredResponses = activeFilter === "all" ? responses : responses.filter((r) => r.category === activeFilter.replace("_", ""));

      // Store job results for the "View All Jobs" button
      const jobResponses = filteredResponses.filter((r) => r.category === "job");
      if (jobResponses.length > 0) {
        setLastJobResults(jobResponses);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: reasoning,
        responses: filteredResponses,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen relative">
      {/* Simplified background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-48 h-48 bg-neon-cyan/3 rounded-full blur-xl opacity-50"></div>
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-neon-purple/3 rounded-full blur-xl opacity-50"></div>
      </div>

      {/* Mobile menu trigger - minimal floating button */}
      <div className="lg:hidden absolute top-4 left-4 z-20">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="glass rounded-xl hover:glass-strong hover:glow-cyan transition-all duration-300">
          <Menu className="h-5 w-5 text-neon-cyan" />
        </Button>
      </div>

      {/* Mobile profile menu - top right corner */}
      <div className="lg:hidden absolute top-4 right-4 z-20">
        <Button variant="ghost" size="icon" onClick={onProfileClick} className="glass rounded-xl hover:glass-strong hover:glow-purple transition-all duration-300">
          <User className="h-5 w-5 text-neon-purple" />
        </Button>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-8">
        {messages.length === 0 && (
          <div className="text-center py-16 max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-24 h-24 rounded-3xl gradient-animated flex items-center justify-center mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center">
                  <span className="text-black font-bold text-lg">AI</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Welcome to Kelsa AI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Your intelligent career companion. Get personalized guidance on career transitions, job searches, and skill development.
            </p>

            {/* Example prompts */}
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Initial 3 prompt cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                  className="group glass hover:glass-strong hover:glow-cyan rounded-2xl p-4 text-left hover:scale-105 transition-all duration-300 cursor-pointer border border-glass-border"
                  onClick={() => handleSendMessage("I am a B.Com student, what are my career options?")}
                >
                  <p className="text-sm text-muted-foreground mb-3">`I am a B.Com student, what are my career options?`</p>
                  <div className="text-xs text-neon-cyan font-medium flex items-center gap-2">
                    Ask about career paths
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>

                <div
                  className="group glass hover:glass-strong hover:glow-purple rounded-2xl p-4 text-left hover:scale-105 transition-all duration-300 cursor-pointer border border-glass-border"
                  onClick={() => handleSendMessage("Find me Product Manager jobs in Bangalore")}
                >
                  <p className="text-sm text-muted-foreground mb-3">`Find me Product Manager jobs in Bangalore`</p>
                  <div className="text-xs text-neon-purple font-medium flex items-center gap-2">
                    Search for opportunities
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>

                <div
                  className="group glass hover:glass-strong hover:glow-pink rounded-2xl p-4 text-left hover:scale-105 transition-all duration-300 cursor-pointer border border-glass-border"
                  onClick={() => handleSendMessage("I want to shift from sales to marketing")}
                >
                  <p className="text-sm text-muted-foreground mb-3">`I want to shift from sales to marketing`</p>
                  <div className="text-xs text-neon-pink font-medium flex items-center gap-2">
                    Plan your transition
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Additional prompt cards (revealed on View More) */}
              {showMorePrompts && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                  <div
                    className="group glass hover:glass-strong hover:glow-green rounded-2xl p-4 text-left hover:scale-105 transition-all duration-300 cursor-pointer border border-glass-border"
                    onClick={() => handleSendMessage("What skills do I need to become a Data Scientist?")}
                  >
                    <p className="text-sm text-muted-foreground mb-3">`What skills do I need to become a Data Scientist?`</p>
                    <div className="text-xs text-neon-green font-medium flex items-center gap-2">
                      Explore skill requirements
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>

                  <div
                    className="group glass hover:glass-strong hover:glow-yellow rounded-2xl p-4 text-left hover:scale-105 transition-all duration-300 cursor-pointer border border-glass-border"
                    onClick={() => handleSendMessage("How can I negotiate my salary during job interviews?")}
                  >
                    <p className="text-sm text-muted-foreground mb-3">`How can I negotiate my salary during job interviews?`</p>
                    <div className="text-xs text-neon-yellow font-medium flex items-center gap-2">
                      Learn negotiation tips
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              )}

              {/* View More/Less button */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowMorePrompts(!showMorePrompts)}
                  variant="outline"
                  className="glass border-glass-border text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/10 transition-all duration-300"
                >
                  {showMorePrompts ? (
                    <>
                      View Less
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      View More
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actual messages */}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-3xl ${message.type === "user" ? "glass-strong rounded-2xl p-4" : "w-full"}`}>
              {message.type === "user" ? (
                <p className="text-white">{message.content}</p>
              ) : (
                <div className="space-y-6">
                  <div className="glass rounded-2xl p-6">
                    <AiMarkdown markdown={message.content} className="text-muted-foreground" />
                  </div>

                  {message.responses && message.responses.length > 0 && (
                    <div className="space-y-6">
                      {/* Check if all responses are job category for grid layout */}
                      {message.responses.every((r) => r.category === "job") ? (
                        <>
                          {/* Job Grid Layout: 3 cards per row, 2 rows max (6 total) */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {message.responses.slice(0, 6).map((response) => (
                              <ResponseCard key={response.id} response={response} variant="compact" onCheckFit={handleCheckFit} onViewJobDetails={handleViewJobDetails} />
                            ))}
                          </div>

                          {/* View All Jobs Button - Only show if there are more than 6 jobs or exactly 6 */}
                          {message.responses.length >= 6 && (
                            <div className="flex justify-center">
                              <Button
                                onClick={() => {
                                  if (onViewAllJobs) {
                                    onViewAllJobs(lastSearchQuery, lastJobResults);
                                  }
                                }}
                                className="gradient-primary text-white px-8 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl glow-cyan"
                                size="lg"
                              >
                                <Search className="h-5 w-5 mr-2" />
                                View All Jobs ({message.responses.length > 6 ? "50+" : message.responses.length})
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Regular List Layout for non-job responses */
                        <div className="space-y-4">
                          {message.responses.map((response) => (
                            <ResponseCard key={response.id} response={response} onCheckFit={handleCheckFit} onViewJobDetails={handleViewJobDetails} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl p-6 max-w-3xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                <span className="text-muted-foreground ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <div className="relative z-20 border-t border-glass-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>

      {/* Job Fit Modal */}
      <JobFitModal isOpen={jobFitModal.isOpen} onClose={closeJobFitModal} jobId={jobFitModal.jobId} jobTitle={jobFitModal.jobTitle} />

      {/* Job Details Modal */}
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

      {/* Feedback Modal */}
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
