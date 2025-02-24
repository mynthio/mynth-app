import { createDraggable } from "@neodrag/solid";

import { createEffect, createSignal, For, onMount } from "solid-js";

const data = [
  { id: "1", title: "Node 1" },
  { id: "2", title: "Node 2" },
  { id: "3", title: "Node 3" },
];
function Node(props: { id: string; title: string }) {
  const { draggable } = createDraggable();

  return (
    <div>
      <div
        use:draggable={{
          bounds: "body",
        }}
        class="border w-[200px] bg-black border-solid border-stone-600 p-4 rounded-md"
        data-testid="draggable-node"
      >
        {props.title}
      </div>
    </div>
  );
}

function DropHere() {
  return (
    <div>
      <div class={`border relative min-h-32 border-solid border-stone-600`}>
        Drop Here
      </div>
    </div>
  );
}

export default function TestNeoDrag() {
  return (
    <div class="border border-solid border-stone-700 p-4 rounded-md space-y-4 relative">
      <div class="space-y-2">
        <For each={data}>
          {(item) => <Node id={item.id} title={item.title} />}
        </For>
        <Node id="4" title="Node 4" />
      </div>

      {/* <DropHere /> */}
    </div>
  );
}
