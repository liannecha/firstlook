"use client";

import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Check, Undo2, RotateCcw, X } from "lucide-react";
import { founderStories } from "../../founders";
import { founderVideoSources } from "../founder-videos";
import { useWatchlist } from "../../watchlist";
import { orderedGroups } from "../../watchlist-model";
import FounderCardB, { type CardItemB } from "./founder-card-b";
import PassedReviewB from "./passed-review-b";
import { recordPassed, removePassed, visiblePassed } from "./passed-history-b";
import "./carousel-b.css";

const items = founderStories.map(story => ({ story, videoSrc: founderVideoSources[story.id] }));
type Feed = "weekly" | "discover";
type FeedTab = Feed | "interested";
const feedTabs = [{ id: "interested", label: "Interested" }, { id: "weekly", label: "Your Weekly Round-up" }, { id: "discover", label: "Discover" }] as const;
type Decision = { feed: FeedTab; index: number; action: "pass" | "save"; addedSave: boolean; removedSave: boolean; previousPassed: readonly string[]; source: "feed" | "passed-review" };
const initialOrder = items.map((_, index) => (index + 1) % items.length);

export default function CarouselB() {
  const fitStage = useRef<HTMLDivElement>(null);
  const [screenFit, setScreenFit] = useState({ width: 840, height: 470, left: 0, top: 80 });
  const [informationRevision, setInformationRevision] = useState(0);
  const [activeTab, setActiveTab] = useState<FeedTab>("weekly");
  const [queues, setQueues] = useState<Record<Feed, number[]>>(() => ({ weekly: [...initialOrder], discover: [...initialOrder] }));
  const [interestedCursor, setInterestedCursor] = useState<string | null>(null);
  const [lastDecision, setLastDecision] = useState<Decision | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [passedHistory, setPassedHistory] = useState<string[]>([]);
  const [passedOpen, setPassedOpen] = useState(false);
  const [passedCursor, setPassedCursor] = useState<string | null>(null);
  const [resumeBackground, setResumeBackground] = useState(true);
  const passedTrigger = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const busyRef = useRef(false);
  const gesture = useRef<{ id: number; x: number; y: number; offset: number; horizontal: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState(-1);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardHeading = useRef<HTMLHeadingElement>(null);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const watchlist = useWatchlist();
  const { savedIds, ready, toggle, removeMany } = watchlist;
  const interestedGroups = orderedGroups(watchlist);
  const interestedIndices = [...interestedGroups.pinned, ...interestedGroups.others].map(id => items.findIndex(item => item.story.id === id)).filter(index => index >= 0);
  const interestedStart = interestedIndices.findIndex(index => items[index].story.id === interestedCursor);
  const interestedCards = interestedStart > 0 ? [...interestedIndices.slice(interestedStart), ...interestedIndices.slice(0, interestedStart)] : interestedIndices;
  const remaining = !ready ? [] : activeTab === "interested" ? interestedCards : activeTab === "weekly" ? queues.weekly.filter(index => !savedIds.includes(items[index].story.id)) : queues.discover;
  const selected = remaining[0] ?? -1;
  const complete = selected === -1;
  const busy = phase !== "idle";
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [review, setReview] = useState<{ companyId: string; companyName: string; amount: number; campaignUrl?: string } | null>(null);
  const [reviewStep, setReviewStep] = useState<"amount" | "review">("amount");
  const reviewDialog = useRef<HTMLDialogElement>(null);
  const page = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const item = items[selected < 0 ? 0 : selected];
  const story = item.story;
  const saved = savedIds.includes(story.id);
  const passedIds = visiblePassed(passedHistory, savedIds);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    const stage = fitStage.current;
    if (!stage) return;
    let frame = 0;
    function measure() {
      if (!stage) return;
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const padding = viewportWidth < 600 ? 12 : 24;
      const toolbarHeight = Math.ceil((page.current?.querySelector(".version-b-expanded-toolbar")?.getBoundingClientRect().bottom ?? 60) + 16);
      const utilities = page.current?.querySelector<HTMLElement>(".version-b-bottom-utilities");
      const bottomInset = utilities ? viewportHeight - utilities.getBoundingClientRect().top : 52;
      const availableWidth = Math.max(1, viewportWidth - padding * 2 - 20);
      const availableHeight = Math.max(1, viewportHeight - toolbarHeight - bottomInset);
      const mobile = viewportWidth <= 680;
      const height = Math.floor(mobile ? availableHeight : Math.min(availableHeight, availableWidth * 470 / 820));
      const width = Math.floor(mobile ? availableWidth : height * 820 / 470);
      const next = { width: width + 20, height, left: Math.round((viewportWidth - width - 20) / 2), top: Math.round(toolbarHeight + availableHeight - height) };
      setScreenFit(previous => previous.width === next.width && previous.height === next.height && previous.left === next.left && previous.top === next.top ? previous : next);
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
    const observer = new ResizeObserver(schedule);
    observer.observe(stage);
    const toolbar = page.current?.querySelector(".version-b-expanded-toolbar");
    if (toolbar) observer.observe(toolbar);
    const utilities = page.current?.querySelector(".version-b-bottom-utilities");
    if (utilities) observer.observe(utilities);
    stage.querySelectorAll(".version-b-stack-deck, .version-b-stack-layer, .version-b-stack-complete, .version-b-below-card-feedback").forEach(node => observer.observe(node));
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    stage.addEventListener("transitionend", schedule);
    stage.addEventListener("animationend", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      stage.removeEventListener("transitionend", schedule);
      stage.removeEventListener("animationend", schedule);
    };
  }, [selected, lastDecision, activeTab]);

  useEffect(() => {
    if (!lastDecision) return;
    const timer = setTimeout(() => {
      if (document.activeElement?.closest(".version-b-decision-feedback")) {
        const closeReview = document.querySelector<HTMLButtonElement>('.version-b-passed-dialog[open] [aria-label="Close passed companies"]');
        const target = closeReview ?? (passedTrigger.current && !passedTrigger.current.disabled ? passedTrigger.current : page.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]'));
        target?.focus({ preventScroll: true });
      }
      setFeedbackVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [lastDecision]);

  function changeFeed(feed: FeedTab) {
    setInformationRevision(previous => previous + 1);
    setActiveTab(feed);
    requestAnimationFrame(() => document.getElementById(`version-b-tab-${feed}`)?.focus({ preventScroll: true }));
  }

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  function focusCurrentCard() {
    requestAnimationFrame(() => {
      (cardHeading.current ?? completionHeading.current)?.focus({ preventScroll: true });
    });
  }

  function decide(action: "pass" | "save") {
    if (busyRef.current || complete || !ready) return;
    busyRef.current = true;
    setExitDirection(action === "save" ? 1 : -1);
    videoRef.current?.pause();
    const decision: Decision = { feed: activeTab, index: selected, action, addedSave: action === "save" && !saved, removedSave: activeTab === "interested" && action === "pass" && saved, previousPassed: [...passedHistory], source: "feed" };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function commit() {
      setDragX(0);
      if (decision.addedSave || decision.removedSave) toggle(story.id);
      if (action === "save") setPassedHistory(previous => removePassed(previous, story.id));
      else if (decision.feed !== "interested") setPassedHistory(previous => recordPassed(previous, story.id));
      setLastDecision(decision);
      setFeedbackVisible(true);
      if (decision.feed === "interested") {
        const nextIndex = remaining[1] ?? (decision.removedSave ? undefined : remaining[0]);
        setInterestedCursor(nextIndex === undefined ? null : items[nextIndex].story.id);
      } else {
        const feed = decision.feed;
        setQueues(previous => ({ ...previous, [feed]: previous[feed].filter(index => index !== decision.index) }));
      }
    }
    function finish() {
      busyRef.current = false;
      transitionTimer.current = null;
      setPhase("idle");
      focusCurrentCard();
    }
    if (reduced) {
      commit();
      finish();
      return;
    }
    setPhase("leaving");
    transitionTimer.current = setTimeout(() => {
      commit();
      if (remaining.length === 1) finish();
      else {
        setPhase("entering");
        transitionTimer.current = setTimeout(finish, 260);
      }
    }, 220);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (busyRef.current || !ready || !event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    if (event.target instanceof Element && event.target.closest("button, input, a, form, [role='button']")) return;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, offset: 0, horizontal: false };
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.horizontal) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
      if (Math.abs(dy) >= Math.abs(dx)) { gesture.current = null; return; }
      current.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      suppressClick.current = true;
    }
    current.offset = dx;
    setDragX(current.offset);
  }

  function endDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const current = gesture.current;
    if (!current || current.id !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const threshold = Math.min(100, event.currentTarget.offsetWidth * .22);
    if (!cancelled && current.horizontal && Math.abs(current.offset) >= threshold) decide(current.offset > 0 ? "save" : "pass");
    else setDragX(0);
  }

  function undoDecision() {
    if (busyRef.current || !lastDecision || !ready) return;
    setInformationRevision(previous => previous + 1);
    const { feed, index, addedSave, removedSave } = lastDecision;
    const restoredStory = items[index].story;
    if (addedSave && savedIds.includes(restoredStory.id)) toggle(restoredStory.id);
    if (removedSave && !savedIds.includes(restoredStory.id)) toggle(restoredStory.id);
    setPassedHistory([...lastDecision.previousPassed]);
    if (lastDecision.source === "passed-review") {
      setPassedCursor(restoredStory.id);
      setLastDecision(null);
      if (!passedOpen) focusCurrentCard();
      return;
    }
    if (feed === "interested") setInterestedCursor(restoredStory.id);
    else setQueues(previous => ({ ...previous, [feed]: [index, ...previous[feed].filter(item => item !== index)] }));
    setActiveTab(feed);
    setLastDecision(null);
    focusCurrentCard();
  }

  function resetRoundup() {
    if (busyRef.current || !ready) return;
    removeMany(items.map(item => item.story.id));
    setQueues(previous => ({ ...previous, weekly: [...initialOrder] }));
    setInterestedCursor(null);
    setLastDecision(null);
    setPassedHistory([]);
    setPassedCursor(null);
    setDragX(0);
    setDragging(false);
    gesture.current = null;
    suppressClick.current = false;
    changeFeed("weekly");
  }

  function openDiscover() {
    changeFeed("discover");
    requestAnimationFrame(() => document.getElementById("version-b-tab-discover")?.focus({ preventScroll: true }));
  }
  function openInvestment(cardItem: CardItemB) {
    const company = cardItem.story;
    setReview({ companyId: company.id, companyName: company.companyName, amount: Number(amounts[company.id]), campaignUrl: company.campaignUrl });
    setReviewStep("amount");
    reviewDialog.current?.showModal();
    requestAnimationFrame(() => reviewDialog.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }));
  }

  function openPassedReview() {
    if (busy || !ready || !passedIds.length) return;
    setResumeBackground(videoRef.current ? !videoRef.current.paused : false);
    setPassedCursor(passedIds[0]);
    setPassedOpen(true);
  }

  function closePassedReview() {
    setPassedOpen(false);
    requestAnimationFrame(() => {
      if (passedTrigger.current && !passedTrigger.current.disabled) passedTrigger.current.focus({ preventScroll: true });
      else document.getElementById(`version-b-tab-${activeTab}`)?.focus({ preventScroll: true });
    });
  }

  function recoverPassed(id: string) {
    if (!ready) return;
    const index = items.findIndex(item => item.story.id === id);
    if (index < 0 || !passedIds.includes(id)) return;
    const position = passedIds.indexOf(id);
    setLastDecision({ feed: activeTab, index, action: "save", addedSave: !savedIds.includes(id), removedSave: false, previousPassed: [...passedHistory], source: "passed-review" });
    setFeedbackVisible(true);
    if (!savedIds.includes(id)) toggle(id);
    setPassedHistory(previous => removePassed(previous, id));
    setPassedCursor(passedIds[position + 1] ?? passedIds[position - 1] ?? null);
  }

  const decisionAction = lastDecision ? lastDecision.removedSave ? "removed from Interested" : lastDecision.action === "pass" ? "passed" : lastDecision.addedSave ? "marked interested" : "kept in Interested" : "";
  const decisionFeedback = lastDecision && feedbackVisible ? <div className="version-b-decision-feedback"><span className="version-b-feedback-message" title={`${items[lastDecision.index].story.companyName} ${decisionAction}.`}><span className="version-b-feedback-company">{items[lastDecision.index].story.companyName}</span>{" "}<span className="version-b-feedback-action">{decisionAction}.</span></span><button type="button" disabled={busy || !ready} onClick={undoDecision}><Undo2 aria-hidden="true" /> Undo</button></div> : null;

  // The main card, inert backing preview, and review overlay share one card layout.
  function renderCardContent(cardItem: CardItemB, preview = false) {
    return <FounderCardB key={cardItem.story.id} item={cardItem} preview={preview} active={phase === "idle"} suspended={!preview && passedOpen} resumeAfterReview={resumeBackground} revision={informationRevision} videoRef={preview ? undefined : videoRef} headingRef={preview ? undefined : cardHeading} saved={savedIds.includes(cardItem.story.id)} decisionsDisabled={busy || !ready} onInterested={() => decide("save")} onPass={() => decide("pass")} onInvest={() => { if (!preview) openInvestment(cardItem); }} />;
  }

  function renderFeedTabs() {
    return (<div className="version-b-feed-tabs" role="tablist" aria-label="Founder feeds">
          {feedTabs.map((tab, index) => (
            <button key={tab.id} id={`version-b-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls="version-b-feed-panel" tabIndex={activeTab === tab.id ? 0 : -1} className="version-b-feed-tab" disabled={busy} onClick={() => changeFeed(tab.id)} onKeyDown={event => {
              if (event.altKey || event.ctrlKey || event.metaKey) return;
              let next: number;
              if (event.key === "ArrowRight") next = (index + 1) % feedTabs.length;
              else if (event.key === "ArrowLeft") next = (index - 1 + feedTabs.length) % feedTabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = feedTabs.length - 1;
              else return;
              event.preventDefault();
              changeFeed(feedTabs[next].id);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}>{tab.label}</button>
          ))}
        </div>
    );
  }

  return (
    <main ref={page} className="version-b-placeholder-page version-b-viewport-fit">
      <div className="version-b-expanded-toolbar">
        {renderFeedTabs()}
      </div>
      <h1 className="sr-only">Discover founder stories</h1>
      <div ref={fitStage} className="version-b-fit-stage" style={{ width: screenFit.width, left: screenFit.left, top: screenFit.top, "--viewport-card-height": `${screenFit.height}px` } as CSSProperties}>
      <div className="version-b-placeholder-layout">
        <div key="feed-panel" id="version-b-feed-panel" role="tabpanel" aria-labelledby={`version-b-tab-${activeTab}`}>
        <section className="version-b-story-stack" aria-label="Founder card stack" aria-busy={busy}>
          {!ready ? <div className="version-b-stack-complete" role="status"><p>Loading founders…</p></div> : complete ? <div className="version-b-stack-complete">
            <span className="version-b-complete-icon" aria-hidden="true">{activeTab === "interested" ? <Bookmark /> : <Check />}</span>
            <h2 ref={completionHeading} tabIndex={-1}>{activeTab === "interested" ? "No interested companies yet" : "You’re all caught up"}</h2>
            <p>{activeTab === "interested" ? "Choose Interested on a founder to save their company here." : activeTab === "weekly" ? "You’ve explored this week’s founders. Keep exploring in Discover, or revisit Interested." : "You’ve explored the available founders. Revisit the companies in Interested."}</p>
            <div className="version-b-complete-actions">
              {activeTab === "weekly" ? <button type="button" className="version-b-decision-save" onClick={openDiscover}>Go to Discover <ArrowRight aria-hidden="true" /></button> : null}
              {activeTab === "interested" ? <button type="button" className="version-b-decision-save" onClick={() => changeFeed("weekly")}>Explore founders <ArrowRight aria-hidden="true" /></button> : <button type="button" className="version-b-decision-pass" onClick={() => changeFeed("interested")}>View Interested</button>}
            </div>
          </div> : <div className="version-b-stack-window">
            <div className={`version-b-stack-deck version-b-phase-${phase}`}>
              {remaining.length > 2 ? <div className="version-b-stack-layer version-b-stack-layer-back" aria-hidden="true" /> : null}
              {remaining.length > 1 ? <div className="version-b-stack-layer version-b-stack-layer-near" aria-hidden="true" /> : null}
              {remaining[1] !== undefined ? <div key={items[remaining[1]].story.id} className="version-b-stack-preview" aria-hidden="true" inert>
                {renderCardContent(items[remaining[1]], true)}
              </div> : null}
              <div className={`version-b-stack-front version-b-is-current${dragging ? " version-b-is-dragging" : ""}`}
                style={{ "--drag-x": `${dragX}px`, "--drag-rotation": `${Math.max(-12, Math.min(12, dragX / 30))}deg`, "--exit-x": `${exitDirection * 110}%`, "--exit-rotation": `${exitDirection * 10}deg` } as CSSProperties}
                onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)} onLostPointerCapture={event => endDrag(event, true)}
                onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
                inert={busy} role="group" aria-label={`${story.companyName} story`}>
                  {dragging ? <div className={`version-b-swipe-hint${dragX > 0 ? " version-b-swipe-save" : ""}`} aria-hidden="true">{dragX > 0 ? saved ? "Next founder" : "Add to watchlist" : "Pass"}</div> : null}
                  {renderCardContent(item)}
              </div>
            </div>
          </div>}
          <p className="sr-only" role="status" aria-live="polite">{busy ? "" : !ready ? "Loading founders." : complete ? activeTab === "interested" ? "No interested companies yet." : "You’re all caught up." : `${story.companyName} selected.`}</p>
        </section>
        </div>

      </div>
      </div>
      <button type="button" className="version-b-reset-roundup" disabled={busy || !ready} onClick={resetRoundup} aria-label="Reset roundup" title="Reset roundup"><RotateCcw aria-hidden="true" /></button>
      <div className="version-b-bottom-utilities" style={{ left: screenFit.left, width: Math.max(1, screenFit.width - 20) }}>
        <div className="version-b-footer-status-line">
          <button ref={passedTrigger} type="button" className="version-b-review-passed" disabled={busy || !ready || !passedIds.length} onClick={openPassedReview}>Review passed companies</button>
          {decisionFeedback}
        </div>
      </div>
      {passedOpen ? <PassedReviewB items={items} passedIds={passedIds} selectedId={passedCursor} onNavigate={setPassedCursor} onInterested={recoverPassed} onInvest={openInvestment} onClose={closePassedReview} feedback={decisionFeedback} /> : null}
      <dialog ref={reviewDialog} className="version-b-investment-review" aria-labelledby="investment-review-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="version-b-investment-review-close" aria-label="Close investment review" onClick={() => reviewDialog.current?.close()}><X aria-hidden="true" /></button>
        <p className="version-b-story-eyebrow">{review?.companyName}</p>
        <h2 id="investment-review-title" tabIndex={-1}>{reviewStep === "amount" ? "Investment amount" : "Review investment"}</h2>
        {reviewStep === "amount" ? <form className="version-b-dialog-investment-form" onSubmit={event => {
          event.preventDefault();
          if (!review) return;
          setReview({ ...review, amount: Number(amounts[review.companyId]) });
          setReviewStep("review");
          requestAnimationFrame(() => reviewDialog.current?.querySelector<HTMLHeadingElement>("h2")?.focus({ preventScroll: true }));
        }}>
          <label className="version-b-story-investment-label" htmlFor="version-b-dialog-investment-amount">Amount<span>min $300</span></label>
          <div className="version-b-story-amount-row">
            <div className="version-b-story-amount-field"><span aria-hidden="true">$</span><input id="version-b-dialog-investment-amount" aria-label={`Investment amount for ${review?.companyName ?? "company"} in dollars`} type="number" inputMode="decimal" min="300" step="0.01" required placeholder="Amount" value={review ? amounts[review.companyId] ?? "" : ""} onChange={event => { if (review) setAmounts(previous => ({ ...previous, [review.companyId]: event.target.value })); }} /></div>
            <button type="submit" className="version-b-story-investment-next">Review <ArrowRight aria-hidden="true" /></button>
          </div>
        </form> : <>
          <p className="version-b-investment-review-amount">{review ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(review.amount) : ""}</p>
          <p className="version-b-investment-review-note">{review?.campaignUrl ? "Continue to the campaign page to review terms and complete your investment." : "Investment link coming soon. No investment has been made."}</p>
          {review?.campaignUrl ? <a className="version-b-story-action" href={review.campaignUrl} target="_blank" rel="noopener noreferrer">View campaign <ArrowRight aria-hidden="true" /></a> : null}
          <button type="button" className="version-b-investment-review-back" onClick={() => { setReviewStep("amount"); requestAnimationFrame(() => reviewDialog.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true })); }}>Edit amount</button>
        </>}
      </dialog>
    </main>
  );
}
