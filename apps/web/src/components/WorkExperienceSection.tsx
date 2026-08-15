import { Award, Briefcase, ChevronDown, ChevronUp, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface Achievement {
  text: string;
}

interface Role {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null; // null means current
  duration: string;
  isCurrent: boolean;
  responsibilities: string[];
  achievements: Achievement[];
  skills: string[];
}

interface Company {
  id: string;
  name: string;
  logo: string;
  location: string;
  roles: Role[];
  totalDuration: string;
}

interface WorkExperienceSectionProps {
  onEdit?: () => void;
  onAdd?: () => void;
}

export function WorkExperienceSection({ onEdit, onAdd }: WorkExperienceSectionProps) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set(["1"]));

  // Mock data
  const companies: Company[] = [
    {
      id: "1",
      name: "TechCorp Solutions",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
      location: "San Francisco, CA",
      totalDuration: "5 yrs 11 mos",
      roles: [
        {
          id: "1",
          title: "Senior Product Manager",
          startDate: "Jan 2023",
          endDate: null,
          duration: "2 yrs 11 mos",
          isCurrent: true,
          responsibilities: [
            "Leading product strategy for AI-powered analytics platform serving 10K+ users",
            "Managing cross-functional team of 15 engineers, designers, and data scientists",
            "Driving 40% increase in user engagement through data-driven feature prioritization",
            "Establishing product roadmap aligned with company OKRs and market trends",
          ],
          achievements: [{ text: "Launched 3 major features that increased revenue by $2M ARR" }, { text: "Reduced customer churn by 25% through improved onboarding experience" }],
          skills: ["Product Strategy", "Roadmap Planning", "Stakeholder Management", "A/B Testing", "SQL", "Figma"],
        },
        {
          id: "2",
          title: "Product Manager",
          startDate: "Apr 2021",
          endDate: "Dec 2022",
          duration: "1 yr 9 mos",
          isCurrent: false,
          responsibilities: [
            "Owned end-to-end product lifecycle for core analytics dashboard",
            "Conducted user research and synthesized insights into actionable features",
            "Collaborated with engineering to deliver 12 product releases on time",
            "Analyzed product metrics and KPIs to inform strategic decisions",
          ],
          achievements: [{ text: "Achieved 95% customer satisfaction score through user-centric design" }, { text: "Implemented feedback loop that reduced feature development time by 30%" }],
          skills: ["User Research", "Agile", "Jira", "Analytics", "Wireframing"],
        },
        {
          id: "3",
          title: "Associate Product Manager",
          startDate: "Jan 2020",
          endDate: "Mar 2021",
          duration: "1 yr 3 mos",
          isCurrent: false,
          responsibilities: [
            "Supported product team in defining feature requirements and user stories",
            "Conducted competitive analysis and market research for new product initiatives",
            "Collaborated with design team to create wireframes and prototypes",
            "Tracked key metrics and prepared weekly reports for stakeholders",
          ],
          achievements: [{ text: "Contributed to successful launch of mobile app with 50K+ downloads in first quarter" }],
          skills: ["Product Requirements", "Market Research", "Prototyping", "Data Analysis"],
        },
      ],
    },
    {
      id: "2",
      name: "InnovateTech",
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop",
      location: "New York, NY",
      totalDuration: "2 yrs 3 mos",
      roles: [
        {
          id: "4",
          title: "Product Analyst",
          startDate: "Jun 2018",
          endDate: "Dec 2019",
          duration: "1 yr 7 mos",
          isCurrent: false,
          responsibilities: [
            "Analyzed user behavior data to identify product improvement opportunities",
            "Created dashboards and reports to track product performance metrics",
            "Supported A/B testing initiatives and analyzed results",
            "Collaborated with product managers to prioritize feature backlog",
          ],
          achievements: [{ text: "Identified key insights that led to 15% increase in user retention" }],
          skills: ["SQL", "Python", "Tableau", "A/B Testing", "Google Analytics"],
        },
      ],
    },
  ];

  const toggleCompany = (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
    }
    setExpandedCompanies(newExpanded);
  };

  const formatDateRange = (startDate: string, endDate: string | null) => {
    return `${startDate} - ${endDate || "Present"}`;
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-neon-cyan" />
          </div>
          <div>
            <h2 className="text-white">Work Experience</h2>
            <p className="text-sm text-white/40">Your professional journey</p>
          </div>
        </div>
        <Button onClick={onAdd} className="bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/20">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>

      {/* Company Cards */}
      <div className="space-y-3">
        {companies.map((company) => {
          const isExpanded = expandedCompanies.has(company.id);
          const rolesCount = company.roles.length;

          return (
            <Card key={company.id} className="glass-strong border-glass-border overflow-hidden">
              {/* Company Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <Avatar className="w-14 h-14 rounded-xl border-2 border-glass-border">
                    <AvatarImage src={company.logo} alt={company.name} />
                    <AvatarFallback className="bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 text-white rounded-xl">{company.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  {/* Company Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white truncate">{company.name}</h3>
                        <p className="text-sm text-white/60 mt-1">{company.location}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-white/40">{formatDateRange(company.roles[company.roles.length - 1].startDate, company.roles[0].endDate)}</span>
                          <span className="text-sm text-white/20">•</span>
                          <span className="text-sm text-neon-cyan">{company.totalDuration}</span>
                        </div>
                        {rolesCount > 1 && (
                          <button onClick={() => toggleCompany(company.id)} className="flex items-center gap-2 mt-3 text-sm text-white/60 hover:text-white transition-colors">
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-purple" />
                            {rolesCount} roles at this company
                          </button>
                        )}
                      </div>

                      {/* Expand/Collapse Button */}
                      <Button variant="ghost" size="sm" onClick={() => toggleCompany(company.id)} className="text-white/60 hover:text-white hover:bg-white/5 shrink-0">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles - Expanded View */}
              {isExpanded && (
                <div className="border-t border-glass-border">
                  {company.roles.map((role, index) => (
                    <div key={role.id} className={`p-4 sm:p-6 ${index !== company.roles.length - 1 ? "border-b border-glass-border/50" : ""}`}>
                      <div className="flex items-start gap-4">
                        {/* Timeline Indicator */}
                        <div className="flex flex-col items-center pt-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${role.isCurrent ? "bg-neon-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "bg-white/30"}`} />
                          {index !== company.roles.length - 1 && <div className="w-px h-full bg-gradient-to-b from-white/20 to-transparent mt-2" />}
                        </div>

                        {/* Role Content */}
                        <div className="flex-1 min-w-0">
                          {/* Role Header */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white">{role.title}</h4>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-sm text-white/60">{formatDateRange(role.startDate, role.endDate)}</span>
                                <span className="text-sm text-white/20">•</span>
                                <span className="text-sm text-neon-cyan">{role.duration}</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onEdit} className="text-white/60 hover:text-white hover:bg-white/5 shrink-0">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Responsibilities */}
                          <ul className="space-y-2 mb-4">
                            {role.responsibilities.map((resp, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm text-white/70">
                                <div className="w-1 h-1 rounded-full bg-white/30 mt-2 shrink-0" />
                                <span>{resp}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Key Achievements */}
                          {role.achievements.length > 0 && (
                            <div className="rounded-lg bg-gradient-to-br from-neon-purple/10 via-neon-pink/10 to-neon-purple/10 border border-neon-purple/20 p-4 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Award className="w-4 h-4 text-neon-purple" />
                                <span className="text-sm text-white/90">Key Achievements</span>
                              </div>
                              <ul className="space-y-2">
                                {role.achievements.map((achievement, idx) => (
                                  <li key={idx} className="flex items-start gap-3 text-sm text-white/80">
                                    <div className="text-neon-purple mt-0.5 shrink-0">↗</div>
                                    <span>{achievement.text}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Skills */}
                          {role.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {role.skills.map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10 transition-colors">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
