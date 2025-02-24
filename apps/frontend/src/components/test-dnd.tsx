import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import { createEffect, createSignal, For, onMount } from "solid-js";

const data = [
  { id: "1", title: "Node 1" },
  { id: "2", title: "Node 2" },
  { id: "3", title: "Node 3" },
];
function Node(props: { id: string; title: string }) {
  let ref: HTMLDivElement | undefined = undefined;

  const [isDragOverMe, setIsDragOverMe] = createSignal(false);

  onMount(() => {
    draggable({
      element: ref!,
      canDrag: () => true,
      onDrop(args) {
        console.log("drop", args);
      },
      getInitialData: () => ({
        id: props.id,
        title: props.title,
      }),
      onDragStart: (args) => {
        console.log("drag start", args);
      },
      onDropTargetChange: (args) => {
        console.log("drop target change", args);
      },
    });

    dropTargetForElements({
      element: ref!,
      canDrop: () => true,
      onDragStart: (args) => {
        console.log("drag start", args);
      },
      onDrag: (args) => {
        console.log("drag", args);
      },
      onDragEnter: (args) => {
        console.log("drag enter", args);
        setIsDragOverMe(true);
      },
      onDropTargetChange: (args) => {
        console.log("drop target change", args);
      },
      onDragLeave: (args) => {
        console.log("drag leave", args);
        setIsDragOverMe(false);
      },
      onDrop: (args) => {
        console.log("drop", args);
        setIsDragOverMe(false);
      },
    });
  });

  return (
    <div>
      <div
        ref={ref}
        class="border w-[200px] bg-black border-solid border-stone-600 p-4 rounded-md"
        classList={{
          "bg-stone-100/10": isDragOverMe(),
        }}
        data-testid="draggable-node"
      >
        {props.title}
      </div>
    </div>
  );
}

export default function TestDnd() {
  // onMount(() => {
  //   const cleanup = monitorForExternal({
  //     onDropTargetChange(args) {
  //       console.log("drop target change", args);
  //     },
  //   });

  //   onCleanup(() => {
  //     cleanup();
  //   });
  // });

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
