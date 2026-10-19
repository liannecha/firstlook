"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Maximize2, Pause, Play, UserRound, Volume2, VolumeX, X } from "lucide-react";
import { founderStories } from "./founders";
import { useWatchlist } from "./watchlist";

const items = founderStories.map((story, index) => ({
  id: String(index + 1).padStart(2, "0"),
  story,
  videoSrc: "/IMG_7857.MOV",
}));
// The outer copies let native touch/trackpad scrolling cross either boundary.
const slides = [...items, ...items, ...items];
const wrap = (index: number) => ((index % items.length) + items.length) % items.length;

function pauseVideoAtStart(video: HTMLVideoElement) {
  video.pause();
  video.currentTime = 0;
}

export default function PlaceholderCarousel() {
  const [expanded, setExpanded] = useState(false);
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

  function closeExpanded() {
    pendingSelection.current = selectedRef.current;
    setExpanded(false);
    requestAnimationFrame(() => {
      const activeTrigger = page.current?.querySelector<HTMLButtonElement>(".is-current .story-expand");
      (activeTrigger ?? expandTrigger.current)?.focus({ preventScroll: true });
    });
  }

  function goTo(slot: number) {
    const node = viewport.current;
    if (!node || !stride.current) return;
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
    <main ref={page} className={`placeholder-page${expanded ? " is-expanded" : ""}`} role={expanded ? "dialog" : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? "Full-screen founder stories" : undefined} onKeyDown={event => {
      if (!expanded || (event.target instanceof Element && event.target.closest("dialog"))) return;
      if (event.key === "Escape") {
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
      {expanded ? <div className="expanded-toolbar">
        <button ref={closeButton} type="button" className="expanded-control" onClick={closeExpanded} aria-label="Close full-screen view"><X aria-hidden="true" /> Close</button>
      </div> : null}
      <h1 className="sr-only">Discover founder stories</h1>
      <div className="placeholder-layout">
        <section className="story-carousel" aria-label="Founder story placeholders" aria-roledescription="carousel" onKeyDown={event => {
          if (event.target instanceof Element && event.target.closest("video,button,a,input")) return;
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}>
          <div className="carousel-window">
            <div ref={viewport} className="carousel-scroll" tabIndex={0} aria-label="Swipe left or right to browse videos" onPointerDown={event => {
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
                event.currentTarget.classList.add("is-dragging");
              }
              if (drag.moved) event.currentTarget.scrollLeft = drag.scroll - delta;
            }} onPointerUp={event => {
              const drag = dragging.current;
              if (!drag) return;
              dragging.current = null;
              suppressClick.current = drag.moved;
              event.currentTarget.classList.remove("is-dragging");
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              if (drag.moved) {
                const delta = drag.x - event.clientX;
                const start = Math.round((drag.scroll - firstOffset.current) / stride.current);
                goTo(Math.abs(delta) > 40 ? start + Math.sign(delta) : start);
              }
            }} onPointerCancel={event => {
              dragging.current = null;
              event.currentTarget.classList.remove("is-dragging");
              goTo(Math.round((event.currentTarget.scrollLeft - firstOffset.current) / stride.current));
            }} onClickCapture={event => {
              if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
            }}>
              {slides.map((item, slot) => {
                const distance = slot - centerSlot;
                const active = distance === 0;
                const story = item.story;
                const saved = savedIds.includes(story.id);
                return <div key={slot} className={`carousel-slide ${active ? "is-current" : ""}`} role="group" aria-roledescription="slide" aria-label={`${story.companyName} story`} aria-hidden={Math.abs(distance) > 1 ? true : undefined} onClick={event => {
                  if (event.target instanceof Element && event.target.closest("video,button,a,input")) return;
                  goTo(slot);
                }}>
                  <div className="slide-pair">
                    {!expanded ? <button type="button" className="story-expand" aria-label={`Expand ${story.companyName} story`} title="Expand story" onClick={event => {
                      event.stopPropagation();
                      expandTrigger.current = event.currentTarget;
                      pendingSelection.current = wrap(slot);
                      selectedRef.current = wrap(slot);
                      setSelected(wrap(slot));
                      setExpanded(true);
                    }}><Maximize2 aria-hidden="true" /></button> : null}
                    <div className="slide-box" onClick={event => {
                      if (event.target instanceof Element && event.target.closest(".video-controls")) return;
                      if (active) toggleVideoPlayback();
                      else goTo(slot);
                    }}>{Math.abs(distance) <= 1 ? <video ref={video => {
                      if (video) videoRefs.current.set(slot, video);
                      else videoRefs.current.delete(slot);
                    }} src={item.videoSrc} autoPlay={active} muted playsInline loop preload="auto" aria-label={`${story.companyName} founder video`}>Your browser does not support HTML video.</video> : null}
                      {active ? <div className="video-controls" onClick={event => event.stopPropagation()}>
                        <button type="button" className="video-play-toggle" aria-label={isPlaying ? "Pause video" : "Play video"} onClick={toggleVideoPlayback}>
                          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                        </button>
                        <input className="video-seek" type="range" min="0" max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} aria-label="Video progress" disabled={!duration} onChange={seekVideo} />
                        <span className="video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        <button type="button" className="video-mute-toggle" aria-label={isMuted ? "Unmute video" : "Mute video"} aria-pressed={!isMuted} onClick={toggleVideoMute}>
                          {isMuted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
                        </button>
                      </div> : null}
                    </div>
                    <aside className="story-details" aria-label={`Details for ${story.companyName}`}>
                      <div className="story-company-row">
                        <p className="story-eyebrow">{story.companyName}</p>
                      </div>
                      <h2>{story.tagline}</h2>
                      <div className="story-identity">
                        <span className="story-avatar" aria-hidden="true"><UserRound /></span>
                        <div className="story-founder"><p className="placeholder-name">{story.founderName}</p><p className="placeholder-company">Founder</p></div>
                        <button
                          type="button"
                          className="story-follow"
                          disabled={!ready}
                          aria-pressed={saved}
                          aria-label={`${saved ? "Unfollow" : "Follow"} ${story.companyName}`}
                          onClick={() => toggle(story.id)}
                        ><Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} /><span>{saved ? "Following" : "Follow"}</span></button>
                      </div>
                      <ul className="story-founder-notes" aria-label="Founder notes (placeholder text)">
                        <li title="Why I’m building this — placeholder">Why I’m building this</li>
                        <li title="Why I can build it — placeholder">Why I can build it</li>
                      </ul>
                      <a className="story-learn-more" href={story.website} target="_blank" rel="noopener noreferrer">Learn more <ArrowRight aria-hidden="true" /></a>
                      <div className="story-investment-area">
                        <form className="story-investment-form" onSubmit={event => {
                          event.preventDefault();
                          setReview({ companyName: story.companyName, amount: Number(amounts[story.id]), campaignUrl: story.campaignUrl });
                          reviewDialog.current?.showModal();
                        }}>
                          <label className="story-investment-label" htmlFor={`investment-${slot}`}>Invest<span>min $300</span></label>
                          <div className="story-amount-row">
                            <div className="story-amount-field">
                              <span aria-hidden="true">$</span>
                              <input id={`investment-${slot}`} aria-label={`Investment amount for ${story.companyName} in dollars`} type="number" inputMode="decimal" min="300" step="0.01" required placeholder="0" value={amounts[story.id] ?? ""} onChange={event => setAmounts(previous => ({ ...previous, [story.id]: event.target.value }))} />
                            </div>
                            <button type="submit" className="story-investment-next" aria-label={`Review investment in ${story.companyName}`} title="Continue to review"><ArrowRight aria-hidden="true" /></button>
                          </div>
                        </form>
                      </div>
                    </aside>
                  </div>
                </div>;
              })}
            </div>
            <button type="button" className="carousel-arrow carousel-previous" aria-label="Previous video" onClick={() => move(-1)}><ChevronLeft aria-hidden="true" /></button>
            <button type="button" className="carousel-arrow carousel-next" aria-label="Next video" onClick={() => move(1)}><ChevronRight aria-hidden="true" /></button>
          </div>
          <p className="sr-only" role="status" aria-live="polite">Story {number} selected, {selected + 1} of {items.length}.</p>
        </section>

      </div>
      <dialog ref={reviewDialog} className="investment-review" aria-labelledby="investment-review-title" onClick={event => event.stopPropagation()}>
        <button type="button" className="investment-review-close" aria-label="Close investment review" onClick={() => reviewDialog.current?.close()}><X aria-hidden="true" /></button>
        <p className="story-eyebrow">{review?.companyName}</p>
        <h2 id="investment-review-title">Review investment</h2>
        <p className="investment-review-amount">{review ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(review.amount) : ""}</p>
        <p className="investment-review-note">{review?.campaignUrl ? "Continue to the campaign page to review terms and complete your investment." : "Investment link coming soon. No investment has been made."}</p>
        {review?.campaignUrl ? <a className="story-action" href={review.campaignUrl} target="_blank" rel="noopener noreferrer">View campaign <ArrowRight aria-hidden="true" /></a> : null}
        <button type="button" className="investment-review-back" onClick={() => reviewDialog.current?.close()}>Back to edit amount</button>
      </dialog>
    </main>
  );
}
