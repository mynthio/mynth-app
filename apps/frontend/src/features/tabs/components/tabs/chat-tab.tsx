import { createMemo } from "solid-js";
import {
  pop,
  state,
  switchTo,
  type ChatTab as ChatTabType,
} from "../../tabs.store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../ui/tooltip";

type ChatTabProps = {
  tab: ChatTabType;
};

export function ChatTab({ tab }: ChatTabProps) {
  const isActive = createMemo(() => tab.id === state.currentTab);

  return (
    <Tooltip
      floatingOptions={{
        offset: 10,
      }}
    >
      <TooltipContent>{tab.title}</TooltipContent>
      <TooltipTrigger
        as="div"
        class="h-button flex items-center justify-between min-w-0 rounded-default bg-window-elements-background hover:bg-elements-background-soft w-full max-w-260px"
        classList={{
          "bg-elements-background-soft": isActive(),
        }}
      >
        <button
          onClick={() => {
            switchTo(tab.id);
          }}
          onAuxClick={() => {
            pop(tab.id);
          }}
          class="w-full h-full flex items-center gap-5px text-ui-small px-10px cursor-default hover:bg-elements-background-soft rounded-default min-w-0"
        >
          <div
            class="i-lucide:message-circle text-ui-icon-small"
            classList={{
              "text-muted": !isActive(),
              "text-green-500": isActive(),
            }}
          />
          <div class="truncate min-w-0">{tab.title}</div>
        </button>
        <button
          class="w-30px h-30px rounded-default flex-shrink-0 flex items-center justify-center cursor-default hover:bg-white/5"
          onClick={() => {
            pop(tab.id);
          }}
        >
          <div class="i-lucide:x text-16px text-muted" />
        </button>
      </TooltipTrigger>
    </Tooltip>
  );
}
