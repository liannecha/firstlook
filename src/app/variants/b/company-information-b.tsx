"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, Bookmark, CircleDollarSign, CircleHelp } from "lucide-react";
import type { FounderStory } from "../../founders";
import { companyDetailSections } from "../company-details";
import CompanyDetailContent from "../company-detail-content";
import PresentationB from "./presentation-b";

type CompanyInformationProps = {
  story: FounderStory;
  preview?: boolean;
  decisionsDisabled: boolean;
  saved: boolean;
  onInterested: () => void;
  onPass?: () => void;
  onInvest: () => void;
};

export default function CompanyInformationB({ story, preview = false, decisionsDisabled, saved, onInterested, onPass, onInvest }: CompanyInformationProps) {
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
        <ol className={`version-b-story-founder-notes${story.cardFacts ? " version-b-has-facts" : ""}`} aria-label={story.cardFacts ? "Company highlights" : "Founder notes (placeholder text)"}>
          {story.cardFacts ? story.cardFacts.map((fact, index) => <li key={fact.label}><span className="version-b-highlight-number" aria-hidden="true">{index + 1}</span><strong className="version-b-highlight-label">{fact.label}</strong><span className="version-b-highlight-description">{fact.text}</span></li>) : <>
            <li><span className="version-b-highlight-number" aria-hidden="true">1</span>Why I’m building this — placeholder</li>
            <li><span className="version-b-highlight-number" aria-hidden="true">2</span>Why I can build it — placeholder</li>
          </>}
        </ol>
        <div className={`version-b-highlight-actions${onPass ? "" : " version-b-review-actions"}`} role="group" aria-label="Company actions">
          <button type="button" className="version-b-highlight-decision" disabled={preview || decisionsDisabled} title={saved ? "Already interested; continue to the next founder" : "Mark interested and continue"} onClick={onInterested}><Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} /><span>Interested</span></button>
          {onPass ? <button type="button" className="version-b-highlight-decision" disabled={preview || decisionsDisabled} onClick={onPass}><Ban aria-hidden="true" /><span>Pass</span></button> : null}
          <button type="button" className="version-b-highlight-icon-action" disabled={preview || decisionsDisabled} onClick={onInvest}><CircleDollarSign aria-hidden="true" /><span>Invest</span></button>
          <button type="button" className="version-b-highlight-icon-action version-b-question-preview" disabled={preview || decisionsDisabled} aria-label="Ask Question (preview only)"><CircleHelp aria-hidden="true" /><span>Ask Question</span></button>
        </div>
        <div className="version-b-inline-company-details">
          <PresentationB companyId={story.id} companyName={story.companyName} preview={preview} />
          {companyDetailSections(story.id).filter(section => section.kind !== "funding").map(section => <section key={section.title} className="version-b-information-section"><h4>{section.title}</h4><CompanyDetailContent section={section} /></section>)}
        </div>
      </div>
    </div>
    <div className="version-b-information-overflow-cue" aria-hidden="true"><span>Scroll for details</span></div>
  </div>;
}
