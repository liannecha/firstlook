"use client";

import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, Check, Undo2, Maximize2, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import Link from "next/link";
import { founderStories } from "../../founders";
import { founderVideoSources } from "../founder-videos";
import { useWatchlist } from "../../watchlist";
import WatchlistDrawerB from "./watchlist-drawer-b";
import CompanyInformationB from "./company-information-b";
import "./carousel-b.css";

const items = founderStories.map(story => ({ story, videoSrc: founderVideoSources[story.id] }));
type Feed = "weekly" | "discover";
type Decision = { feed: Feed; index: number; action: "pass" | "save"; addedSave: boolean };
const initialOrder = items.map((_, index) => (index + 1) % items.length);

export default function CarouselB() {
  const [expanded, setExpanded] = useState(false);
  const fitStage = useRef<HTMLDivElement>(null);
  const [expandedBase, setExpandedBase] = useState({ width: 1104, minHeight: 420 });
  const [screenFit, setScreenFit] = useState({ scale: 1, left: 0, top: 80 });
  const fitScale = useRef(1);
  const [informationRevision, setInformationRevision] = useState(0);
  const [activeTab, setActiveTab] = useState<"weekly" | "discover">("weekly");
  const [queues, setQueues] = useState<Record<Feed, number[]>>(() => ({ weekly: [...initialOrder], discover: [...initialOrder] }));
  const [lastDecision, setLastDecision] = useState<Decision | null>(null);
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
  const remaining = queues[activeTab];
  const selected = remaining[0] ?? -1;
  const complete = selected === -1;
  const busy = phase !== "idle";
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [review, setReview] = useState<{ companyName: string; amount: number; campaignUrl?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const reviewDialog = useRef<HTMLDialogElement>(null);
  const page = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const { savedIds, ready, toggle } = useWatchlist();
  const item = items[selected < 0 ? 0 : selected];
  const story = item.story;
  const saved = savedIds.includes(story.id);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    };
    const updatePlayback = () => setIsPlaying(!video.paused);
    const updateMuted = () => setIsMuted(video.muted);
    updateTime();
    updatePlayback();
    updateMuted();
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateTime);
    video.addEventListener("play", updatePlayback);
    video.addEventListener("pause", updatePlayback);
    video.addEventListener("volumechange", updateMuted);
    if (phase === "idle") video.play().catch(error => {
      if (error.name !== "AbortError") console.error("Unable to autoplay the founder video:", error);
    });
    else video.pause();
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateTime);
      video.removeEventListener("play", updatePlayback);
      video.removeEventListener("pause", updatePlayback);
      video.removeEventListener("volumechange", updateMuted);
    };
  }, [selected, phase]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const navigation = document.querySelector<HTMLElement>(".shell-navigation");
    const wasInert = navigation?.inert ?? false;
    if (navigation) navigation.inert = true;
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (navigation) navigation.inert = wasInert;
    };
  }, [expanded]);

  function openExpanded() {
    const stage = fitStage.current;
    const card = stage?.querySelector<HTMLElement>(".version-b-stack-front .version-b-slide-pair");
    if (!stage || !card) return;
    setExpandedBase({ width: stage.clientWidth, minHeight: card.getBoundingClientRect().height });
    fitScale.current = 1;
    setScreenFit({ scale: 1, left: 0, top: 80 });
    setExpanded(true);
  }

  useEffect(() => {
    if (!expanded) return;
    const stage = fitStage.current;
    if (!stage) return;
    let frame = 0;
    function measure() {
      if (!stage) return;
      const stageBounds = stage.getBoundingClientRect();
      const regions = Array.from(stage.querySelectorAll<HTMLElement>(".version-b-stack-deck, .version-b-stack-layer, .version-b-stack-complete, .version-b-below-card-feedback"));
      if (!regions.length) return;
      const boxes = regions.map(node => node.getBoundingClientRect());
      const left = Math.min(...boxes.map(box => box.left));
      const top = Math.min(...boxes.map(box => box.top));
      const width = (Math.max(...boxes.map(box => box.right)) - left) / fitScale.current;
      const height = (Math.max(...boxes.map(box => box.bottom)) - top) / fitScale.current;
      const x = (left - stageBounds.left) / fitScale.current;
      const y = (top - stageBounds.top) / fitScale.current;
      const viewport = window.visualViewport;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const padding = viewportWidth < 600 ? 12 : 24;
      const toolbarHeight = (page.current?.querySelector(".version-b-expanded-toolbar")?.getBoundingClientRect().bottom ?? 60) + 16;
      const scale = Math.min((viewportWidth - padding * 2) / width, (viewportHeight - toolbarHeight - padding) / height);
      const next = { scale, left: (viewportWidth - width * scale) / 2 - x * scale, top: toolbarHeight + (viewportHeight - toolbarHeight - padding - height * scale) / 2 - y * scale };
      fitScale.current = scale;
      setScreenFit(previous => Math.abs(previous.scale - next.scale) < .0001 && Math.abs(previous.left - next.left) < .1 && Math.abs(previous.top - next.top) < .1 ? previous : next);
    }
    function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
    const observer = new ResizeObserver(schedule);
    observer.observe(stage);
    const toolbar = page.current?.querySelector(".version-b-expanded-toolbar");
    if (toolbar) observer.observe(toolbar);
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
  }, [expanded, selected, lastDecision]);

  function changeFeed(feed: Feed) {
    setInformationRevision(previous => previous + 1);
    setActiveTab(feed);
  }

  function closeExpanded() {
    setExpanded(false);
    requestAnimationFrame(() => {
      page.current?.querySelector<HTMLButtonElement>(".version-b-stack-front .version-b-story-expand")?.focus({ preventScroll: true });
    });
  }
  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  function focusCurrentCard() {
    requestAnimationFrame(() => {
      (cardHeading.current ?? completionHeading.current)?.focus({ preventScroll: true });
      const card = page.current?.querySelector<HTMLElement>(".version-b-stack-deck, .version-b-stack-complete");
      const navigationHeight = expanded ? 64 : parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--topbar-height")) || 88;
      if (!expanded && card && card.getBoundingClientRect().top < navigationHeight + 8) card.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }

  function decide(action: "pass" | "save") {
    if (busyRef.current || complete || !ready) return;
    busyRef.current = true;
    setExitDirection(action === "save" ? 1 : -1);
    videoRef.current?.pause();
    const decision: Decision = { feed: activeTab, index: selected, action, addedSave: action === "save" && !saved };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function commit() {
      setDragX(0);
      if (decision.addedSave) toggle(story.id);
      setLastDecision(decision);
      setQueues(previous => ({ ...previous, [decision.feed]: previous[decision.feed].slice(1) }));
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
    current.offset = dx / (expanded ? fitScale.current : 1);
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
    const { feed, index, addedSave } = lastDecision;
    const restoredStory = items[index].story;
    if (addedSave && savedIds.includes(restoredStory.id)) toggle(restoredStory.id);
    setQueues(previous => ({ ...previous, [feed]: [index, ...previous[feed].filter(item => item !== index)] }));
    setActiveTab(feed);
    setLastDecision(null);
    focusCurrentCard();
  }

  function openDiscover() {
    setExpanded(false);
    changeFeed("discover");
    requestAnimationFrame(() => document.getElementById("version-b-tab-discover")?.focus({ preventScroll: true }));
  }
  function toggleVideoPlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(error => console.error("Unable to play the founder video:", error));
    else video.pause();
  }
  function toggleVideoMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }
  function seekVideo(event: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(event.currentTarget.value);
    setCurrentTime(video.currentTime);
  }
  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  const decisionFeedback = lastDecision ? <div className="version-b-decision-feedback"><span>{items[lastDecision.index].story.companyName} {lastDecision.action === "pass" ? "passed" : lastDecision.addedSave ? "added to watchlist" : "kept in watchlist"}.</span><button type="button" disabled={busy || !ready} onClick={undoDecision}><Undo2 aria-hidden="true" /> Undo</button></div> : null;

  // Both layers use the same layout; the underlying card is inert and its video stays paused.
  function renderCardContent(cardItem: typeof items[number], preview = false) {
    const story = cardItem.story;
    const saved = savedIds.includes(story.id);
    return (
      <div className="version-b-slide-pair">
                    {!expanded ? <button type="button" className="version-b-story-expand" aria-label={`Expand ${story.companyName} story`} title="Expand story" onClick={event => {
                      event.stopPropagation();
                      openExpanded();
                    }}><Maximize2 aria-hidden="true" /></button> : null}
                    <div className="version-b-slide-box" onClick={event => {
                      if (event.target instanceof Element && event.target.closest(".version-b-video-controls")) return;
                      toggleVideoPlayback();
                    }}><video key={story.id} ref={preview ? undefined : videoRef} src={preview ? `${cardItem.videoSrc}#t=0.001` : cardItem.videoSrc} autoPlay={!preview && phase === "idle"} muted={preview || isMuted} playsInline loop preload="auto" aria-label={`${story.companyName} founder video`}>Your browser does not support HTML video.</video>
                      <div className="version-b-video-controls" onClick={event => event.stopPropagation()}>
                        <button type="button" className="version-b-video-play-toggle" aria-label={isPlaying ? "Pause video" : "Play video"} onClick={toggleVideoPlayback}>
                          {!preview && isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                        </button>
                        <input className="version-b-video-seek" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} aria-label="Video progress" disabled={!duration} onChange={seekVideo} />
                        <span className="version-b-video-time">{formatTime(preview ? 0 : currentTime)} / {formatTime(duration)}</span>
                        <button type="button" className="version-b-video-mute-toggle" aria-label={isMuted ? "Unmute video" : "Mute video"} aria-pressed={!isMuted} onClick={toggleVideoMute}>
                          {isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                        </button>
                      </div>
                    </div>
                    <aside className="version-b-story-details" aria-label={`Details for ${story.companyName}`}>
                      <div className="version-b-story-company-row">
                        <p className="version-b-story-eyebrow">{story.companyName}</p>
                        {saved ? <span className="version-b-saved-status"><Check aria-hidden="true" /> Saved to watchlist</span> : null}
                      </div>
                      <h2 ref={preview ? undefined : cardHeading} tabIndex={-1}>{story.tagline}</h2>
                      <div className="version-b-story-identity">
                        <p className="version-b-placeholder-name">{story.founderName}</p>
                        <span className="version-b-placeholder-company"><span aria-hidden="true">· </span>Founder</span>
                      </div>
                      <CompanyInformationB key={`${story.id}-${informationRevision}`} story={story} preview={preview} />
                      <div className="version-b-card-action-footer">
                      <div className="version-b-story-investment-area">
                        <form className="version-b-story-investment-form" onSubmit={event => {
                          event.preventDefault();
                          setReview({ companyName: story.companyName, amount: Number(amounts[story.id]), campaignUrl: story.campaignUrl });
                          reviewDialog.current?.showModal();
                        }}>
                          <label className="version-b-story-investment-label" htmlFor={`investment-${preview ? "preview-" : ""}${story.id}`}>Invest<span>min $300</span></label>
                          <div className="version-b-story-amount-row">
                            <div className="version-b-story-amount-field">
                              <span aria-hidden="true">$</span>
                              <input id={`investment-${preview ? "preview-" : ""}${story.id}`} aria-label={`Investment amount for ${story.companyName} in dollars`} type="number" inputMode="decimal" min="300" step="0.01" required placeholder="Amount" value={amounts[story.id] ?? ""} onChange={event => setAmounts(previous => ({ ...previous, [story.id]: event.target.value }))} />
                            </div>
                            <button type="submit" className="version-b-story-investment-next" aria-label={`Review investment in ${story.companyName}`} title="Review your investment amount">Review <ArrowRight aria-hidden="true" /></button>
                          </div>
                        </form>
                      </div>
                      </div>
                    </aside>
                  </div>
    );
  }

  function renderFeedTabs() {
    return (<div className="version-b-feed-tabs" role="tablist" aria-label="Founder feeds">
          {([{ id: "weekly", label: "Your Weekly Round-up" }, { id: "discover", label: "Discover" }] as const).map((tab, index) => (
            <button key={tab.id} id={`version-b-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls="version-b-feed-panel" tabIndex={activeTab === tab.id ? 0 : -1} className="version-b-feed-tab" disabled={busy} onClick={() => changeFeed(tab.id)} onKeyDown={event => {
              if (event.altKey || event.ctrlKey || event.metaKey) return;
              let next: number;
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = (index + 1) % 2;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = 1;
              else return;
              event.preventDefault();
              changeFeed(next === 0 ? "weekly" : "discover");
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
            }}>{tab.label}</button>
          ))}
        </div>
    );
  }

  return (
    <main ref={page} className={`version-b-placeholder-page${expanded ? " version-b-is-expanded" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? "Full-screen founder stories" : undefined} onKeyDown={event => {
      if (event.defaultPrevented || (event.target instanceof Element && event.target.closest('[data-slot="drawer-content"]'))) return;
      if (reviewDialog.current?.open || (event.target instanceof Element && event.target.closest("dialog"))) return;
      if (!expanded) return;
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        closeExpanded();
      }
      if (event.key === "Tab") {
        const controls = Array.from(page.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]') ?? []).filter(node => !node.closest('[aria-hidden="true"]') && node.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      {expanded ? <div className="version-b-expanded-toolbar">
        <WatchlistDrawerB className="version-b-expanded-control version-b-expanded-watchlist"><Bookmark aria-hidden="true" /> Watchlist</WatchlistDrawerB>
        {renderFeedTabs()}
        <button ref={closeButton} type="button" className="version-b-expanded-control" onClick={closeExpanded} aria-label="Close full-screen view" disabled={busy}><X aria-hidden="true" /> Close</button>
      </div> : null}
      <h1 className="sr-only">Discover founder stories</h1>
      <div ref={fitStage} className="version-b-fit-stage" style={expanded ? { width: expandedBase.width, left: screenFit.left, top: screenFit.top, transform: `scale(${screenFit.scale})`, "--expanded-card-min-height": `${expandedBase.minHeight}px` } as CSSProperties : undefined}>
      <div className="version-b-placeholder-layout">
        {!expanded ? renderFeedTabs() : null}
        <div key="feed-panel" id="version-b-feed-panel" role="tabpanel" aria-labelledby={`version-b-tab-${activeTab}`}>
        <section className="version-b-story-stack" aria-label="Founder card stack" aria-busy={busy}>
          {complete ? <div className="version-b-stack-complete">
            <span className="version-b-complete-icon" aria-hidden="true"><Check /></span>
            <h2 ref={completionHeading} tabIndex={-1}>You’re all caught up</h2>
            <p>{activeTab === "weekly" ? "You’ve explored this week’s founders. Keep exploring in Discover, or revisit your watchlist." : "You’ve explored the available founders. Revisit the companies you saved to your watchlist."}</p>
            <div className="version-b-complete-actions">
              {activeTab === "weekly" ? <button type="button" className="version-b-decision-save" onClick={openDiscover}>Go to Discover <ArrowRight aria-hidden="true" /></button> : null}
              <Link className="version-b-decision-pass" href="/saved">View watchlist</Link>
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
          {decisionFeedback ? <div className="version-b-below-card-feedback">{decisionFeedback}</div> : null}
          <p className="sr-only" role="status" aria-live="polite">{busy ? "" : complete ? "You’re all caught up." : `${story.companyName} selected.`}</p>
        </section>
        </div>

      </div>
      </div>
      <dialog ref={reviewDialog} className="version-b-investment-review" aria-labelledby="investment-review-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="version-b-investment-review-close" aria-label="Close investment review" onClick={() => reviewDialog.current?.close()}><X aria-hidden="true" /></button>
        <p className="version-b-story-eyebrow">{review?.companyName}</p>
        <h2 id="investment-review-title">Review investment</h2>
        <p className="version-b-investment-review-amount">{review ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(review.amount) : ""}</p>
        <p className="version-b-investment-review-note">{review?.campaignUrl ? "Continue to the campaign page to review terms and complete your investment." : "Investment link coming soon. No investment has been made."}</p>
        {review?.campaignUrl ? <a className="version-b-story-action" href={review.campaignUrl} target="_blank" rel="noopener noreferrer">View campaign <ArrowRight aria-hidden="true" /></a> : null}
        <button type="button" className="version-b-investment-review-back" onClick={() => reviewDialog.current?.close()}>Back to edit amount</button>
      </dialog>
    </main>
  );
}
