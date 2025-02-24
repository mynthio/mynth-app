import { autofocus } from "@solid-primitives/autofocus";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { Channel, invoke } from "@tauri-apps/api/core";
import { Menu } from "@tauri-apps/api/menu";
import { listen } from "@tauri-apps/api/event";

// Prevent import removal and library tree-shaking
autofocus;

type OllamaMessageEvent = {
  event: "messageReceived";
  data: {
    message: string;
  };
};

export default function ChatPage(props: { chatId: string }) {
  let form!: HTMLFormElement;

  const [text, setText] = createSignal("");

  const menuPromise = Menu.new({
    items: [
      { id: "copy", text: "Copy" },
      { id: "delete", text: "Delete Message" },
    ],
  });

  onMount(async () => {
    const unlistenMenuEvents = await listen<string>("menu-event", (event) => {
      switch (event.payload) {
        case "copy":
          console.log("copy triggered");
          break;
        case "delete":
          console.log("delete triggered");
          break;
        default:
          console.log("Unhandled menu event:", event.payload);
      }
    });

    onCleanup(() => {
      unlistenMenuEvents();
    });
  });

  const handleContextMenu = async (event: MouseEvent) => {
    event.preventDefault();
    const menu = await menuPromise;
    await menu.popup();
  };

  const newOnEvent = new Channel<OllamaMessageEvent>();

  newOnEvent.onmessage = (message) => {
    console.log(`got download event ${message.data.message}`);
    setText((prev) => prev + JSON.parse(message.data.message).response);
  };

  invoke("reconnect_ollama_stream", {
    chatId: props.chatId,
    newChannel: newOnEvent,
  }).catch(() => {});

  createEffect(() => {
    autofocus(form?.querySelector("textarea") as HTMLTextAreaElement);
  });

  return (
    <div>
      <div>{props.chatId}</div>

      <div></div>

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
            chatId: props.chatId,
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
