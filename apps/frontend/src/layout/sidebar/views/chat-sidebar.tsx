import { invoke } from "@tauri-apps/api/core";
import {
  TopBar,
  TopBarControlButton,
  TopBarControls,
  TopBarTitle,
} from "../components/sidebar-top-bar";
import { createResource } from "solid-js";
import { navigationStore } from "../../../stores/navigation.store";

export function ChatSidebar() {
  const [workspace] = createResource(async () => {
    const workspace = await invoke<{ id: string; name: string }>(
      "get_workspace_by_id",
      {
        workspaceId: navigationStore.workspace.id,
      }
    );

    return workspace;
  });

  return (
    <div>
      <TopBar>
        <TopBarTitle icon={"i-lucide:layers"}>{workspace()?.name}</TopBarTitle>
        <TopBarControls>
          <TopBarControlButton icon={"i-lucide:activity"} onClick={() => {}} />
          <TopBarControlButton
            icon={"i-lucide:folder-tree"}
            onClick={() => {}}
          />
        </TopBarControls>
      </TopBar>
    </div>
  );
}
