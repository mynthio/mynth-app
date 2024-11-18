import { A } from "@solidjs/router";
import "./../index.css";
import TabsLayout from "./tabs-layout";
import SettingsIcon from "../components/icons/settings-icon";
import { TabsManagerProvider } from "../lib/tabs-manager/context/tabs-manager-context";
import { useTabsManager } from "../lib/tabs-manager/hooks/use-tabs-manager";
import { Button } from "../components/ui/button";
import HouseSimpleIcon from "../components/icons/house-simple";
import { getCurrentWindow } from "@tauri-apps/api/window";
type Props = any;

const window = getCurrentWindow();

export default function RootLayout(props: Props) {
  return (
    <div class="grid grid-cols-[3.5rem_1fr] h-full w-full">
      <TabsManagerProvider value={""}>
        <WindowSidebar />

        <main>
          <TabsLayout>{props.children}</TabsLayout>
        </main>
      </TabsManagerProvider>
    </div>
  );
}

function WindowSidebar() {
  const { pushAndNavigate } = useTabsManager();
  return (
    <aside
      data-tauri-drag-region
      class="bg-[#202a27] rounded-l-window flex flex-col justify-between items-center p-1"
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

        <A href="/">
          <HouseSimpleIcon />
        </A>
      </div>
      <div>
        <Button
          size="icon"
          class="rounded-bl-window"
          onClick={() =>
            pushAndNavigate({ key: "/settings", title: "Settings", data: {} })
          }
        >
          <SettingsIcon />
        </Button>
      </div>
    </aside>
  );
}
