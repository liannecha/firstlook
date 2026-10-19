"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { presentationSlidesB, type PresentationSlide } from "./presentation-slides-c";

function SlideImage({ slide, companyName, number }: { slide: PresentationSlide; companyName: string; number: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p role="alert" className="version-b-presentation-error">This slide could not load. Try another slide or reopen the presentation.</p>;
  return <Image src={slide.src} width={slide.width} height={slide.height} alt={`${companyName} presentation, slide ${number}`} unoptimized onError={() => setFailed(true)} />;
}

function PresentationViewer({ slides, companyName, onClose }: { slides: readonly PresentationSlide[]; companyName: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const modal = dialog.current;
    modal?.showModal();
    return () => { modal?.close(); };
  }, []);
  function close() { dialog.current?.close(); onClose(); }
  return createPortal(<dialog ref={dialog} className="version-b-presentation-dialog" aria-label={`${companyName} presentation`} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }} onPointerDown={event => event.stopPropagation()} onPointerMove={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()} onKeyDown={event => {
    event.stopPropagation();
    if (event.key === "Tab") {
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    if (event.key === "ArrowLeft") { event.preventDefault(); setIndex(current => Math.max(0, current - 1)); }
    if (event.key === "ArrowRight") { event.preventDefault(); setIndex(current => Math.min(slides.length - 1, current + 1)); }
  }}>
    <header className="version-b-presentation-toolbar"><span>{companyName}</span><button type="button" autoFocus onClick={close} aria-label="Close presentation"><X aria-hidden="true" /> Close</button></header>
    <div className="version-b-presentation-stage" onClick={event => { if (event.target === event.currentTarget) close(); }}><SlideImage key={slides[index].src} slide={slides[index]} companyName={companyName} number={index + 1} /></div>
    <footer className="version-b-presentation-navigation"><button type="button" disabled={index === 0} onClick={() => setIndex(current => current - 1)} aria-label="Previous slide"><ArrowLeft aria-hidden="true" /><span>Previous</span></button><span aria-live="polite" aria-atomic="true">{index + 1} / {slides.length}</span><button type="button" disabled={index === slides.length - 1} onClick={() => setIndex(current => current + 1)} aria-label="Next slide"><span>Next</span><ArrowRight aria-hidden="true" /></button></footer>
  </dialog>, document.body);
}

export default function PresentationB({ companyId, companyName, preview = false }: { companyId: string; companyName: string; preview?: boolean }) {
  const slides = presentationSlidesB[companyId];
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  if (!slides?.length) return null;
  return <>
    <button ref={trigger} type="button" className="version-b-presentation-preview" aria-label={`Open ${companyName} presentation`} aria-haspopup="dialog" tabIndex={preview ? -1 : 0} onClick={event => { event.stopPropagation(); if (!preview) setOpen(true); }}>
      <Image src={slides[0].src} width={slides[0].width} height={slides[0].height} alt="" loading="lazy" unoptimized />
      <span className="version-b-presentation-expand" aria-hidden="true"><Maximize2 /></span>
    </button>
    {open ? <PresentationViewer slides={slides} companyName={companyName} onClose={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }} /> : null}
  </>;
}
