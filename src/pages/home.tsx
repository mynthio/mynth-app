import { invoke, Channel } from "@tauri-apps/api/core";
import { createSignal } from "solid-js";
import { autofocus } from "@solid-primitives/autofocus";

// Prevent import removal and library tree-shaking
autofocus;

type OllamaMessageEvent = {
  event: "messageReceived";
  data: {
    message: string;
  };
};

function HomePage() {
  const [text, setText] = createSignal("");

  const newOnEvent = new Channel<OllamaMessageEvent>();

  newOnEvent.onmessage = (message) => {
    console.log(`got download event ${message.data.message}`);
    setText((prev) => prev + JSON.parse(message.data.message).response);
  };

  invoke("reconnect_ollama_stream", {
    chatId: "1",
    newChannel: newOnEvent,
  }).catch(() => {});

  return (
    <main class="container">
      <div>{text()}</div>

      <form
        onSubmit={(e) => {
          e.preventDefault();

          setText("");

          const onEvent = new Channel<OllamaMessageEvent>();
          onEvent.onmessage = (message) => {
            console.log(`got download event ${message.data.message}`);
            setText((prev) => prev + JSON.parse(message.data.message).response);
          };

          const formValues = new FormData(e.currentTarget);

          invoke("stream_ollama_messages", {
            onEvent,
            chatId: "1",
            prompt: formValues.get("prompt") as string,
          });
        }}
      >
        <textarea name="prompt" use:autofocus autofocus />
        <button type="submit">Send</button>
      </form>
    </main>
  );
}

export default HomePage;
