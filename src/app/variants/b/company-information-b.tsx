"use client";

import { useEffect, useRef, useState } from "react";
import type { FounderStory } from "../../founders";
import { companyDetailSections } from "../company-details";
import CompanyDetailContent from "../company-detail-content";

export default function CompanyInformationB({ story, preview = false }: { story: FounderStory; preview?: boolean }) {
  const scrollArea = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(true);
  const [atStart, setAtStart] = useState(true);

  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    let frame = 0;
    const measure = () => { setMoreBelow(area.scrollTop + area.clientHeight < area.scrollHeight - 2); setAtStart(area.scrollTop < 2); };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(area);
    if (content.current) observer.observe(content.current);
    schedule();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  return <div className="version-b-information-window" data-more-below={moreBelow} data-at-start={atStart}>
    <div ref={scrollArea} className="version-b-information-scroll" role="region" aria-label={`${story.companyName} highlights and company details`} tabIndex={preview ? -1 : 0} onScroll={event => { const area = event.currentTarget; setMoreBelow(area.scrollTop + area.clientHeight < area.scrollHeight - 2); setAtStart(area.scrollTop < 2); }}>
      <div ref={content} className="version-b-information-content">
        <ul className={`version-b-story-founder-notes${story.cardFacts ? " version-b-has-facts" : ""}`} aria-label={story.cardFacts ? "Company highlights" : "Founder notes (placeholder text)"}>
          {story.cardFacts ? story.cardFacts.map(fact => <li key={fact.label}><strong>{fact.label}:</strong> {fact.text}</li>) : <>
            <li>Why I’m building this — placeholder</li>
            <li>Why I can build it — placeholder</li>
          </>}
        </ul>
        <div className="version-b-inline-company-details">
          {companyDetailSections(story.id).map(section => <section key={section.title} className="version-b-information-section"><h4>{section.title}</h4><CompanyDetailContent section={section} /></section>)}
        </div>
      </div>
    </div>
    <div className="version-b-information-overflow-cue" aria-hidden="true"><span>Scroll for details</span></div>
  </div>;
}
