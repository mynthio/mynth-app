import Dialog from "@corvu/dialog"; // 'corvu/dialog'
import { For, Show } from "solid-js";
import { openModal, setOpenModal } from "../stores/modals.store";
import { Dialog as ArkDialog } from "@ark-ui/solid/dialog";
import { Portal } from "solid-js/web";
import { XIcon } from "lucide-solid";

const settingsItems = [
  { id: "general", label: "General" },
  { id: "ai_integrations", label: "AI Integrations" },
  { id: "appearance", label: "Appearance" },
  { id: "commands", label: "Commands" },
  { id: "advanced", label: "Advanced" },
  { id: "keyboard_shortcuts", label: "Keyboard Shortcuts" },
];

function SettingsSidebar() {
  return (
    <div class="w-[200px] border-r border-[#919C98]/5 h-full">
      <ul class="space-y-[4px] pr-2">
        <For each={settingsItems}>
          {(item) => (
            <li class="w-full">
              <button class="text-[#878C8B] px-[10px] py-[7px] text-[13px] rounded-md hover:bg-[#919C98]/5 w-full text-left">
                {item.label}
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

function SettingsLayout({ children }: { children: any }) {
  return (
    <div class="flex gap-[12px] max-h-full min-h-full h-full">
      <SettingsSidebar />
      {children}
    </div>
  );
}

function SettingsModal() {
  return (
    <ArkDialog.Root
      lazyMount
      unmountOnExit
      open
      onOpenChange={() => setOpenModal(null)}
    >
      <Portal>
        <ArkDialog.Backdrop class="bg-[#1B1B1B]/50 backdrop-blur-[11px] w-full h-full fixed inset-0 rounded-window" />
        <ArkDialog.Positioner>
          <ArkDialog.Content class="fixed bg-[#222323] left-1/2 h-[90%] max-h-[600px] top-1/2 z-50 w-[90%] max-w-[960px] -translate-x-1/2 -translate-y-1/2 rounded-lg px-5 py-6 shadow-xl">
            <div class="flex justify-end px-6">
              <ArkDialog.CloseTrigger>
                <XIcon class="text-white/50" size={14} />
              </ArkDialog.CloseTrigger>
            </div>
            <SettingsLayout>lalal</SettingsLayout>
          </ArkDialog.Content>
        </ArkDialog.Positioner>
      </Portal>
    </ArkDialog.Root>
  );
}

export function ModalsRouter() {
  return (
    <Show when={openModal() === "settings"}>
      <SettingsModal />
    </Show>
  );
}
