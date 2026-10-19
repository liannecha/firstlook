"use client";

import { type CSSProperties, useEffect, useEffectEvent, useRef, useState } from "react";
import { ArrowRight, Undo2, RotateCcw, X } from "lucide-react";
import { founderStories } from "../../founders";
import { founderVideoSources } from "../founder-videos";
import { useWatchlist } from "../../watchlist";
import FounderCardB, { type CardItemB } from "./founder-card-c";
import { recordPassed, removePassed, visiblePassed } from "./passed-history-c";
import "./carousel-c.css";
import RoundupResultsC from "./roundup-results-c";

const items = founderStories.map(story => ({ story, videoSrc: founderVideoSources[story.id] }));
type Decision = { index: number; action: "pass" | "save"; addedSave: boolean; previousPassed: readonly string[] };
const initialOrder = items.map((_, index) => (index + 1) % items.length);

export default function CarouselB() {
  const fitStage = useRef<HTMLDivElement>(null);
  const [screenFit, setScreenFit] = useState({ width: 840, height: 470, left: 0, top: 80 });
  const [informationRevision, setInformationRevision] = useState(0);
  const [queue, setQueue] = useState<number[]>(() => [...initialOrder]);
  const [lastDecision, setLastDecision] = useState<Decision | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [passedHistory, setPassedHistory] = useState<string[]>([]);
  const [phase, setPhase] = useState<"idle" | "leaving" | "entering">("idle");
  const busyRef = useRef(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeSurface = useRef<HTMLDivElement>(null);
  const [exitDirection, setExitDirection] = useState(-1);
  const transitionComplete = useRef<(() => void) | null>(null);
  const cardHeading = useRef<HTMLHeadingElement>(null);
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const watchlist = useWatchlist();
  const { savedIds, ready, toggle, removeMany } = watchlist;
  const remaining = !ready ? [] : queue.filter(index => !savedIds.includes(items[index].story.id));
  const selected = remaining[0] ?? -1;
  const complete = selected === -1;
  const busy = phase !== "idle";
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [review, setReview] = useState<{ companyId: string; companyName: string; amount: number; campaignUrl?: string } | null>(null);
  const [reviewStep, setReviewStep] = useState<"amount" | "review">("amount");
  const reviewDialog = useRef<HTMLDialogElement>(null);
  const page = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const story = items[selected < 0 ? 0 : selected].story;
  const saved = savedIds.includes(story.id);
  const interestedCount = ready ? items.filter(item => savedIds.includes(item.story.id)).length : 0;
  const passedCount = ready ? visiblePassed(passedHistory, savedIds).filter(id => items.some(item => item.story.id === id)).length : 0;
  const reviewedCount = interestedCount + passedCount;
  const total = items.length;

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
  }, [selected, lastDecision]);

  useEffect(() => {
    if (!lastDecision) return;
    const timer = setTimeout(() => {
      if (document.activeElement?.closest(".version-b-decision-feedback")) {
        (cardHeading.current ?? completionHeading.current)?.focus({ preventScroll: true });
      }
      setFeedbackVisible(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [lastDecision]);

  function focusCurrentCard() {
    requestAnimationFrame(() => {
      (cardHeading.current ?? completionHeading.current)?.focus({ preventScroll: true });
    });
  }

  function decide(action: "pass" | "save") {
    if (busyRef.current || complete || !ready) return;
    busyRef.current = true;
    setSwiping(false);
    setExitDirection(action === "save" ? 1 : -1);
    videoRef.current?.pause();
    const decision: Decision = { index: selected, action, addedSave: action === "save" && !saved, previousPassed: [...passedHistory] };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function commit() {
      setSwipeX(0);
      setSwiping(false);
      if (decision.addedSave) toggle(story.id);
      setPassedHistory(previous => action === "save" ? removePassed(previous, story.id) : recordPassed(previous, story.id));
      setLastDecision(decision);
      setFeedbackVisible(true);
      setQueue(previous => previous.filter(index => index !== decision.index));
    }
    function finish() {
      busyRef.current = false;
      transitionComplete.current = null;
      setPhase("idle");
      focusCurrentCard();
    }
    if (reduced) {
      commit();
      finish();
      return;
    }
    transitionComplete.current = () => {
      commit();
      if (remaining.length === 1) finish();
      else {
        transitionComplete.current = finish;
        setPhase("entering");
      }
    };
    setPhase("leaving");
  }

  const commitSwipe = useEffectEvent((direction: number) => {
    decide(direction > 0 ? "save" : "pass");
  });

  useEffect(() => {
    const surface = swipeSurface.current;
    if (!surface) return;
    let distance = 0;
    let lastEvent = 0;
    let consumed = false;
    let settling: ReturnType<typeof setTimeout> | undefined;
    function onWheel(event: WheelEvent) {
      // Pixel wheel events are the browser's horizontal trackpad gesture signal.
      if (event.ctrlKey || event.deltaMode !== 0) return;
      const now = performance.now();
      if (now - lastEvent > 250) { distance = 0; consumed = false; }
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY) * 1.25;
      if (!horizontal && !consumed) return;
      lastEvent = now;
      if (horizontal) event.preventDefault();
      if (consumed || busyRef.current || !horizontal) return;
      if (settling) clearTimeout(settling);
      distance -= event.deltaX;
      setSwiping(true);
      setSwipeX(distance);
      const card = surface?.querySelector<HTMLElement>(".version-b-stack-front");
      const threshold = Math.min(160, Math.max(80, (card?.offsetWidth ?? 500) * .2));
      if (Math.abs(distance) >= threshold) {
        consumed = true;
        commitSwipe(distance);
      } else {
        settling = setTimeout(() => {
          distance = 0;
          setSwiping(false);
          setSwipeX(0);
        }, 150);
      }
    }
    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      surface.removeEventListener("wheel", onWheel);
      if (settling) clearTimeout(settling);
    };
  }, [ready, complete]);

  function undoDecision() {
    if (busyRef.current || !lastDecision || !ready) return;
    setInformationRevision(previous => previous + 1);
    const { index, addedSave } = lastDecision;
    const restoredStory = items[index].story;
    if (addedSave && savedIds.includes(restoredStory.id)) toggle(restoredStory.id);
    setPassedHistory([...lastDecision.previousPassed]);
    setQueue(previous => [index, ...previous.filter(item => item !== index)]);
    setLastDecision(null);
    focusCurrentCard();
  }

  function resetRoundup() {
    if (busyRef.current || !ready) return;
    setSwipeX(0);
    setSwiping(false);
    removeMany(items.map(item => item.story.id));
    setQueue([...initialOrder]);
    setLastDecision(null);
    setPassedHistory([]);
    setInformationRevision(previous => previous + 1);
  }

  function openInvestment(cardItem: CardItemB) {
    const company = cardItem.story;
    setReview({ companyId: company.id, companyName: company.companyName, amount: Number(amounts[company.id]), campaignUrl: company.campaignUrl });
    setReviewStep("amount");
    reviewDialog.current?.showModal();
    requestAnimationFrame(() => reviewDialog.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }));
  }

  const decisionAction = lastDecision?.action === "pass" ? "passed" : "marked interested";
  const decisionFeedback = lastDecision && feedbackVisible ? <div className="version-b-decision-feedback"><span className="version-b-feedback-message" title={`${items[lastDecision.index].story.companyName} ${decisionAction}.`}><span className="version-b-feedback-company">{items[lastDecision.index].story.companyName}</span>{" "}<span className="version-b-feedback-action">{decisionAction}.</span></span><button type="button" disabled={busy || !ready} onClick={undoDecision}><Undo2 aria-hidden="true" /> Undo</button></div> : null;

  // The main card, inert backing preview, and review overlay share one card layout.
  function renderCardContent(cardItem: CardItemB, preview = false) {
    return <FounderCardB key={cardItem.story.id} item={cardItem} preview={preview} active={!preview && phase !== "leaving"} revision={informationRevision} videoRef={preview ? undefined : videoRef} headingRef={preview ? undefined : cardHeading} saved={savedIds.includes(cardItem.story.id)} decisionsDisabled={busy || !ready} onInterested={() => decide("save")} onPass={() => decide("pass")} onInvest={() => { if (!preview) openInvestment(cardItem); }} />;
  }


  return (
    <main ref={page} className="version-b-placeholder-page version-b-viewport-fit">
      <header className="version-b-expanded-toolbar version-b-roundup-header" style={{ left: screenFit.left, width: Math.max(1, screenFit.width - 20) }}>
        <div className="version-b-roundup-heading"><h1 id="version-b-roundup-title">Your weekly roundup</h1><span>{reviewedCount} of {total} reviewed</span></div>
        <div className="version-b-roundup-progress" role="progressbar" aria-label="Weekly roundup reviewed" aria-valuemin={0} aria-valuemax={total} aria-valuenow={reviewedCount}><div style={{ width: `${total ? reviewedCount / total * 100 : 100}%` }} /></div>
      </header>
      <div ref={fitStage} className={`version-b-fit-stage${ready && complete ? " version-c-results-stage" : ""}`} style={{ width: screenFit.width, left: screenFit.left, top: screenFit.top, "--viewport-card-height": `${screenFit.height}px` } as CSSProperties}>
      <div className="version-b-placeholder-layout">
        <div key="feed-panel" id="version-b-feed-panel" role="region" aria-labelledby="version-b-roundup-title">
        <section ref={swipeSurface} className="version-b-story-stack" aria-label="Founder card stack" aria-busy={busy}>
          {!ready ? <div className="version-b-stack-complete" role="status"><p>Loading founders…</p></div> : complete ? <RoundupResultsC items={initialOrder.map(index => items[index])} savedIds={savedIds} passedIds={visiblePassed(passedHistory, savedIds)} headingRef={completionHeading} onSave={id => {
            if (!savedIds.includes(id)) toggle(id);
            setPassedHistory(previous => removePassed(previous, id));
            setLastDecision(null);
          }} onInvest={openInvestment} /> : <div className="version-b-stack-window">
            <div className={`version-b-stack-deck version-b-phase-${phase}`}>
              {remaining.length > 2 ? <div className="version-b-stack-layer version-b-stack-layer-back" aria-hidden="true" /> : null}
              {remaining.length > 1 ? <div className="version-b-stack-layer version-b-stack-layer-near" aria-hidden="true" /> : null}
              {remaining.slice(0, 2).map((index, position) => {
                const current = position === 0;
                const cardItem = items[index];
                return <div key={cardItem.story.id}
                  className={current ? `version-b-stack-front version-b-is-current${swiping ? " version-c-is-swiping" : ""}` : "version-b-stack-preview"}
                  style={current ? { "--drag-x": `${swipeX}px`, "--drag-rotation": `${Math.max(-4, Math.min(4, swipeX / 40))}deg`, "--exit-x": `${exitDirection * 110}%`, "--exit-rotation": `${exitDirection * 10}deg` } as CSSProperties : undefined}
                  onAnimationEnd={event => {
                    if (current && event.target === event.currentTarget) transitionComplete.current?.();
                  }}
                  aria-hidden={!current || undefined} inert={!current || busy}
                  role={current ? "group" : undefined} aria-label={current ? `${cardItem.story.companyName} story` : undefined}>
                  {renderCardContent(cardItem, !current)}
                </div>;
              })}
            </div>
          </div>}
          <p className="sr-only" role="status" aria-live="polite">{busy ? "" : !ready ? "Loading founders." : complete ? "You’re all caught up." : `${story.companyName} selected.`}</p>
        </section>
        </div>

      </div>
      </div>
      <button type="button" className="version-b-reset-roundup" disabled={busy || !ready} onClick={resetRoundup} aria-label="Reset roundup" title="Reset roundup"><RotateCcw aria-hidden="true" /></button>
      <div className="version-b-bottom-utilities" style={{ left: screenFit.left, width: Math.max(1, screenFit.width - 20) }}>
        <div className="version-b-footer-status-line">
          {decisionFeedback}
        </div>
      </div>
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
