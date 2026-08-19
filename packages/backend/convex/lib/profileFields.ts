export function titledList(items: unknown, max = 24) {
  if (!Array.isArray(items)) return [] as Array<{ title: string }>;
  const out: Array<{ title: string }> = [];
  for (const item of items) {
    const raw =
      typeof item === "string"
        ? item
        : item && typeof item === "object" && "title" in item && typeof item.title === "string"
          ? item.title
          : "";
    const title = raw.trim().slice(0, 280);
    if (title) out.push({ title });
    if (out.length >= max) break;
  }
  return out;
}

export function impactMetricList(items: unknown, max = 12) {
  if (!Array.isArray(items)) {
    return [] as Array<{ impact_type: string; impact_value: string; description?: string }>;
  }
  const out: Array<{ impact_type: string; impact_value: string; description?: string }> = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as { impact_type?: unknown; impact_value?: unknown; description?: unknown };
    const impact_type = typeof row.impact_type === "string" ? row.impact_type.trim() : "";
    const impact_value = typeof row.impact_value === "string" ? row.impact_value.trim() : "";
    if (!impact_type || !impact_value) continue;
    const description = typeof row.description === "string" ? row.description.trim() : undefined;
    out.push({ impact_type, impact_value, ...(description ? { description } : {}) });
    if (out.length >= max) break;
  }
  return out;
}

export function withLocalIds<T extends object>(items: T[] | undefined) {
  return (items ?? []).map((item, index) => ({ ...item, id: index }));
}
