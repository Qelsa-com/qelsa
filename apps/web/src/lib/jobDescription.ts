const SECTION =
  /^(about the role|responsibilities|requirements|nice to have|about the company|what you'll do|what you will do|qualifications|benefits|who you are)\s*:?\s*$/i;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hasBlockHtml(text: string) {
  return /<(p|br|ul|ol|li|div|h[1-6])[\s>/]/i.test(text);
}

function restorePlainBreaks(text: string) {
  const newlines = (text.match(/\n/g) ?? []).length;
  if (newlines >= 2) return text;
  return text
    .replace(
      /\s+(About the role|Responsibilities|Requirements|Nice to have|About the company|What you'll do|What you will do|Qualifications|Benefits|Who you are)\s*:/gi,
      "\n\n$1:\n",
    )
    .replace(/\s+[-•]\s+/g, "\n- ");
}

/** Turn stored JD text (plain or HTML) into sanitizable HTML with sections and lists. */
export function jobDescriptionToHtml(raw: string) {
  const text = raw.trim();
  if (!text) return "";
  if (hasBlockHtml(text)) return text;

  const lines = restorePlainBreaks(text.replace(/\r\n/g, "\n"))
    .split("\n")
    .map((line) => line.trim());

  const html: string[] = [];
  let items: string[] = [];

  const flushList = () => {
    if (!items.length) return;
    html.push(`<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
    items = [];
  };

  for (const line of lines) {
    if (!line) {
      flushList();
      continue;
    }
    const bullet = line.match(/^[-•*]\s+(.+)/);
    if (bullet?.[1]) {
      items.push(bullet[1]);
      continue;
    }
    if (SECTION.test(line) || SECTION.test(line.replace(/:$/, ""))) {
      flushList();
      html.push(`<p><strong>${escapeHtml(line.replace(/:$/, ""))}</strong></p>`);
      continue;
    }
    flushList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  }
  flushList();
  return html.join("");
}
