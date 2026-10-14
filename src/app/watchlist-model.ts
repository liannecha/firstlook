export type SortOrder = "newest" | "oldest";
export type WatchlistData = { savedIds: string[]; pinnedIds: string[]; sort: SortOrder };

export function readIds(raw: string | null): string[] {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string"))] : [];
  } catch { return []; }
}

export function readPreferences(raw: string | null, savedIds: string[]): Pick<WatchlistData, "pinnedIds" | "sort"> {
  try {
    const value = raw ? JSON.parse(raw) : {};
    return {
      pinnedIds: readIds(JSON.stringify(value?.pinnedIds)).filter(id => savedIds.includes(id)),
      sort: value?.sort === "oldest" ? "oldest" : "newest",
    };
  } catch { return { pinnedIds: [], sort: "newest" }; }
}

export function toggleSaved(data: WatchlistData, id: string): WatchlistData {
  return data.savedIds.includes(id)
    ? { ...data, savedIds: data.savedIds.filter(item => item !== id), pinnedIds: data.pinnedIds.filter(item => item !== id) }
    : { ...data, savedIds: [...data.savedIds, id] };
}

export function togglePinned(data: WatchlistData, id: string): WatchlistData {
  if (!data.savedIds.includes(id)) return data;
  return { ...data, pinnedIds: data.pinnedIds.includes(id) ? data.pinnedIds.filter(item => item !== id) : [...data.pinnedIds, id] };
}

export function orderedGroups(data: WatchlistData) {
  const order = data.sort === "oldest" ? data.savedIds : [...data.savedIds].reverse();
  const pinned = new Set(data.pinnedIds);
  return { pinned: order.filter(id => pinned.has(id)), others: order.filter(id => !pinned.has(id)) };
}
