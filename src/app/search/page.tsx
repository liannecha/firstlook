"use client";

import Link from "next/link";
import { useState } from "react";
import { founderStories } from "../founders";
import { SaveButton, WatchlistNotice } from "../watchlist";
import { searchFounders } from "./search-model";
import { useDiscovery } from "../discovery";
import { trendingFounders } from "../discovery-model";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const { counts, persistent } = useDiscovery();
  const searching = query.trim().length > 0;
  const results = searching ? searchFounders(founderStories, query) : trendingFounders(founderStories, counts).slice(0, 3);
  return (
    <main className="search-page">
      <h1>Discover founders</h1>
      <p className="search-intro">Find a company or the person building it.</p>
      <div className="search-field">
        <label htmlFor="founder-search">Search companies and founders</label>
        <div className="search-input-row">
          <input id="founder-search" type="search" placeholder="Company or founder name" value={query} onChange={event => setQuery(event.target.value)} autoComplete="off" />
          {query ? <button className="search-clear" onClick={() => { setQuery(""); document.getElementById("founder-search")?.focus(); }}>Clear</button> : null}
        </div>
      </div>
      {searching ? <p className="search-count" role="status" aria-live="polite">{results.length} {results.length === 1 ? "company" : "companies"} found</p> : <div className="search-suggestions-heading"><h2>Trending suggestions</h2><p>Top {results.length} on this browser</p></div>}
      {!persistent ? <p className="watchlist-notice" role="status">Trending activity will last only while this app remains open because browser storage is unavailable.</p> : null}
      <WatchlistNotice />
      {results.length === 0 ? <div className="search-empty"><h2>No matches yet.</h2><p>Try another company or founder name.</p></div> : (
        <div className="search-results">
          {results.map(story => (
            <article className="search-result" key={story.id} aria-labelledby={`${story.id}-search`}>
              <div className="search-result-heading"><h2 id={`${story.id}-search`}>{story.companyName}</h2><SaveButton storyId={story.id} companyName={story.companyName} /></div>
              <p className="search-founder">{story.founderName}</p>
              <p className="founder-description">{story.description}</p>
              <Link className="company-link" href={`/#${story.id}`} aria-label={`Watch ${story.companyName} pitch`}>Watch pitch <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
