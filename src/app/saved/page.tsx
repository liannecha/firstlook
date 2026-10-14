"use client";

import Link from "next/link";
import Image from "next/image";
import { founderStories, type FounderStory } from "../founders";
import { orderedGroups } from "../watchlist-model";
import { useWatchlist, WatchlistNotice } from "../watchlist";

const storiesById = new Map(founderStories.map(story => [story.id, story]));

function SavedCompany({ story }: { story: FounderStory }) {
  const { pinnedIds, pin, toggle } = useWatchlist();
  const pinned = pinnedIds.includes(story.id);
  return (
    <article className="watchlist-row" aria-labelledby={`${story.id}-saved`}>
      <Link className="watchlist-thumbnail" href={`/#${story.id}`} aria-label={`Watch ${story.companyName} pitch`}>
        <Image src={`https://i.ytimg.com/vi/${story.videoId}/mqdefault.jpg`} width={160} height={90} alt="" unoptimized />
        <span className="thumbnail-play" aria-hidden="true">▶</span>
      </Link>
      <div className="watchlist-company">
        <h3 id={`${story.id}-saved`}>{story.companyName}</h3>
        <p className="saved-founder">{story.founderName}</p>
        <p className="watchlist-description">{story.description}</p>
        <Link className="company-link" href={`/#${story.id}`}>Watch pitch <span aria-hidden="true">→</span></Link>
      </div>
      <div className="watchlist-actions">
        <div className="watchlist-row-tools">
          <button className="pin-button" aria-pressed={pinned} aria-label={`${pinned ? "Unpin" : "Pin"} ${story.companyName}`} onClick={() => pin(story.id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 3 6 0-1 6 4 4v2h-5v6l-1 2-1-2v-6H6v-2l4-4Z" /></svg>
            {pinned ? "Pinned" : "Pin"}
          </button>
          <details className="watchlist-menu" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false; }} onKeyDown={event => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}>
            <summary aria-label={`Options for ${story.companyName}`}><span aria-hidden="true">⋯</span></summary>
            <div className="watchlist-menu-content"><button onClick={() => { toggle(story.id); requestAnimationFrame(() => document.getElementById("watchlist-sort")?.focus()); }}>Remove from watchlist</button></div>
          </details>
        </div>
        {story.campaignUrl ? <a className="invest-button" href={story.campaignUrl} data-company-id={story.id} target="_blank" rel="noopener noreferrer" aria-label={`Invest in ${story.companyName} on Wefunder (opens in a new tab)`}>Invest <span aria-hidden="true">↗</span></a> : <span className="invest-unavailable">Invest link coming soon</span>}
      </div>
    </article>
  );
}

export default function SavedPage() {
  const watchlist = useWatchlist();
  const { savedIds, ready, sort, setSort } = watchlist;
  const { pinned, others } = orderedGroups(watchlist);
  function rows(ids: string[]) {
    return ids.map(id => { const story = storiesById.get(id); return story ? <SavedCompany key={id} story={story} /> : null; });
  }
  return (
    <main className="saved-page">
      <header className="watchlist-heading"><div><h1>Your watchlist</h1><p className="saved-intro">The founders and companies you want another look at.</p></div></header>
      <div className="watchlist-toolbar">
        <p className="watchlist-count" role="status">{ready ? `${savedIds.length} saved ${savedIds.length === 1 ? "company" : "companies"}` : "Loading your watchlist…"}</p>
        <label className="watchlist-sort" htmlFor="watchlist-sort">Sort <select id="watchlist-sort" value={sort} disabled={!ready} onChange={event => setSort(event.target.value === "oldest" ? "oldest" : "newest")}><option value="newest">Newest saved</option><option value="oldest">Oldest saved</option></select></label>
      </div>
      <WatchlistNotice />
      {!ready ? null : savedIds.length === 0 ? <div className="watchlist-empty"><h2>Your next discovery is waiting.</h2><p>Save a founder from the video feed to keep their company here.</p><Link href="/" className="company-link">Discover founders →</Link></div> : (
        <div className="watchlist-groups">
          {pinned.length > 0 ? <section aria-labelledby="pinned-heading"><h2 id="pinned-heading" className="watchlist-group-heading">Pinned <span>{pinned.length}</span></h2>{rows(pinned)}</section> : null}
          {others.length > 0 ? <section aria-label="Other saved companies">{pinned.length > 0 ? <h2 className="watchlist-group-heading">Other saved companies <span>{others.length}</span></h2> : null}{rows(others)}</section> : null}
        </div>
      )}
    </main>
  );
}
