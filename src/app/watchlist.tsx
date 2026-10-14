"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { founderStories } from "./founders";
import { readIds, readPreferences, toggleSaved, togglePinned, type SortOrder, type WatchlistData } from "./watchlist-model";

const STORAGE_KEY = "firstlook.watchlist.v1";
const validIds = new Set(founderStories.map(story => story.id));

const PREFERENCES_KEY = "firstlook.watchlist.preferences.v1";

type WatchlistState = WatchlistData & {
  ready: boolean;
  persistent: boolean;
  toggle: (id: string) => void;
  pin: (id: string) => void;
  setSort: (sort: SortOrder) => void;
};
const WatchlistContext = createContext<WatchlistState | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<WatchlistData>({ savedIds: [], pinnedIds: [], sort: "newest" });
  const [ready, setReady] = useState(false);
  const [persistent, setPersistent] = useState(true);

  useEffect(() => {
    function load() {
      try {
        const savedIds = readIds(localStorage.getItem(STORAGE_KEY)).filter(id => validIds.has(id));
        setData({ savedIds, ...readPreferences(localStorage.getItem(PREFERENCES_KEY), savedIds) });
      } catch { setPersistent(false); }
      setReady(true);
    }
    const frame = requestAnimationFrame(load);
    function sync(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === PREFERENCES_KEY || event.key === null) load();
    }
    window.addEventListener("storage", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function update(next: WatchlistData) {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.savedIds));
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ pinnedIds: next.pinnedIds, sort: next.sort }));
    } catch { setPersistent(false); }
  }

  function toggle(id: string) {
    if (ready && validIds.has(id)) update(toggleSaved(data, id));
  }
  function pin(id: string) {
    if (ready && validIds.has(id)) update(togglePinned(data, id));
  }
  function setSort(sort: SortOrder) {
    if (ready) update({ ...data, sort });
  }

  return <WatchlistContext.Provider value={{ ...data, ready, persistent, toggle, pin, setSort }}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const value = useContext(WatchlistContext);
  if (!value) throw new Error("Watchlist must be used within its provider.");
  return value;
}

export function WatchlistNotice() {
  const { persistent } = useWatchlist();
  return persistent ? null : <p className="watchlist-notice" role="status">Browser storage is unavailable. Your watchlist will last only while this app remains open.</p>;
}

export function SaveButton({ storyId, companyName }: { storyId: string; companyName: string }) {
  const { savedIds, ready, toggle } = useWatchlist();
  const saved = savedIds.includes(storyId);
  return (
    <button className="watchlist-button" disabled={!ready} aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${companyName} ${saved ? "from" : "to"} watchlist`} onClick={() => toggle(storyId)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z" /></svg>
      {saved ? "Saved" : "Save to watchlist"}
    </button>
  );
}
