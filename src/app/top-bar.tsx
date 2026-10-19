"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Mail, Menu, Search, UserRound } from "lucide-react";

export default function TopBar() {
  const isVersionB = usePathname() === "/variants/b";
  return (
    <header className="firstlook-topbar">
      <Link href="/search" className="topbar-search" aria-label="Search companies and founders"><Search aria-hidden="true" /><span>Search</span></Link>
      <nav className="topbar-links" aria-label={isVersionB ? "External Wefunder navigation" : "Explore navigation"}><a href="https://wefunder.com/explore">{isVersionB ? "Explore Wefunder ↗" : "Explore"}</a><a href="https://wefunder.com/vault">Venture Vault</a></nav>
      <details className="topbar-menu"><summary aria-label="Open top navigation"><Menu aria-hidden="true" /></summary><nav aria-label={isVersionB ? "External Wefunder navigation" : "Compact explore navigation"}><a href="https://wefunder.com/explore">{isVersionB ? "Explore Wefunder ↗" : "Explore"}</a><a href="https://wefunder.com/vault">Venture Vault</a>{!isVersionB ? <button type="button" disabled>Raise Capital · Coming soon</button> : null}</nav></details>
      <div className="topbar-spacer" />
      {!isVersionB ? <button type="button" className="topbar-raise" disabled title="Raise Capital — coming soon">Raise Capital</button> : null}
      {!isVersionB ? <button type="button" className="topbar-icon" disabled aria-label="Notifications — coming soon" title="Notifications — coming soon"><Bell aria-hidden="true" /></button> : null}
      {!isVersionB ? <button type="button" className="topbar-icon" disabled aria-label="Messages — coming soon" title="Messages — coming soon"><Mail aria-hidden="true" /></button> : null}
      <Link href="/profile" className="topbar-profile" aria-label="Your profile"><UserRound aria-hidden="true" /></Link>
    </header>
  );
}
