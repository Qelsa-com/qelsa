import { AlertCircle, Award, BookOpen, CheckCircle, Clock, ExternalLink, PlayCircle, Star, TrendingUp, Users, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";

interface Course {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  students: string;
  price: string;
  skills: string[];
  description: string;
  source: "Kelsa" | "Coursera" | "Udemy" | "LinkedIn Learning";
}

interface JobFitData {
  jobTitle: string;
  overallFit: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  recommendedCourses: Course[];
  skillMatch: {
    skill: string;
    userLevel: number;
    requiredLevel: number;
    match: "strong" | "partial" | "gap";
  }[];
}

interface JobFitModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

// Mock user profile data
const mockUserProfile = {
  name: "Alex Kumar",
  experience: "3 years",
  currentRole: "Business Analyst",
  education: "B.Com, MBA",
  skills: ["Data Analysis", "SQL", "Excel", "Project Management", "Financial Modeling"],
  certifications: ["Google Analytics", "PMP Foundation"],
  achievements: ["Led 5+ cross-functional projects", "Improved process efficiency by 30%"],
};

// Mock fit analysis data
const mockFitAnalysis: { [key: string]: JobFitData } = {
  "4": {
    jobTitle: "Product Manager - Fintech",
    overallFit: 78,
    strengths: [
      "Strong analytical background from B.Com and current role",
      "Project management experience aligns with product roadmap ownership",
      "Financial domain knowledge valuable for fintech products",
    ],
    gaps: ["Limited direct product management experience", "No technical background in software development", "Missing user research and UX design experience"],
    recommendations: [
      "Complete a Product Management certification course",
      "Learn basic SQL and data analysis tools",
      "Gain experience with user research methodologies",
      "Build a portfolio of product case studies",
    ],
    recommendedCourses: [
      {
        id: "pm1",
        title: "Product Management Fundamentals",
        provider: "Kelsa Academy",
        duration: "6 weeks",
        level: "Beginner",
        rating: 4.8,
        students: "12.5K",
        price: "Free",
        skills: ["Product Strategy", "Market Research", "Roadmap Planning"],
        description: "Master the fundamentals of product management with real-world case studies from fintech industry.",
        source: "Kelsa",
      },
      {
        id: "pm2",
        title: "User Research & UX for Product Managers",
        provider: "Design Institute",
        duration: "4 weeks",
        level: "Intermediate",
        rating: 4.6,
        students: "8.2K",
        price: "₹2,999",
        skills: ["User Research", "UX Design", "Customer Interviews"],
        description: "Learn to conduct user research, analyze feedback, and make data-driven product decisions.",
        source: "Coursera",
      },
      {
        id: "pm3",
        title: "SQL for Product Managers",
        provider: "TechLearn Pro",
        duration: "3 weeks",
        level: "Beginner",
        rating: 4.7,
        students: "15.3K",
        price: "₹1,999",
        skills: ["SQL", "Data Analysis", "Product Analytics"],
        description: "Master SQL basics to analyze product data and make informed decisions.",
        source: "Udemy",
      },
      {
        id: "pm4",
        title: "Agile Product Development",
        provider: "ProductCraft",
        duration: "5 weeks",
        level: "Intermediate",
        rating: 4.5,
        students: "9.8K",
        price: "₹3,499",
        skills: ["Agile Methodology", "Sprint Planning", "Stakeholder Management"],
        description: "Learn agile principles and how to lead product development in fast-paced environments.",
        source: "LinkedIn Learning",
      },
    ],
    skillMatch: [
      { skill: "Data Analysis", userLevel: 85, requiredLevel: 90, match: "strong" },
      { skill: "Project Management", userLevel: 80, requiredLevel: 95, match: "partial" },
      { skill: "Product Strategy", userLevel: 30, requiredLevel: 85, match: "gap" },
      { skill: "User Research", userLevel: 20, requiredLevel: 70, match: "gap" },
      { skill: "Financial Knowledge", userLevel: 90, requiredLevel: 75, match: "strong" },
    ],
  },
  "5": {
    jobTitle: "Senior Product Manager - E-commerce",
    overallFit: 65,
    strengths: ["Analytical mindset perfect for data-driven product decisions", "Business background helps understand market dynamics", "Project coordination skills translate to product management"],
    gaps: ["No e-commerce industry experience", "Limited technical knowledge of web/mobile platforms", "Lack of experience with agile development processes"],
    recommendations: [
      "Study e-commerce business models and metrics",
      "Learn about A/B testing and conversion optimization",
      "Get familiar with agile/scrum methodologies",
      "Build understanding of mobile app development",
    ],
    recommendedCourses: [
      {
        id: "ec1",
        title: "E-commerce Business Strategy",
        provider: "Kelsa Academy",
        duration: "5 weeks",
        level: "Intermediate",
        rating: 4.9,
        students: "18.2K",
        price: "Free",
        skills: ["E-commerce Strategy", "Market Analysis", "Digital Marketing"],
        description: "Comprehensive guide to e-commerce business models, customer acquisition, and growth strategies.",
        source: "Kelsa",
      },
      {
        id: "ec2",
        title: "A/B Testing & Conversion Optimization",
        provider: "GrowthHack Academy",
        duration: "4 weeks",
        level: "Intermediate",
        rating: 4.7,
        students: "11.4K",
        price: "₹2,499",
        skills: ["A/B Testing", "Conversion Rate Optimization", "Data Analysis"],
        description: "Master statistical testing and optimization techniques to improve product performance.",
        source: "Coursera",
      },
      {
        id: "ec3",
        title: "Mobile App Development Fundamentals",
        provider: "CodeAcademy Pro",
        duration: "8 weeks",
        level: "Beginner",
        rating: 4.5,
        students: "25.7K",
        price: "₹4,999",
        skills: ["Mobile Development", "React Native", "App Store Optimization"],
        description: "Learn mobile app development basics and understand the technical aspects of product development.",
        source: "Udemy",
      },
      {
        id: "ec4",
        title: "Leadership in Tech Teams",
        provider: "Leadership Pro",
        duration: "6 weeks",
        level: "Advanced",
        rating: 4.8,
        students: "7.9K",
        price: "₹3,999",
        skills: ["Team Leadership", "Stakeholder Management", "Strategic Planning"],
        description: "Develop advanced leadership skills for managing technical teams and driving product success.",
        source: "LinkedIn Learning",
      },
    ],
    skillMatch: [
      { skill: "Business Analysis", userLevel: 85, requiredLevel: 80, match: "strong" },
      { skill: "Data Analysis", userLevel: 85, requiredLevel: 90, match: "strong" },
      { skill: "E-commerce Knowledge", userLevel: 25, requiredLevel: 85, match: "gap" },
      { skill: "Technical Skills", userLevel: 40, requiredLevel: 70, match: "gap" },
      { skill: "Leadership", userLevel: 70, requiredLevel: 90, match: "partial" },
    ],
  },
};

const matchColors = {
  strong: "text-green-600 bg-green-50 border-green-200",
  partial: "text-yellow-600 bg-yellow-50 border-yellow-200",
  gap: "text-red-600 bg-red-50 border-red-200",
};

const matchIcons = {
  strong: CheckCircle,
  partial: AlertCircle,
  gap: X,
};

export function JobFitModal({ isOpen, onClose, jobId, jobTitle }: JobFitModalProps) {
  if (!isOpen) return null;

  const fitData = mockFitAnalysis[jobId];

  if (!fitData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Analysis Not Available</h3>
            <p className="text-gray-600 mb-4">Fit analysis is not available for this position.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Job Fit Analysis</h2>
              <p className="text-sm text-gray-600">{fitData.jobTitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overall Fit Score */}
          <Card className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Overall Fit Score</h3>
                <p className="text-sm text-gray-600">Based on your profile and this role&apos;s requirements</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-teal-600">{fitData.overallFit}%</div>
                <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                  {fitData.overallFit >= 80 ? "Excellent" : fitData.overallFit >= 60 ? "Good" : "Fair"} Match
                </Badge>
              </div>
            </div>
            <Progress value={fitData.overallFit} className="h-3" />
          </Card>

          {/* Your Profile Summary */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Your Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Experience:</span>
                <span className="ml-2 text-gray-600">{mockUserProfile.experience}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Current Role:</span>
                <span className="ml-2 text-gray-600">{mockUserProfile.currentRole}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Education:</span>
                <span className="ml-2 text-gray-600">{mockUserProfile.education}</span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Key Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mockUserProfile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Skill Match Analysis */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Skill Match Analysis</h3>
            </div>
            <div className="space-y-4">
              {fitData.skillMatch.map((skill, index) => {
                const MatchIcon = matchIcons[skill.match];
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded-full ${matchColors[skill.match]}`}>
                        <MatchIcon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-gray-900">{skill.skill}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="text-gray-600">Your Level: {skill.userLevel}%</div>
                        <div className="text-gray-600">Required: {skill.requiredLevel}%</div>
                      </div>
                      <div className="w-20">
                        <Progress value={Math.min(skill.userLevel, skill.requiredLevel)} className="h-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Strengths */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Your Strengths</h3>
            </div>
            <ul className="space-y-2">
              {fitData.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Areas for Improvement */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
            </div>
            <ul className="space-y-2">
              {fitData.gaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{gap}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Recommendations */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recommended Next Steps</h3>
            </div>
            <ul className="space-y-2 mb-6">
              {fitData.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>

            {/* Recommended Courses */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-teal-600" />
                Recommended Courses to Bridge Skill Gaps
              </h4>
              <div className="space-y-4">
                {fitData.recommendedCourses.map((course, index) => (
                  <div key={course.id} className="glass rounded-xl p-4 border border-glass-border hover:glass-strong transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900">{course.title}</h5>
                          <Badge variant="secondary" className={`text-xs ${course.source === "Kelsa" ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                            {course.source === "Kelsa" ? "Kelsa Exclusive" : course.source}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {course.students} students
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {course.rating}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-teal-600 mb-1">{course.price}</div>
                        <Badge variant="outline" className="text-xs">
                          {course.level}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {course.skills.map((skill, skillIndex) => (
                        <Badge key={skillIndex} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">by {course.provider}</span>
                      <Button
                        size="sm"
                        className={`${course.source === "Kelsa" ? "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700" : "bg-gray-600 hover:bg-gray-700"} text-white`}
                      >
                        {course.price === "Free" ? "Start Free" : "Enroll Now"}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">Analysis based on your current profile and resume</div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700">Save Analysis</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
