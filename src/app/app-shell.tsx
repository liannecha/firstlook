"use client";

import FirstLookNavigation from "./firstlook-navigation";
import TopBar from "./top-bar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const hideNavigation = usePathname() === "/variants/b";
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [navigationMobileOpen, setNavigationMobileOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={250}>
      <SidebarProvider className="firstlook-sidebar-provider" open={navigationOpen} onOpenChange={setNavigationOpen} openMobile={navigationMobileOpen} onOpenMobileChange={setNavigationMobileOpen} style={{ "--sidebar-width": "280px", "--sidebar-width-icon": "72px" } as React.CSSProperties}>
        {!hideNavigation ? <div className="shell-navigation"><TopBar /><FirstLookNavigation /></div> : null}
        <div className="app-shell" style={hideNavigation ? { paddingLeft: 0, minHeight: "100dvh" } : undefined}>
          <div className="primary-content">{children}</div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
