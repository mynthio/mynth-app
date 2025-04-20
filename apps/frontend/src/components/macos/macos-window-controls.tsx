import { Window } from "@tauri-apps/api/window";

export function MacOsWindowControls() {
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
    <div
      class="h-top-bar flex items-center gap-8px px-8px"
      data-tauri-drag-region
    >
      {/* Red close button */}
      <button
        class="size-12px bg-[#FF5F57] rounded-full hover:brightness-90 flex items-center justify-center cursor-default"
        onClick={handleClose}
        title="Close"
      >
        <span class="opacity-0 hover:opacity-100 text-black text-[8px]">✕</span>
      </button>

      {/* Yellow minimize button */}
      <button
        class="size-12px bg-[#FFBD2E] rounded-full hover:brightness-90 flex items-center justify-center cursor-default"
        onClick={handleMinimize}
        title="Minimize"
      >
        <span class="opacity-0 hover:opacity-100 text-black text-[8px]">−</span>
      </button>

      {/* Green maximize button */}
      <button
        class="size-12px bg-[#28C840] rounded-full hover:brightness-90 flex items-center justify-center cursor-default"
        onClick={handleMaximize}
        title="Maximize"
      >
        <span class="opacity-0 hover:opacity-100 text-black text-[8px]">+</span>
      </button>
    </div>
  );
}
