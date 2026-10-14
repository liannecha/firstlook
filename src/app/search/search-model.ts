import type { FounderStory } from "../founders";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function searchFounders(stories: readonly FounderStory[], query: string): FounderStory[] {
  const normalized = normalize(query);
  const terms = normalized ? normalized.split(/\s+/) : [];
  return [...stories].reverse().filter(story => {
    const names = normalize(`${story.companyName} ${story.founderName}`);
    return terms.every(term => names.includes(term));
  });
}
