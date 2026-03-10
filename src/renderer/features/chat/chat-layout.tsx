import { Link, Outlet, useMatchRoute } from "@tanstack/react-router";

import { WindowChrome } from "@/components/app/window-chrome";
import { Button } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChatSidebarTree } from "@/features/chat/chat-sidebar-tree";
import { ChatTabHotkeys } from "@/features/chat/chat-tab-hotkeys";
import { ChatToolbar } from "@/features/chat/chat-toolbar";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Chatting01Icon, Setting07Icon, WorkflowSquare03Icon } from "@hugeicons/core-free-icons";

export function ChatLayout() {
  return (
    <WindowChrome contentClassName="overflow-hidden" toolbar={<ChatToolbar />}>
      <SidebarProvider className="h-full min-h-0 w-full">
        <ChatTabHotkeys />
        <ChatSidebarTree />

        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-l-2xl bg-card">
          <Outlet />

          <ChatContentNavigation />
        </div>
      </SidebarProvider>
    </WindowChrome>
  );
}

function ChatContentNavigation() {
  const matchRoute = useMatchRoute();

  return (
    <div className="absolute top-2 right-4 flex h-auto w-auto flex-col items-center justify-center gap-0.5 rounded-xl bg-sidebar p-1 backdrop-blur-sm">
      <Button
        render={<Link to="/chat" />}
        variant="ghost"
        size="icon"
        className={cn(matchRoute({ to: "/chat" }) && "bg-foreground/15")}
      >
        <HugeiconsIcon icon={Chatting01Icon} />
      </Button>
      <Button
        render={<Link to="/chat/graph" />}
        variant="ghost"
        size="icon"
        className={cn(matchRoute({ to: "/chat/graph" }) && "bg-foreground/15")}
      >
        <HugeiconsIcon icon={WorkflowSquare03Icon} />
      </Button>
      <Button
        render={<Link to="/chat/settings" />}
        variant="ghost"
        size="icon"
        className={cn(matchRoute({ to: "/chat/settings" }) && "bg-foreground/15")}
      >
        <HugeiconsIcon icon={Setting07Icon} />
      </Button>
    </div>
  );
}
