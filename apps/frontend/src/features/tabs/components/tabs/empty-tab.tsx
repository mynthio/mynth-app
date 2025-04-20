import { createMemo } from "solid-js";
import { pop, state, switchTo, type EmptyTab } from "../../tabs.store";

type EmptyTabProps = {
  tab: EmptyTab;
};

export function EmptyTab({ tab }: EmptyTabProps) {
  const isActive = createMemo(() => tab.id === state.currentTab);

  return (
    <div
      class="h-button flex items-center justify-between min-w-0 rounded-default hover:bg-elements-background-soft bg-window-elements-background w-full max-w-260px"
      classList={{
        "bg-elements-background-soft": isActive(),
      }}
    >
      <button
        onClick={() => {
          switchTo(tab.id);
        }}
        class="w-full h-full flex items-center gap-5px text-ui-small px-10px cursor-default rounded-default min-w-0"
      >
        <div
          class="i-lucide:circle-small text-ui-icon-small"
          classList={{
            "text-muted": !isActive(),
            "text-green-500": isActive(),
          }}
        />
        <span class="truncate min-w-0">{tab.title}</span>
      </button>
      <button
        class="w-30px h-30px rounded-default flex-shrink-0 flex items-center justify-center cursor-default hover:bg-white/5"
        onClick={() => {
          pop(tab.id);
        }}
      >
        <div class="i-lucide:x text-16px text-muted" />
      </button>
    </div>
  );
}
