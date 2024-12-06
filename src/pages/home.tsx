import { invoke } from "@tauri-apps/api/core";
import { createEffect, createSignal } from "solid-js";
import { autofocus } from "@solid-primitives/autofocus";

// Prevent import removal and library tree-shaking
autofocus;

function HomePage() {
  const [text, setText] = createSignal("");

  createEffect(() => {
    invoke("fetch_chats").then((chats) => {
      setText(JSON.stringify(chats));
    });
  });

  return (
    <main class="container">
      <div>{text()}</div>
    </main>
  );
}

export default HomePage;
