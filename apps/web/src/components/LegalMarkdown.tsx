import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Legal copy is authored as Markdown in the admin panel. Raw HTML is never
 * enabled, images are dropped, and links are restricted to http(s)/mailto so
 * pasted content cannot inject markup, media, or javascript: URLs.
 */
const SAFE_URL = /^(https?:\/\/|mailto:)/i;

const linkClass = "text-neon-cyan underline-offset-2 hover:underline";

export function LegalMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="flex flex-col gap-[25px] text-[15px] leading-[1.7] text-white/70">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (SAFE_URL.test(url) ? url : "")}
        components={{
          h1: ({ children }) => (
            <h2 className="text-xl font-semibold text-white lg:text-2xl">{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white lg:text-2xl">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-white">{children}</h4>
          ),
          p: ({ children }) => <p className="leading-[1.7]">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 ps-[22.5px]">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 ps-[22.5px]">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-[1.7]">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              className={linkClass}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),
          // No media files: an authored image is ignored rather than embedded.
          img: () => null,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-white/15 ps-4 text-white/55">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-white/10" />,
          code: ({ children }) => (
            <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[0.92em] text-white/85">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-white/10 px-3 py-2 font-semibold text-white">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/[0.06] px-3 py-2 align-top">{children}</td>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

/** First readable paragraph, for the meta description. */
export function markdownSummary(markdown: string, limit = 160) {
  return markdown
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/[*_`>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}
