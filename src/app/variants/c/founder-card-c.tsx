"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { FounderStory } from "../../founders";
import CompanyInformationB from "./company-information-c";

const companyWebsites: Record<string, string> = {
  "seeair": "https://www.avol.co",
  "standard-h2": "https://prairiebiosciences.com",
  "decentral-ai": "https://aethl.com",
  "edulis-therapeutics": "https://lazaruseasgles.netlify.app",
};

export type CardItemB = { story: FounderStory; videoSrc: string };
type Props = {
  item: CardItemB;
  preview?: boolean;
  active?: boolean;
  suspended?: boolean;
  resumeAfterReview?: boolean;
  revision?: number;
  videoRef?: RefObject<HTMLVideoElement | null>;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  saved: boolean;
  decisionsDisabled: boolean;
  onInterested: () => void;
  onPass?: () => void;
  onInvest: () => void;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function FounderCardB({ item, preview = false, active = true, suspended = false, resumeAfterReview = true, revision = 0, videoRef, headingRef, saved, decisionsDisabled, onInterested, onPass, onInvest }: Props) {
  const ownVideo = useRef<HTMLVideoElement>(null);
  const mediaRef = videoRef ?? ownVideo;
  const previousSuspended = useRef(suspended);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { story } = item;

  useEffect(() => {
    const video = mediaRef.current;
    const wasSuspended = previousSuspended.current;
    previousSuspended.current = suspended;
    if (!video) return;
    if (preview || !active || suspended) video.pause();
    else if (!wasSuspended || resumeAfterReview) video.play().catch(error => {
      if (error.name !== "AbortError") console.error("Unable to play the founder video:", error);
    });
  }, [active, mediaRef, preview, resumeAfterReview, suspended]);

  function togglePlayback() {
    const video = mediaRef.current;
    if (!video || preview) return;
    if (video.paused) video.play().catch(error => console.error("Unable to play the founder video:", error));
    else video.pause();
  }

  return <div className="version-b-slide-pair">
    <div className="version-b-slide-box" onClick={event => {
      if (event.target instanceof Element && event.target.closest(".version-b-video-controls")) return;
      togglePlayback();
    }}>
      <video ref={mediaRef} src={item.videoSrc} muted={preview || muted} playsInline loop preload="auto" aria-label={`${story.companyName} founder video`} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onVolumeChange={event => setMuted(event.currentTarget.muted)}>Your browser does not support HTML video.</video>
      <div className="version-b-video-controls" onClick={event => event.stopPropagation()}>
        <button type="button" className="version-b-video-play-toggle" aria-label={playing && !preview ? "Pause video" : "Play video"} onClick={togglePlayback}>{playing && !preview ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button>
        <input className="version-b-video-seek" type="range" min="0" max={duration || 1} step="0.1" value={preview ? 0 : Math.min(time, duration || 1)} aria-label="Video progress" disabled={!duration || preview} onChange={event => { if (mediaRef.current) { mediaRef.current.currentTime = Number(event.currentTarget.value); setTime(Number(event.currentTarget.value)); } }} />
        <span className="version-b-video-time">{formatTime(preview ? 0 : time)} / {formatTime(duration)}</span>
        <button type="button" className="version-b-video-mute-toggle" aria-label={muted ? "Unmute video" : "Mute video"} aria-pressed={!muted} onClick={() => setMuted(previous => !previous)}>{muted ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}</button>
      </div>
    </div>
    <aside className="version-b-story-details" aria-label={`Details for ${story.companyName}`}>
      <div className="version-b-story-company-row"><p className="version-b-story-eyebrow">{story.companyName}</p></div>
      <h2 ref={headingRef} tabIndex={-1}>{story.tagline}</h2>
      <div className="version-b-story-identity"><p className="version-b-placeholder-name">{story.founderName}</p><span className="version-b-placeholder-company"><span aria-hidden="true">· </span>Founder</span></div>
      <div className="version-c-company-links" aria-label="Company website and social media">
        <a href={companyWebsites[story.id]} target="_blank" rel="noopener noreferrer" tabIndex={preview ? -1 : undefined} aria-label={`${story.companyName} website (opens in a new tab)`}>{companyWebsites[story.id]?.replace(/^https?:\/\/(www\.)?/, "")}<ArrowUpRight aria-hidden="true" /></a>
        <button type="button" className="version-c-social-placeholder" aria-label="X — coming soon" aria-disabled="true" title="X — coming soon" tabIndex={preview ? -1 : 0}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.3-8.5L1 2h6.5l4.9 6.9L18.9 2Zm-1.1 18h1.7L6.5 3.9H4.7L17.8 20Z" /></svg></button>
        <button type="button" className="version-c-social-placeholder" aria-label="LinkedIn — coming soon" aria-disabled="true" title="LinkedIn — coming soon" tabIndex={preview ? -1 : 0}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM8 19H5V9h3v10ZM6.5 7.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4ZM19 19h-3v-5c0-1.3-.5-2-1.5-2S13 12.7 13 14v5h-3V9h3v1.4c.6-1 1.5-1.6 2.8-1.6 2.2 0 3.2 1.4 3.2 4V19Z" /></svg></button>
        <button type="button" className="version-c-social-placeholder" aria-label="YouTube — coming soon" aria-disabled="true" title="YouTube — coming soon" tabIndex={preview ? -1 : 0}><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 7s-.2-1.7-.9-2.4c-.9-.9-1.9-.9-2.4-1C16.4 3.4 12 3.4 12 3.4s-4.4 0-7.7.2c-.5.1-1.5.1-2.4 1C1.2 5.3 1 7 1 7s-.2 2-.2 4v2c0 2 .2 4 .2 4s.2 1.7.9 2.4c.9.9 2 .9 2.6 1 1.9.2 7.5.2 7.5.2s4.4 0 7.7-.3c.5 0 1.5 0 2.4-.9.7-.7.9-2.4.9-2.4s.2-2 .2-4v-2c0-2-.2-4-.2-4ZM9.8 16V8l7 4-7 4Z" /></svg></button>
      </div>
      <CompanyInformationB key={`${story.id}-${revision}`} story={story} preview={preview} saved={saved} decisionsDisabled={decisionsDisabled} onInterested={onInterested} onPass={onPass} onInvest={onInvest} />
    </aside>
  </div>;
}
