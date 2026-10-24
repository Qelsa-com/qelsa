export type BlogLink = {
  label: string;
  href: string;
};

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
};

export type BlogFaq = {
  question: string;
  answer: string;
};

export type PublicBlogSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  meta_title: string;
  meta_description: string;
  primary_keyword: string;
  search_intent: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  cover_image_alt: string;
  cover_status: "ready" | "failed";
  status: "draft" | "published";
  seo_score: number;
  word_count: number;
  reading_minutes: number;
  created_at: number;
  updated_at: number;
  published_at: number | null;
};

export type PublicBlog = PublicBlogSummary & {
  intro: string;
  key_takeaways: string[];
  sections: BlogSection[];
  faq: BlogFaq[];
  related_links: BlogLink[];
};
