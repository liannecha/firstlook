"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Activity, Search, BriefcaseBusiness, UserRound, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const items = [
  { href: "/", label: "Activity", icon: Activity, key: "activity" },
  { href: "/search", label: "Deals", icon: Search, key: "deals" },
  { href: "/saved", label: "Portfolio", icon: BriefcaseBusiness, key: "portfolio" },
  { href: "/profile", label: "Profile", icon: UserRound, key: "profile" },
];

function NavigationBody({ expanded, onOpen, onSelect }: { expanded: boolean; onOpen: (key: string) => void; onSelect: () => void }) {
  const pathname = usePathname();
  return (
    <nav className={`wefunder-nav-body ${expanded ? "is-expanded" : "is-collapsed"}`} aria-label="Main navigation" id={expanded ? "expanded-navigation" : undefined} onClick={event => { if (!expanded && event.target instanceof Element && !event.target.closest("a,button")) onOpen("header"); }}>
      <SidebarHeader className="wefunder-nav-header">
        {expanded ? <Link href="/profile" data-nav-destination="header" className="nav-profile-header" onClick={onSelect}><Avatar className="nav-avatar"><AvatarFallback><UserRound aria-hidden="true" /></AvatarFallback></Avatar><span>Your profile</span><ChevronRight className="nav-chevron" aria-hidden="true" /></Link> : <Tooltip><TooltipTrigger asChild><button className="nav-profile-header" data-nav-opener="header" aria-label="Expand navigation" aria-expanded={false} onClick={() => onOpen("header")}><Avatar className="nav-avatar"><AvatarFallback><UserRound aria-hidden="true" /></AvatarFallback></Avatar></button></TooltipTrigger><TooltipContent side="right">Your profile · Expand navigation</TooltipContent></Tooltip>}
      </SidebarHeader>
      <Separator className="nav-divider" />
      <SidebarContent className="wefunder-nav-content" onClick={event => { if (!expanded && event.target instanceof Element && !event.target.closest("a,button")) onOpen("header"); }}>
        <SidebarMenu className="wefunder-nav-menu">
          {items.map(item => <SidebarMenuItem key={item.key}>
            <SidebarMenuButton asChild isActive={pathname === item.href} size="lg" className="wefunder-nav-item" tooltip={expanded ? undefined : item.label}>
              {expanded ? <Link href={item.href} data-nav-destination={item.key} aria-current={pathname === item.href ? "page" : undefined} onClick={onSelect}><item.icon aria-hidden="true" /><span className="nav-item-label">{item.label}{item.key === "portfolio" ? <small>Saved companies</small> : null}</span></Link> : <button data-nav-opener={item.key} aria-label={`Expand navigation for ${item.label}`} aria-expanded={false} aria-current={pathname === item.href ? "page" : undefined} onClick={() => onOpen(item.key)}><item.icon aria-hidden="true" /></button>}
            </SidebarMenuButton>
          </SidebarMenuItem>)}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="wefunder-nav-footer"><Separator className="nav-divider" /><a className="nav-wefunder-link" href="https://wefunder.com/explore" target="_blank" rel="noopener noreferrer" aria-label="Explore on Wefunder (opens in a new tab)" onClick={onSelect}><Image src="/wefunder-logo.png" width={40} height={40} alt="" unoptimized />{expanded ? <span>Wefunder <span aria-hidden="true">↗</span></span> : null}</a></SidebarFooter>
    </nav>
  );
}

export default function FirstLookNavigation() {
  const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef("header");
  function expand(key: string) {
    opener.current = key;
    if (isMobile) setOpenMobile(true);
    else {
      setOpen(true);
      requestAnimationFrame(() => root.current?.querySelector<HTMLAnchorElement>(`[data-nav-destination="${key}"]`)?.focus());
    }
  }
  function close() { setOpen(false); setOpenMobile(false); }
  function returnFocus() {
    requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-nav-opener="${opener.current}"]`)?.focus());
  }
  useEffect(() => {
    if (!open || isMobile) return;
    function outside(event: PointerEvent | FocusEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setOpen(false);
        requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-nav-opener="${opener.current}"]`)?.focus());
      }
    }
    function iframeFocus() {
      requestAnimationFrame(() => { if (document.activeElement instanceof HTMLIFrameElement) setOpen(false); });
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape, true);
    window.addEventListener("blur", iframeFocus);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape, true);
      window.removeEventListener("blur", iframeFocus);
    };
  }, [open, isMobile, setOpen]);

  return (
    <div ref={root} className="firstlook-navigation-root">
      <Sidebar collapsible="icon" className="firstlook-navigation" onMobileCloseAutoFocus={event => { event.preventDefault(); returnFocus(); }}>
        <NavigationBody expanded={isMobile ? true : open} onOpen={expand} onSelect={close} />
      </Sidebar>
      <div className="mobile-navigation-rail"><NavigationBody expanded={false} onOpen={expand} onSelect={close} /></div>
      <span className="sr-only" role="status">Navigation {open || openMobile ? "expanded" : "collapsed"}</span>
    </div>
  );
}
