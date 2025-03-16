import { Accessor } from "solid-js";
import {
  TopBar,
  TopBarControlButton,
  TopBarControls,
  TopBarTitle,
} from "../../../../components/sidebar/sidebar-top-bar";
import { navigationStore } from "../../../../stores/navigation.store";
import { useWorkspace } from "../../../../data/queries/workspaces/use-workspace";

type SidebarTopBarProps = {
  currentView: Accessor<"activity" | "tree">;
  setCurrentView: (view: "activity" | "tree") => void;
};

export function SidebarTopBar(props: SidebarTopBarProps) {
  const workspace = useWorkspace({
    workspaceId: () => navigationStore.workspace.id,
  });

  return (
    <TopBar>
      <TopBarTitle icon="i-lucide:layers">{workspace.data?.name}</TopBarTitle>
      <TopBarControls>
        <TopBarControlButton
          icon="i-lucide:activity"
          isActive={props.currentView() === "activity"}
          onClick={() => props.setCurrentView("activity")}
        />
        <TopBarControlButton
          icon="i-lucide:list-tree"
          isActive={props.currentView() === "tree"}
          onClick={() => props.setCurrentView("tree")}
        />
      </TopBarControls>
    </TopBar>
  );
}
