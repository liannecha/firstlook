"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Bookmark, ChevronLeft, ChevronRight, Pause, Play, UserRound, Volume2, VolumeX } from "lucide-react";
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
      targetSlot.current = items.length + selectedRef.current;
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
      if (!stride.current) return;
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
    <main className="placeholder-page">
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
                        <button
                          type="button"
                          className="story-bookmark"
                          disabled={!ready}
                          aria-pressed={saved}
                          aria-label={`${saved ? "Remove" : "Save"} ${story.companyName} ${saved ? "from" : "to"} watchlist`}
                          title={saved ? "Remove from watchlist" : "Save to watchlist"}
                          onClick={() => toggle(story.id)}
                        ><Bookmark aria-hidden="true" fill={saved ? "currentColor" : "none"} /></button>
                      </div>
                      <h2>{story.tagline}</h2>
                      <div className="story-identity">
                        <span className="story-avatar" aria-hidden="true"><UserRound /></span>
                        <div><button type="button" className="placeholder-name founder-name-button">{story.founderName}</button><p className="placeholder-company">Founder</p></div>
                      </div>
                      <p className="story-description">{story.description}</p>
                      <div className="story-action-area"><a className="story-action" href={story.website} target="_blank" rel="noopener noreferrer">Learn more <ArrowRight aria-hidden="true" /></a></div>
                    </aside>
                  </div>
                </div>;
              })}
            </div>
            <button type="button" className="carousel-arrow carousel-previous" aria-label="Previous video" onClick={() => move(-1)}><ChevronLeft aria-hidden="true" /></button>
            <button type="button" className="carousel-arrow carousel-next" aria-label="Next video" onClick={() => move(1)}><ChevronRight aria-hidden="true" /></button>
          </div>
          <div className="carousel-dots" role="group" aria-label="Choose a story">
            {items.map((item, index) => <button type="button" key={item.id} aria-label={`Select video ${item.id}`} aria-pressed={selected === index} onClick={() => {
              const current = Math.round(((viewport.current?.scrollLeft ?? 0) - firstOffset.current) / stride.current);
              const difference = index - wrap(current);
              goTo(current + (difference > 2 ? difference - items.length : difference < -2 ? difference + items.length : difference));
            }}><span /></button>)}
          </div>
          <p className="sr-only" role="status" aria-live="polite">Story {number} selected, {selected + 1} of {items.length}.</p>
        </section>

      </div>
    </main>
  );
}
