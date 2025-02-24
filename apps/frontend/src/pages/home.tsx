import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal } from "solid-js";
import { autofocus } from "@solid-primitives/autofocus";
import { buildChatTree } from "../lib/chats-manager/utils/build-chat-tree.util";

// Prevent import removal and library tree-shaking
autofocus;

function HomePage() {
  const [text, setText] = createSignal("");

  createEffect(() => {
    invoke("get_flat_structure").then((data) => {
      const tree = buildChatTree(data[0], data[1]);
      setText(JSON.stringify({ tree }, null, 1));
    });
  });

  return (
    <main class="container">
      <div>
        lalal
        <pre>{/* <code>{text()}</code> */}</pre>
      </div>
    </main>
  );
}

export default HomePage;
