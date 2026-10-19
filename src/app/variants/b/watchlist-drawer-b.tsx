"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { Bookmark, X } from "lucide-react";
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose, DrawerFooter } from "@/components/ui/drawer";
import { founderStories } from "../../founders";
import { useWatchlist, WatchlistNotice } from "../../watchlist";
import { orderedGroups } from "../../watchlist-model";
import "./watchlist-drawer-b.css";

const storiesById = new Map(founderStories.map(story => [story.id, story]));

export default function WatchlistDrawerB({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const watchlist = useWatchlist();
  const { pinned, others } = orderedGroups(watchlist);
  const savedStories = [...pinned, ...others].flatMap(id => {
    const story = storiesById.get(id);
    return story ? [story] : [];
  });

  return <Drawer autoFocus direction="left" open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
    <DrawerTrigger asChild><button type="button" className={className} aria-label="Open watchlist" data-nav-destination="portfolio" data-active={open}>{children}</button></DrawerTrigger>
    <DrawerContent className="version-b-watchlist-drawer" overlayClassName="version-b-watchlist-overlay">
      <DrawerHeader className="version-b-watchlist-drawer-header">
        <DrawerTitle>Watchlist</DrawerTitle>
        <DrawerDescription>{watchlist.ready ? `${savedStories.length} saved ${savedStories.length === 1 ? "company" : "companies"}` : "Loading your watchlist…"}</DrawerDescription>
        <DrawerClose asChild><button type="button" className="version-b-watchlist-close" aria-label="Close watchlist"><X aria-hidden="true" /></button></DrawerClose>
      </DrawerHeader>
      <div className="version-b-watchlist-drawer-body" data-vaul-no-drag>
        <WatchlistNotice />
        {watchlist.ready && savedStories.length === 0 ? <div className="version-b-watchlist-empty"><Bookmark aria-hidden="true" /><p>No saved companies yet.</p><span>Add a company to your watchlist to keep it here.</span></div> : <ul className="version-b-watchlist-list" aria-label="Saved companies">
          {savedStories.map(story => <li key={story.id}><p>{story.companyName}</p><span>{story.founderName}</span></li>)}
        </ul>}
      </div>
      <DrawerFooter className="version-b-watchlist-drawer-footer"><Link href="/saved" onClick={() => setOpen(false)}>View full watchlist <span aria-hidden="true">→</span></Link></DrawerFooter>
    </DrawerContent>
  </Drawer>;
}
