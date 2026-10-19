"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Maximize2, Pause, Play, UserRound, Volume2, VolumeX, X } from "lucide-react";
import { founderStories } from "../../founders";
import { founderVideoSources } from "../founder-videos";
import { companyDetailSections } from "../company-details";
import CompanyDetailContent from "../company-detail-content";
import { useWatchlist } from "../../watchlist";

import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";

import "./carousel-a.css";

// Saved Version A: layout and styles are isolated; founder data and watchlist remain shared.
const items = founderStories.map((story, index) => ({
  id: String(index + 1).padStart(2, "0"),
  story,
  videoSrc: founderVideoSources[story.id],
}));
// The outer copies let native touch/trackpad scrolling cross either boundary.
const slides = [...items, ...items, ...items];
const wrap = (index: number) => ((index % items.length) + items.length) % items.length;

function pauseVideoAtStart(video: HTMLVideoElement) {
  video.pause();
  video.currentTime = 0;
}

export default function CarouselA() {
  const [expanded, setExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsPosition, setDetailsPosition] = useState({ left: 0, top: 0, width: 400, height: 600, sheet: false });
  const detailsPanel = useRef<HTMLDivElement>(null);
  const detailsTitle = useRef<HTMLHeadingElement>(null);
  const detailsTrigger = useRef<HTMLButtonElement>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [review, setReview] = useState<{ companyName: string; amount: number; campaignUrl?: string } | null>(null);
  const reviewDialog = useRef<HTMLDialogElement>(null);
  const page = useRef<HTMLElement>(null);
  const expandTrigger = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState(1);
  const [centerSlot, setCenterSlot] = useState(items.length + 1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { savedIds, ready, toggle } = useWatchlist();
  const viewport = useRef<HTMLDivElement>(null);
  const videoRefs = useRef(new Map<number, HTMLVideoElement>());
  const selectedRef = useRef(1);
  const pendingSelection = useRef<number | null>(null);
  const targetSlot = useRef(items.length + 1);
  const stride = useRef(0);
  const firstOffset = useRef(0);
  const dragging = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const number = items[selected].id;

  useEffect(() => {
    const video = videoRefs.current.get(centerSlot);
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
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateTime);
      video.removeEventListener("play", updatePlayback);
      video.removeEventListener("pause", updatePlayback);
      video.removeEventListener("volumechange", updateMuted);
    };
  }, [centerSlot]);

  useEffect(() => {
    for (const [slot, video] of videoRefs.current) {
      if (slot === centerSlot) {
        video.play().catch(error => console.error("Unable to autoplay the centered story video:", error));
      } else {
        pauseVideoAtStart(video);
      }
    }
  }, [centerSlot]);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    function measure() {
      const first = node!.children[0] as HTMLElement;
      const second = node!.children[1] as HTMLElement;
      stride.current = second.offsetLeft - first.offsetLeft;
      firstOffset.current = first.offsetLeft;
      const item = pendingSelection.current ?? selectedRef.current;
      pendingSelection.current = null;
      if (item !== selectedRef.current) setDetailsOpen(false);
      selectedRef.current = item;
      setSelected(item);
      targetSlot.current = items.length + item;
      node!.scrollTo({ left: firstOffset.current + targetSlot.current * stride.current, behavior: "instant" });
      setCenterSlot(targetSlot.current);
    }
    function settle() {
      if (dragging.current || !stride.current) return;
      const nearest = Math.round((node!.scrollLeft - firstOffset.current) / stride.current);
      const middle = items.length + wrap(nearest);
      targetSlot.current = middle;
      if (nearest !== middle && node!.contains(document.activeElement)) node!.focus({ preventScroll: true });
      // Recenter onto the identical middle copy without a visible transition.
      node!.scrollTo({ left: firstOffset.current + middle * stride.current, behavior: "instant" });
      setCenterSlot(middle);
    }
    function onScroll() {
      if (!stride.current || pendingSelection.current !== null) return;
      const slot = Math.round((node!.scrollLeft - firstOffset.current) / stride.current);
      const item = wrap(slot);
      if (item !== selectedRef.current) setDetailsOpen(false);
      selectedRef.current = item;
      setSelected(item);
      setCenterSlot(slot);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 180);
    }
    node.addEventListener("scroll", onScroll, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    const frame = requestAnimationFrame(measure);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); node.removeEventListener("scroll", onScroll); clearTimeout(settleTimer); };
  }, []);

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

  function measureDetails() {
    const card = page.current?.querySelector<HTMLElement>(".version-a-is-current .version-a-slide-pair");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const available = window.innerWidth - rect.right - 24;
    const sheet = window.innerWidth < 600 || available < 240;
    const top = sheet ? 0 : Math.max(12, rect.top);
    const next = { sheet, left: sheet ? Math.max(0, window.innerWidth - (window.innerWidth < 600 ? window.innerWidth : 440)) : rect.right + 12, top, width: sheet ? Math.min(window.innerWidth, window.innerWidth < 600 ? window.innerWidth : 440) : Math.min(400, available), height: sheet ? window.innerHeight : Math.max(120, Math.min(rect.height, window.innerHeight - top - 12)) };
    setDetailsPosition(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
  }

  function openDetails(trigger: HTMLButtonElement) {
    detailsTrigger.current = trigger;
    measureDetails();
    setDetailsOpen(true);
  }

  useEffect(() => {
    if (!detailsOpen) return;
    let frame = 0;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measureDetails); };
    const observer = new ResizeObserver(schedule);
    const card = page.current?.querySelector(".version-a-is-current .version-a-slide-pair");
    if (card) observer.observe(card);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    schedule();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true); };
  }, [detailsOpen, expanded]);

  function closeExpanded() {
    pendingSelection.current = selectedRef.current;
    setExpanded(false);
    requestAnimationFrame(() => {
      const activeTrigger = page.current?.querySelector<HTMLButtonElement>(".version-a-is-current .version-a-story-expand");
      (activeTrigger ?? expandTrigger.current)?.focus({ preventScroll: true });
    });
  }

  function goTo(slot: number) {
    const node = viewport.current;
    if (!node || !stride.current) return;
    setDetailsOpen(false);
    const bounded = Math.max(0, Math.min(slides.length - 1, slot));
    targetSlot.current = bounded;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({ left: firstOffset.current + bounded * stride.current, behavior: reduced ? "instant" : "smooth" });
  }

  function move(direction: number) { goTo(targetSlot.current + direction); }
  function toggleVideoPlayback() {
    const video = videoRefs.current.get(centerSlot);
    if (!video) return;
    if (video.paused) {
      video.play().catch(error => console.error("Unable to play the centered story video:", error));
    } else {
      video.pause();
    }
  }
  function toggleVideoMute() {
    const video = videoRefs.current.get(centerSlot);
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }
  function seekVideo(event: React.ChangeEvent<HTMLInputElement>) {
    const video = videoRefs.current.get(centerSlot);
    if (!video) return;
    const nextTime = Number(event.currentTarget.value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }
  function formatTime(seconds: number) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  }

  return (
    <main ref={page} className={`version-a-placeholder-page${expanded ? " version-a-is-expanded" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? "Full-screen founder stories" : undefined} onKeyDown={event => {
      if (detailsOpen && detailsPosition.sheet && event.target instanceof Element && event.target.closest(".version-a-company-details")) return;
      if (event.defaultPrevented || reviewDialog.current?.open || (event.target instanceof Element && event.target.closest("dialog"))) return;
      if (event.key === "Escape" && detailsOpen) { event.preventDefault(); event.stopPropagation(); setDetailsOpen(false); return; }
      if (!expanded) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeExpanded();
      }
      if (event.key === "Tab") {
        const controls = [...Array.from(page.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]') ?? []), ...Array.from(detailsPanel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), summary, a[href]') ?? [])].filter(node => !node.closest('[aria-hidden="true"]') && node.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
      {expanded ? <div className="version-a-expanded-toolbar">
        <button ref={closeButton} type="button" className="version-a-expanded-control" onClick={closeExpanded} aria-label="Close full-screen view"><X aria-hidden="true" /> Close</button>
      </div> : null}
      <h1 className="sr-only">Discover founder stories</h1>
      <div className="version-a-placeholder-layout">
        <section className="version-a-story-carousel" aria-label="Founder story placeholders" aria-roledescription="carousel" onKeyDown={event => {
          if (event.target instanceof Element && event.target.closest("video,button,a,input")) return;
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}>
          <div className="version-a-carousel-window">
            <div ref={viewport} className="version-a-carousel-scroll" tabIndex={0} aria-label="Swipe left or right to browse videos" onPointerDown={event => {
              if (event.pointerType !== "mouse" || event.button !== 0) return;
              if (event.target instanceof Element && event.target.closest("video,button,a,input")) return;
              event.preventDefault();
              dragging.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
              suppressClick.current = false;
            }} onPointerMove={event => {
              const drag = dragging.current;
              if (!drag) return;
              const delta = event.clientX - drag.x;
              if (Math.abs(delta) > 5 && !drag.moved) {
                drag.moved = true;
                event.currentTarget.setPointerCapture(event.pointerId);
                event.currentTarget.classList.add("version-a-is-dragging");
              }
              if (drag.moved) event.currentTarget.scrollLeft = drag.scroll - delta;
            }} onPointerUp={event => {
              const drag = dragging.current;
              if (!drag) return;
              dragging.current = null;
              suppressClick.current = drag.moved;
              event.currentTarget.classList.remove("version-a-is-dragging");
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              if (drag.moved) {
                const delta = drag.x - event.clientX;
                const start = Math.round((drag.scroll - firstOffset.current) / stride.current);
                goTo(Math.abs(delta) > 40 ? start + Math.sign(delta) : start);
              }
            }} onPointerCancel={event => {
              dragging.current = null;
              event.currentTarget.classList.remove("version-a-is-dragging");
              goTo(Math.round((event.currentTarget.scrollLeft - firstOffset.current) / stride.current));
            }} onClickCapture={event => {
              if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
            }}>
              {slides.map((item, slot) => {
                const distance = slot - centerSlot;
                const active = distance === 0;
                const story = item.story;
                const saved = savedIds.includes(story.id);
                return <div key={slot} className={`version-a-carousel-slide ${active ? "version-a-is-current" : ""}`} role="group" aria-roledescription="slide" aria-label={`${story.companyName} story`} aria-hidden={Math.abs(distance) > 1 ? true : undefined} onClick={event => {
                  if (event.target instanceof Element && event.target.closest("video,button,a,input")) return;
                  goTo(slot);
                }}>
                  <div className="version-a-slide-pair">
                    {!expanded ? <button type="button" className="version-a-story-expand" aria-label={`Expand ${story.companyName} story`} title="Expand story" onClick={event => {
                      event.stopPropagation();
                      expandTrigger.current = event.currentTarget;
                      pendingSelection.current = wrap(slot);
                      selectedRef.current = wrap(slot);
                      setSelected(wrap(slot));
                      setExpanded(true);
                    }}><Maximize2 aria-hidden="true" /></button> : null}
                    <div className="version-a-slide-box" onClick={event => {
                      if (event.target instanceof Element && event.target.closest(".version-a-video-controls")) return;
                      if (active) toggleVideoPlayback();
                      else goTo(slot);
                    }}>{Math.abs(distance) <= 1 ? <video ref={video => {
                      if (video) videoRefs.current.set(slot, video);
                      else videoRefs.current.delete(slot);
                    }} src={item.videoSrc} autoPlay={active} muted playsInline loop preload="auto" aria-label={`${story.companyName} founder video`}>Your browser does not support HTML video.</video> : null}
                      {active ? <div className="version-a-video-controls" onClick={event => event.stopPropagation()}>
                        <button type="button" className="version-a-video-play-toggle" aria-label={isPlaying ? "Pause video" : "Play video"} onClick={toggleVideoPlayback}>
                          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                        </button>
                        <input className="version-a-video-seek" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} aria-label="Video progress" disabled={!duration} onChange={seekVideo} />
                        <span className="version-a-video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        <button type="button" className="version-a-video-mute-toggle" aria-label={isMuted ? "Unmute video" : "Mute video"} aria-pressed={!isMuted} onClick={toggleVideoMute}>
                          {isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                        </button>
                      </div> : null}
                    </div>
                    <aside className="version-a-story-details" aria-label={`Details for ${story.companyName}`}>
                      <div className="version-a-story-company-row">
                        <p className="version-a-story-eyebrow">{story.companyName}</p>
                      </div>
                      <h2>{story.tagline}</h2>
                      <div className="version-a-story-identity">
                        <span className="version-a-story-avatar" aria-hidden="true"><UserRound /></span>
                        <div className="version-a-story-founder">
                          <p className="version-a-placeholder-name">{story.founderName}</p>
                          <div className="version-a-founder-role-row">
                            <p className="version-a-placeholder-company">Founder</p>
                            <span className="version-a-follow-separator" aria-hidden="true">·</span>
                        <button
                          type="button"
                          className="version-a-story-follow"
                          disabled={!ready}
                          aria-pressed={saved}
                          aria-label={`${saved ? "Unfollow" : "Follow"} ${story.companyName}`}
                          onClick={() => toggle(story.id)}
                        >{saved ? "Following" : "Follow"}</button>
                          </div>
                        </div>
                      </div>
                      <ul className={`version-a-story-founder-notes${story.cardFacts ? " version-a-has-facts" : ""}`} aria-label={story.cardFacts ? "Company highlights" : "Founder notes (placeholder text)"}>
                        {story.cardFacts ? story.cardFacts.map(fact => <li key={fact.label}><strong>{fact.label}:</strong> {fact.text}</li>) : <>
                          <li title="Why I’m building this — placeholder">Why I’m building this</li>
                          <li title="Why I can build it — placeholder">Why I can build it</li>
                        </>}
                      </ul>
                      <button type="button" className="version-a-story-learn-more" aria-expanded={active && detailsOpen} aria-controls="version-a-company-details" onClick={event => { if (active) openDetails(event.currentTarget); else goTo(slot); }}>Company details <ArrowRight aria-hidden="true" /></button>
                      <div className="version-a-story-investment-area">
                        <form className="version-a-story-investment-form" onSubmit={event => {
                          event.preventDefault();
                          setReview({ companyName: story.companyName, amount: Number(amounts[story.id]), campaignUrl: story.campaignUrl });
                          reviewDialog.current?.showModal();
                        }}>
                          <label className="version-a-story-investment-label" htmlFor={`investment-${slot}`}>Invest<span>min $300</span></label>
                          <div className="version-a-story-amount-row">
                            <div className="version-a-story-amount-field">
                              <span aria-hidden="true">$</span>
                              <input id={`investment-${slot}`} aria-label={`Investment amount for ${story.companyName} in dollars`} type="number" inputMode="decimal" min="300" step="0.01" required placeholder="0" value={amounts[story.id] ?? ""} onChange={event => setAmounts(previous => ({ ...previous, [story.id]: event.target.value }))} />
                            </div>
                            <button type="submit" className="version-a-story-investment-next" aria-label={`Review investment in ${story.companyName}`} title="Continue to review"><ArrowRight aria-hidden="true" /></button>
                          </div>
                        </form>
                      </div>
                    </aside>
                  </div>
                </div>;
              })}
            </div>
            <button type="button" className="version-a-carousel-arrow version-a-carousel-previous" aria-label="Previous video" onClick={() => move(-1)}><ChevronLeft aria-hidden="true" /></button>
            <button type="button" className="version-a-carousel-arrow version-a-carousel-next" aria-label="Next video" onClick={() => move(1)}><ChevronRight aria-hidden="true" /></button>
          </div>
          <p className="sr-only" role="status" aria-live="polite">Story {number} selected, {selected + 1} of {items.length}.</p>
        </section>

      </div>
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen} modal={detailsPosition.sheet}>
        <SheetContent ref={detailsPanel} id="version-a-company-details" side="right" showCloseButton={false} className={`version-a-company-details${detailsPosition.sheet ? " version-a-details-sheet" : ""}`} style={{ left: detailsPosition.left, top: detailsPosition.top, width: detailsPosition.width, height: detailsPosition.height }}
          onOpenAutoFocus={event => { event.preventDefault(); detailsTitle.current?.focus({ preventScroll: true }); }}
          onCloseAutoFocus={event => { event.preventDefault(); if (!reviewDialog.current?.open) { const trigger = page.current?.querySelector<HTMLButtonElement>(".version-a-is-current .version-a-story-learn-more") ?? detailsTrigger.current; trigger?.focus({ preventScroll: true }); } }}
          onEscapeKeyDown={event => { if (reviewDialog.current?.open) event.preventDefault(); }}
          onInteractOutside={event => { const original = event.detail.originalEvent; if (original.type === "focusin" || reviewDialog.current?.open) event.preventDefault(); }}>
          <div className="version-a-details-header">
            <p className="version-a-story-eyebrow">{items[selected].story.companyName}</p>
            <SheetTitle ref={detailsTitle} tabIndex={-1}>Company details</SheetTitle>
            <SheetDescription>Explore the product, progress, team, and funding.</SheetDescription>
            <SheetClose asChild><button className="version-a-details-close" type="button" aria-label="Close company details"><X aria-hidden="true" /></button></SheetClose>
          </div>
          <div className="version-a-details-body">
            {companyDetailSections(items[selected].story.id).map((section, index) => <details key={`${items[selected].story.id}-${section.title}`} className="version-a-details-section" open={index === 0}><summary>{section.title}<ChevronDown aria-hidden="true" /></summary><CompanyDetailContent section={section} /></details>)}
          </div>
        </SheetContent>
      </Sheet>
      <dialog ref={reviewDialog} className="version-a-investment-review" aria-labelledby="investment-review-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="version-a-investment-review-close" aria-label="Close investment review" onClick={() => reviewDialog.current?.close()}><X aria-hidden="true" /></button>
        <p className="version-a-story-eyebrow">{review?.companyName}</p>
        <h2 id="investment-review-title">Review investment</h2>
        <p className="version-a-investment-review-amount">{review ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(review.amount) : ""}</p>
        <p className="version-a-investment-review-note">{review?.campaignUrl ? "Continue to the campaign page to review terms and complete your investment." : "Investment link coming soon. No investment has been made."}</p>
        {review?.campaignUrl ? <a className="version-a-story-action" href={review.campaignUrl} target="_blank" rel="noopener noreferrer">View campaign <ArrowRight aria-hidden="true" /></a> : null}
        <button type="button" className="version-a-investment-review-back" onClick={() => reviewDialog.current?.close()}>Back to edit amount</button>
      </dialog>
    </main>
  );
}
