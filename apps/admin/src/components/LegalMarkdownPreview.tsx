"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Admin-side preview with the same restrictions as the public renderer. */
const SAFE_URL = /^(https?:\/\/|mailto:)/i;

export function LegalMarkdownPreview({ markdown }: { markdown: string }) {
  if (!markdown.trim()) {
    return <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>;
  }
  return (
    <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-white/70">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (SAFE_URL.test(url) ? url : "")}
        components={{
          h1: ({ children }) => (
            <h2 className="text-lg font-semibold text-white">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-white">{children}</h3>
          ),
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 ps-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 ps-5">{children}</ol>,
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-neon-cyan underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          img: () => null,
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/15 ps-4 text-white/50">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-xs text-white/85">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-white/10 px-2 py-1.5 font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/[0.06] px-2 py-1.5">{children}</td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
