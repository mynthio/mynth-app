import { invoke } from "@tauri-apps/api/core";
import mynthLogo from "../../../assets/mynth-logo.png";

export function BlankContent() {
  return (
    <div class="flex flex-col items-center justify-between h-full">
      <div class="h-100px flex items-center justify-center">
        <strong class="text-transparent bg-clip-text bg-gradient-to-br from-white/70 to-white/40 font-100 text-32px">
          Hello
        </strong>
      </div>
      <div class="flex flex-col items-center justify-center gap-2">
        <img
          draggable={false}
          src={mynthLogo}
          class="w-100px pointer-events-none select-none animate-in animate-fade-in"
        />
      </div>
      <div class="h-100px flex items-center justify-center">
        <button
          class="bg-accent/10 text-white/70 h-52px px-24px rounded-lg font-300 cursor-default hover:scale-103 transition-all duration-200"
          onClick={() => {
            invoke("create_chat", {
              name: "New chat",
              workspaceId: "w-default",
            });
          }}
        >
          Create new chat
        </button>
      </div>
    </div>
  );
}
