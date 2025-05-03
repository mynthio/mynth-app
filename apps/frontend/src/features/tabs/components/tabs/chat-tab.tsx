import { TabBase } from "./tab-base";
import {
  type ChatTab as ChatTabType,
  state,
  pop,
  switchTo,
} from "../../tabs.store";

export function ChatTab({ tab }: { tab: ChatTabType }) {
  return (
    <TabBase
      tab={tab}
      icon={null}
      tooltip={tab.title}
      onClick={() => switchTo(tab.id)}
      onAuxClick={() => pop(tab.id)}
      onClose={() => pop(tab.id)}
    />
  );
}
