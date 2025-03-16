import { createResource, For } from "solid-js";
import {
  navigationStore,
  setNavigationStore,
} from "../../stores/navigation.store";
import { invoke } from "@tauri-apps/api/core";
import { Window } from "@tauri-apps/api/window";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../../ui/context-menu";
import { Button } from "../../ui/button";
import { Menu } from "@tauri-apps/api/menu";
import { emit, openActionDialog } from "../../features/actions";
import { useWorkspaces } from "../../data/queries/workspaces/use-workspaces";
import { openContextMenu } from "../../features/context-menu";

export function NavigationSidebar() {
  return (
    <div
      classList={{
        "after:w-1px": navigationStore.sidebar.isOpen,
        "after:w-0px": !navigationStore.sidebar.isOpen,
      }}
      class="w-navigation-sidebar flex-shrink-0 flex items-center gap-8px flex-col relative after:absolute after:right-1px after:top-9px after:bottom-9px after:bg-accent/20 after:content-[''] after:-z-1"
    >
      <MacOsWindowControls />
      <Workspaces />
      <Navigation />
    </div>
  );
}

function MacOsWindowControls() {
  const handleClose = async () => {
    try {
      const appWindow = Window.getCurrent();
      await appWindow.close();
    } catch (error) {
      console.error("Failed to close window:", error);
    }
  };

  const handleMinimize = async () => {
    try {
      const appWindow = Window.getCurrent();
      await appWindow.minimize();
    } catch (error) {
      console.error("Failed to minimize window:", error);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = Window.getCurrent();
      const isMaximized = await appWindow.isMaximized();
      if (isMaximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
    } catch (error) {
      console.error("Failed to toggle maximize window:", error);
    }
  };

  return (
    <div class="h-top-bar flex items-center gap-5px" data-tauri-drag-region>
      {/* Red close button */}
      <button
        class="size-9px bg-[#FF5F57] rounded-full hover:brightness-90 flex items-center justify-center cursor-default"
        onClick={handleClose}
        title="Close"
      >
        <span class="opacity-0 hover:opacity-100 text-black text-[8px]">✕</span>
      </button>

      {/* Yellow minimize button */}
      <button
        class="size-9px bg-[#FFBD2E] rounded-full hover:brightness-90 flex items-center justify-center cursor-default"
        onClick={handleMinimize}
        title="Minimize"
      >
        <span class="opacity-0 hover:opacity-100 text-black text-[8px]">−</span>
      </button>

      {/* Green maximize button */}
      <button
        class="size-9px bg-[#28C840] rounded-full hover:brightness-90 flex items-center justify-center cursor-default"
        onClick={handleMaximize}
        title="Maximize"
      >
        <span class="opacity-0 hover:opacity-100 text-black text-[8px]">+</span>
      </button>
    </div>
  );
}

const createWorkspaceContextMenu = (workspaceId: string) =>
  Menu.new({
    items: [
      {
        id: "ctx-workspace-delete",
        text: "Delete",
        action: () => {
          openActionDialog("delete-workspace", {
            workspaceId,
          });
          // emit({
          //   type: "delete-workspace",
          //   payload: {
          //     workspaceId,
          //   },
          // });
        },
      },
    ],
  });

function Workspaces() {
  const workspaces = useWorkspaces();

  return (
    <div
      data-tauri-drag-region
      class="flex-1 flex flex-col h-full w-full items-center gap-6px"
    >
      <For each={workspaces.data} fallback={<div>Loading...</div>}>
        {(workspace) => (
          <button
            onContextMenu={openContextMenu("workspace", { id: workspace.id })}
            class="size-36px flex items-center uppercase cursor-default text-11px font-600 text-accent justify-center bg-gradient-to-bl from-accent/5 to-accent/15 rounded-8px animate-in fade-in-0 slide-in-l-10 animate-duration-500"
            classList={{
              "from-green-300/20":
                workspace.id === navigationStore.workspace.id,
            }}
            onClick={() => {
              if (workspace.id !== navigationStore.workspace.id) {
                setNavigationStore("workspace", "id", workspace.id);
                setNavigationStore("sidebar", "isOpen", true);
                return;
              }

              setNavigationStore("sidebar", "isOpen", (isOpen) => !isOpen);
            }}
          >
            {workspace.name[0]}
            {workspace.name[1]}
          </button>
        )}
      </For>
    </div>
  );
}

function Navigation() {
  return (
    <div class="flex flex-col">
      <button
        onClick={() => {
          setNavigationStore("content", {
            id: "general",
            type: "settings",
          });
        }}
      >
        <div class="i-lucide:bolt" />
      </button>
    </div>
  );
}
