"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Inline Markdown renderer shared by the admin editor preview. */
const SAFE_URL = /^(?:https?:\/\/|mailto:|\/(?!\/))/i;

const inlineComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  h1: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  h2: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  h3: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  h4: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  h5: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  h6: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  blockquote: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  ul: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  ol: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  li: ({ children }: { children?: React.ReactNode }) => (
    <span className="mr-1">{children}</span>
  ),
  hr: () => null,
  img: () => null,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
    const external = Boolean(href && /^https?:\/\//i.test(href));
    return (
      <a
        href={href}
        className="font-medium text-neon-cyan underline decoration-neon-cyan/40 underline-offset-2 transition-colors hover:text-white"
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  },
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[0.92em] text-white/85">
      {children}
    </code>
  ),
};

export function BlogInlineText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => (SAFE_URL.test(url) ? url : "")}
      components={inlineComponents}
    >
      {text}
    </ReactMarkdown>
  );
}
