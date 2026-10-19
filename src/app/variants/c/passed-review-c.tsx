"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import FounderCardB, { type CardItemB } from "./founder-card-c";

type Props = {
  items: readonly CardItemB[];
  passedIds: readonly string[];
  selectedId: string | null;
  onNavigate: (id: string) => void;
  onInterested: (id: string) => void;
  onInvest: (item: CardItemB) => void;
  onClose: () => void;
  feedback: ReactNode;
};

export default function PassedReviewB({ items, passedIds, selectedId, onNavigate, onInterested, onInvest, onClose, feedback }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const index = Math.max(0, passedIds.indexOf(selectedId ?? ""));
  const item = items.find(candidate => candidate.story.id === passedIds[index]);
  const previousId = useRef(item?.story.id);
  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    return () => modal?.close();
  }, []);
  useEffect(() => {
    if (previousId.current === item?.story.id) return;
    previousId.current = item?.story.id;
    title.current?.focus({ preventScroll: true });
  }, [item?.story.id]);

  function close() { dialog.current?.close(); onClose(); }
  function navigate(offset: number) {
    const id = passedIds[index + offset];
    if (id) onNavigate(id);
  }

  return createPortal(<dialog ref={dialog} className="version-b-passed-dialog version-b-viewport-fit" aria-labelledby="version-b-passed-title" onCancel={event => { if (event.target === event.currentTarget) { event.preventDefault(); close(); } }} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }} onPointerDown={event => event.stopPropagation()} onKeyDown={event => {
    if (!(event.target instanceof Element) || event.target.closest("dialog") !== event.currentTarget || event.defaultPrevented) return;
    if (event.key === "Tab") {
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')].filter(node => node.getClientRects().length > 0);
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
    }
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); navigate(event.key === "ArrowLeft" ? -1 : 1); }
  }}>
    <header className="version-b-passed-header"><h2 id="version-b-passed-title" ref={title} tabIndex={-1}>Review passed companies</h2><button type="button" autoFocus aria-label="Close passed companies" onClick={close}><X aria-hidden="true" /> Close</button></header>
    <div className="version-b-passed-stage" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {item ? <div className="version-b-passed-card-frame"><FounderCardB key={item.story.id} item={item} saved={false} decisionsDisabled={false} onInterested={() => onInterested(item.story.id)} onInvest={() => onInvest(item)} /></div> : <div className="version-b-passed-empty" role="status"><h3>No passed companies to review</h3><p>You can undo your last change or close this window.</p></div>}
    </div>
    <footer className="version-b-passed-footer"><button type="button" disabled={!item || index === 0} aria-label="Previous passed company" onClick={() => navigate(-1)}><ArrowLeft aria-hidden="true" /><span>Previous</span></button><div className="version-b-passed-feedback">{feedback}</div><button type="button" disabled={!item || index === passedIds.length - 1} aria-label="Next passed company" onClick={() => navigate(1)}><span>Next</span><ArrowRight aria-hidden="true" /></button></footer>
    <p className="sr-only" role="status" aria-live="polite">{item ? `${item.story.companyName} selected.` : "No passed companies to review."}</p>
  </dialog>, document.body);
}
