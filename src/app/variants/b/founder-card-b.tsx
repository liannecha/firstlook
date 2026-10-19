"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { FounderStory } from "../../founders";
import CompanyInformationB from "./company-information-b";

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
      <video ref={mediaRef} src={preview ? `${item.videoSrc}#t=0.001` : item.videoSrc} muted={preview || muted} playsInline loop preload={preview ? "metadata" : "auto"} aria-label={`${story.companyName} founder video`} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onVolumeChange={event => setMuted(event.currentTarget.muted)}>Your browser does not support HTML video.</video>
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
      <CompanyInformationB key={`${story.id}-${revision}`} story={story} preview={preview} saved={saved} decisionsDisabled={decisionsDisabled} onInterested={onInterested} onPass={onPass} onInvest={onInvest} />
    </aside>
  </div>;
}
