"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { founderStories } from "./founders";
import { readCompanyClicks, type CompanyClicks } from "./discovery-model";

const STORAGE_KEY = "firstlook.company-clicks.v1";
const companyIds = new Set(founderStories.map(story => story.id));
const DiscoveryContext = createContext<{ counts: CompanyClicks; persistent: boolean }>({ counts: {}, persistent: true });

export function DiscoveryProvider({ children }: { children: React.ReactNode }) {
  const [counts, setCounts] = useState<CompanyClicks>({});
  const [persistent, setPersistent] = useState(true);
  const latest = useRef<CompanyClicks>({});

  useEffect(() => {
    function load() {
      try {
        latest.current = readCompanyClicks(localStorage.getItem(STORAGE_KEY));
        setCounts(latest.current);
      } catch { setPersistent(false); }
    }
    const frame = requestAnimationFrame(load);
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) load();
    }
    function onClick(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[data-company-id]");
      const id = link?.dataset.companyId;
      if (!id || !companyIds.has(id)) return;
      const next = { ...latest.current, [id]: Math.min((latest.current[id] ?? 0) + 1, Number.MAX_SAFE_INTEGER) };
      latest.current = next;
      setCounts(next);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
      catch { setPersistent(false); }
    }
    window.addEventListener("storage", onStorage);
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return <DiscoveryContext.Provider value={{ counts, persistent }}>{children}</DiscoveryContext.Provider>;
}

export function useDiscovery() { return useContext(DiscoveryContext); }
