import type { FounderStory } from "./founders";

export type CompanyClicks = Record<string, number>;

export function readCompanyClicks(raw: string | null): CompanyClicks {
  try {
    const data: unknown = raw ? JSON.parse(raw) : {};
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([, count]) => typeof count === "number" && Number.isSafeInteger(count) && count > 0));
  } catch { return {}; }
}

export function trendingFounders(stories: readonly FounderStory[], counts: CompanyClicks): FounderStory[] {
  return [...stories].reverse().sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
}
