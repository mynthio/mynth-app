import { useBeforeLeave, useParams } from "@solidjs/router";

import { autofocus } from "@solid-primitives/autofocus";
import { createEffect, createSignal, onMount } from "solid-js";
import { Channel, invoke } from "@tauri-apps/api/core";

// Prevent import removal and library tree-shaking
autofocus;

type OllamaMessageEvent = {
  event: "messageReceived";
  data: {
    message: string;
  };
};

export default function ChatPage() {
  let form!: HTMLFormElement;

  const params = useParams<{ id: string }>();

  const [text, setText] = createSignal("");

  const newOnEvent = new Channel<OllamaMessageEvent>();

  newOnEvent.onmessage = (message) => {
    console.log(`got download event ${message.data.message}`);
    setText((prev) => prev + JSON.parse(message.data.message).response);
  };

  invoke("reconnect_ollama_stream", {
    chatId: params.id,
    newChannel: newOnEvent,
  }).catch(() => {});

  useBeforeLeave(() => {
    form?.reset();
  });

  createEffect(() => {
    params.id;
    autofocus(form?.querySelector("textarea") as HTMLTextAreaElement);
  });

  return (
    <div>
      <h1>{params.id}</h1>
      <div>{text()}</div>

      <form
        ref={form}
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
    </div>
  );
}
