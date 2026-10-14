import type { Metadata } from "next";
import "./firstlook.css";
import "./feed.css";
import "./watchlist.css";
import "./search.css";
import { WatchlistProvider } from "./watchlist";
import AppShell from "./app-shell";
import { DiscoveryProvider } from "./discovery";
import "./discovery.css";
import "./navigation.css";
import "./top-bar.css";
import "./placeholder-carousel.css";

export const metadata: Metadata = {
  title: "FirstLook | Discover founders",
  description: "Discover founder stories through video and keep track of companies that catch your eye.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased"><WatchlistProvider><DiscoveryProvider><AppShell>{children}</AppShell></DiscoveryProvider></WatchlistProvider></body>
    </html>
  );
}
