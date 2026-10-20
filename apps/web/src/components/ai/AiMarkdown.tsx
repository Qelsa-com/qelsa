"use client";

import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";

/**
 * Opens every rendered link in a new tab. Used inside the agent chat so
 * following a job link never tears down the conversation.
 */
function NewTabAnchor({ href, children, ...props }: ComponentProps<"a">) {
  return (
    <a {...props} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const NEW_TAB_COMPONENTS = { a: NewTabAnchor };

export function AiMarkdown({
  markdown,
  className,
  newTabLinks = false,
}: {
  markdown: string;
  className?: string;
  newTabLinks?: boolean;
}) {
  return (
    <Streamdown
      className={["ai-markdown", className].filter(Boolean).join(" ")}
      components={newTabLinks ? NEW_TAB_COMPONENTS : undefined}
    >
      {markdown}
    </Streamdown>
  );
}
