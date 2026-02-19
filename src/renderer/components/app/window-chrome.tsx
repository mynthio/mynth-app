import type * as React from "react";

import { cn } from "@/lib/utils";
import { WINDOW_TOOLBAR_HEIGHT, WINDOW_TRAFFIC_LIGHTS_SPACER } from "../../../shared/window-chrome";

type WindowChromeProps = {
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function WindowChrome({
  toolbar,
  children,
  className,
  contentClassName,
}: WindowChromeProps) {
  const chromeStyle = {
    "--window-toolbar-height": `${WINDOW_TOOLBAR_HEIGHT}px`,
    "--window-traffic-lights-spacer": `${WINDOW_TRAFFIC_LIGHTS_SPACER}px`,
  } as React.CSSProperties;

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col", className)}
      data-slot="window-chrome"
      style={chromeStyle}
    >
      <header
        className="relative isolate h-[var(--window-toolbar-height)] shrink-0 border-b bg-background/90 supports-[backdrop-filter]:bg-background/75 supports-[backdrop-filter]:backdrop-blur"
        data-slot="window-chrome-toolbar"
      >
        <div className="absolute inset-0 [-webkit-app-region:drag]" />
        <div className="pointer-events-none relative z-10 flex h-full items-center px-3">
          <div
            aria-hidden
            className="shrink-0"
            style={{ width: "var(--window-traffic-lights-spacer)" }}
          />
          {toolbar ? (
            <div className="pointer-events-auto max-w-full [-webkit-app-region:no-drag]">
              {toolbar}
            </div>
          ) : null}
        </div>
      </header>
      <div className={cn("min-h-0 flex-1", contentClassName)} data-slot="window-chrome-content">
        {children}
      </div>
    </div>
  );
}
