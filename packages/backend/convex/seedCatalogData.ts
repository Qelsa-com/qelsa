export const degreeLevels = [
  { name: "Secondary (10th)", sort_order: 1 },
  { name: "Higher Secondary (12th)", sort_order: 2 },
  { name: "Diploma / Polytechnic", sort_order: 3 },
  { name: "Bachelor's", sort_order: 4 },
  { name: "Master's", sort_order: 5 },
  { name: "Doctoral", sort_order: 6 },
  { name: "Professional Certification", sort_order: 8 },
];

export const degreeNames: Array<{ level: string; name: string; abbreviation?: string }> = [
  { level: "Secondary (10th)", name: "Secondary School Certificate", abbreviation: "SSC" },
  { level: "Higher Secondary (12th)", name: "Higher Secondary Certificate", abbreviation: "HSC" },
  { level: "Bachelor's", name: "Bachelor of Technology", abbreviation: "B.Tech" },
  { level: "Bachelor's", name: "Bachelor of Engineering", abbreviation: "BE" },
  { level: "Bachelor's", name: "Bachelor of Science", abbreviation: "B.Sc" },
  { level: "Bachelor's", name: "Bachelor of Arts", abbreviation: "BA" },
  { level: "Bachelor's", name: "Bachelor of Commerce", abbreviation: "B.Com" },
  { level: "Bachelor's", name: "Bachelor of Computer Applications", abbreviation: "BCA" },
  { level: "Bachelor's", name: "Bachelor of Business Administration / Bachelor of Business Management", abbreviation: "BBA/BBM" },
  { level: "Master's", name: "Master of Technology", abbreviation: "M.Tech" },
  { level: "Master's", name: "Master of Science", abbreviation: "M.Sc" },
  { level: "Master's", name: "Master of Business Administration", abbreviation: "MBA" },
  { level: "Master's", name: "Master of Computer Applications", abbreviation: "MCA" },
  { level: "Doctoral", name: "Doctor of Philosophy", abbreviation: "Ph.D" },
];

export const fieldsOfStudy = [
  { name: "Computer Science", category: "Engineering" },
  { name: "Information Technology", category: "Engineering" },
  { name: "Electronics", category: "Engineering" },
  { name: "Mechanical Engineering", category: "Engineering" },
  { name: "Civil Engineering", category: "Engineering" },
  { name: "Business Administration", category: "Management" },
  { name: "Finance", category: "Commerce" },
  { name: "Economics", category: "Social Sciences" },
  { name: "Mathematics", category: "Sciences" },
  { name: "Physics", category: "Sciences" },
  { name: "Design", category: "Arts" },
];

export const companySizes = [
  { label: "1-10", min_employees: 1, max_employees: 10, sort_order: 1 },
  { label: "11-50", min_employees: 11, max_employees: 50, sort_order: 2 },
  { label: "51-200", min_employees: 51, max_employees: 200, sort_order: 3 },
  { label: "201-500", min_employees: 201, max_employees: 500, sort_order: 4 },
  { label: "501-1000", min_employees: 501, max_employees: 1000, sort_order: 5 },
  { label: "1000+", min_employees: 1001, max_employees: undefined, sort_order: 6 },
];

export const skillCategories = [
  { name: "Programming Languages", sort_order: 1 },
  { name: "Frameworks", sort_order: 2 },
  { name: "Cloud & DevOps", sort_order: 3 },
  { name: "Data & AI", sort_order: 4 },
  { name: "Design", sort_order: 5 },
  { name: "Product & Management", sort_order: 6 },
];

export const skills = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "React",
  "Next.js",
  "Node.js",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "AWS",
  "Docker",
  "Kubernetes",
  "Machine Learning",
  "Figma",
  "Product Management",
  "Communication",
];

export const jobTitles = [
  "Software Engineer",
  "Senior Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Product Manager",
  "Data Scientist",
  "Designer",
  "Engineering Manager",
  "DevOps Engineer",
];

export const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Flipkart",
  "Swiggy",
  "Zomato",
  "Razorpay",
  "Freshworks",
  "Infosys",
  "TCS",
  "Wipro",
  "Accenture",
];

export const colleges = [
  "Indian Institute of Technology Bombay",
  "Indian Institute of Technology Delhi",
  "Indian Institute of Technology Madras",
  "Indian Institute of Science",
  "National Institute of Technology Trichy",
  "Birla Institute of Technology and Science",
  "Delhi University",
  "University of Mumbai",
];
