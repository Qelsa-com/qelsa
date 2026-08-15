"use client";

import { Streamdown } from "streamdown";
import "streamdown/styles.css";

export function AiMarkdown({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <Streamdown className={["ai-markdown", className].filter(Boolean).join(" ")}>
      {markdown}
    </Streamdown>
  );
}
