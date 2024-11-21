import { A } from "@solidjs/router";
import "./../index.css";
import TabsLayout from "./tabs-layout";
import SettingsIcon from "../components/icons/settings-icon";
import { TabsManagerProvider } from "../lib/tabs-manager/context/tabs-manager-context";
import { useTabsManager } from "../lib/tabs-manager/hooks/use-tabs-manager";
import { Button, buttonVariants } from "../components/ui/button";
import HouseSimpleIcon from "../components/icons/house-simple";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TabsManagerKeyboardShortcuts from "../lib/tabs-manager/utils/tabs-manager-keyboard-shortcuts";
type Props = any;

const window = getCurrentWindow();

export default function RootLayout(props: Props) {
  return (
    <>
      <TabsManagerProvider value={""}>
        <WindowSidebar />

        <main class="w-[calc(100%-3.5rem)] h-full ml-[3.5rem]">
          <TabsLayout>{props.children}</TabsLayout>
        </main>

        <TabsManagerKeyboardShortcuts />
      </TabsManagerProvider>
    </>
  );
}

function WindowSidebar() {
  const { openTab } = useTabsManager();
  return (
    <aside
      data-tauri-drag-region
      class="bg-[#202a27] rounded-l-window flex flex-col justify-between items-center p-1 w-[3.5rem] fixed left-0 top-0 bottom-0"
    >
      <div class="flex flex-col items-center justify-center gap-4 mt-4">
        {/* MacOS Icons */}
        <div class="flex flex-col items-center justify-center gap-2">
          <button
            onClick={() => {
              window.close();
            }}
            class="bg-[#FF5F57] w-3 h-3 rounded-full"
          ></button>
          <button
            onClick={() => {
              window.minimize();
            }}
            class="bg-[#FDBC2C] w-3 h-3 rounded-full"
          ></button>
          <button
            onClick={() => {
              window.toggleMaximize();
            }}
            class="bg-[#28C840] w-3 h-3 rounded-full"
          ></button>
        </div>

        <A class={buttonVariants({ size: "icon" })} href="/">
          <HouseSimpleIcon />
        </A>
      </div>
      <div>
        <Button
          size="icon"
          class="rounded-bl-window"
          onClick={() =>
            openTab({ path: "/settings", title: "Settings", data: {} })
          }
        >
          <SettingsIcon />
        </Button>
      </div>
    </aside>
  );
}
