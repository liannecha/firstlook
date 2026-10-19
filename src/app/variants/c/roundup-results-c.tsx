"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import FounderCardB, { type CardItemB } from "./founder-card-c";
import { presentationSlidesB } from "./presentation-slides-c";

type Props = {
  items: readonly CardItemB[];
  savedIds: readonly string[];
  passedIds: readonly string[];
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onSave: (id: string) => void;
  onInvest: (item: CardItemB) => void;
};

export default function RoundupResultsC({ items, savedIds, passedIds, headingRef, onSave, onInvest }: Props) {
  const [tab, setTab] = useState<"saved" | "passed">("saved");
  const [selected, setSelected] = useState<CardItemB | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const saved = items.filter(item => savedIds.includes(item.story.id));
  const passed = items.filter(item => passedIds.includes(item.story.id));
  const companies = tab === "saved" ? saved : passed;
  useEffect(() => {
    if (selected && !dialog.current?.open) dialog.current?.showModal();
  }, [selected]);
  function close() {
    dialog.current?.close();
    setSelected(null);
    requestAnimationFrame(() => {
      if (trigger.current?.isConnected) trigger.current.focus();
      else document.getElementById(`results-${tab}-tab`)?.focus();
    });
  }
  return <div className="version-c-results">
    <div className="version-c-results-heading"><Check aria-hidden="true" /><h2 ref={headingRef} tabIndex={-1}>You’re all caught up</h2><p>You’ve reviewed all {items.length} companies in this week’s roundup.</p></div>
    <div role="tablist" aria-label="Reviewed companies" className="version-c-results-tabs">
      {(["saved", "passed"] as const).map(value => <button key={value} type="button" id={`results-${value}-tab`} role="tab" aria-selected={tab === value} aria-controls="results-grid" tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? "saved" : event.key === "End" ? "passed" : value === "saved" ? "passed" : "saved";
        setTab(next);
        document.getElementById(`results-${next}-tab`)?.focus();
      }}>{value === "saved" ? "Saved" : "Passed"} ({value === "saved" ? saved.length : passed.length})</button>)}
    </div>
    <div role="tabpanel" id="results-grid" aria-labelledby={`results-${tab}-tab`} tabIndex={0}>
      {companies.length ? <div className="version-c-results-grid">{companies.map(item => {
        const thumbnail = presentationSlidesB[item.story.id]?.[0];
        return <button type="button" key={item.story.id} className="version-c-result-card" onClick={event => { trigger.current = event.currentTarget; setSelected(item); }}>
          {thumbnail ? <Image src={thumbnail.src} width={thumbnail.width} height={thumbnail.height} alt="" /> : <div className="version-c-result-placeholder" aria-hidden="true">{item.story.companyName.charAt(0)}</div>}
          <div><h3>{item.story.companyName}</h3><p>{item.story.tagline}</p></div>
        </button>;
      })}</div> : <p className="version-c-results-empty">{tab === "saved" ? "No saved companies yet. Switch to Passed to take another look." : "No passed companies. All your companies are in Saved."}</p>}
    </div>
    {selected ? <dialog ref={dialog} className="version-c-result-dialog version-b-viewport-fit" aria-label={`${selected.story.companyName} details`} onCancel={event => { event.preventDefault(); close(); }}>
      <button type="button" autoFocus className="version-c-result-close" aria-label="Close company details" onClick={close}><X aria-hidden="true" /> Close</button>
      <FounderCardB item={selected} saved={savedIds.includes(selected.story.id)} decisionsDisabled={false} onInterested={() => onSave(selected.story.id)} onInvest={() => onInvest(selected)} />
      <p className="sr-only" role="status">{savedIds.includes(selected.story.id) ? "Company saved." : "Passed company. Choose Interested to save."}</p>
    </dialog> : null}
  </div>;
}
