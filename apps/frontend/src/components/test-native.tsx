import { For } from "solid-js";

const data = [
  { id: "1", title: "Node 1" },
  { id: "2", title: "Node 2" },
  { id: "3", title: "Node 3" },
];
function Node(props: { id: string; title: string }) {
  return (
    <div
      draggable="true"
      class="border w-[200px] bg-black border-solid border-stone-600 p-4 rounded-md"
      onDragStart={(e) => {
        e.dataTransfer?.setData("text/plain", props.id);
        console.log(`Node: Drag start`);
      }}
    >
      {props.title}
    </div>
  );
}

function DropHere() {
  return (
    <div
      class={`border relative h-32 border-solid border-stone-600`}
      onDragOver={(e) => {
        e.preventDefault();

        console.log(`Dropper: Drag over`);
        return false;
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        console.log(`Dropper: Drag enter`);
        return false;
      }}
      onDragLeave={() => {
        console.log(`Dropper: Drag leave`);
        return false;
      }}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer?.getData("text/plain");
        console.log(`Dropper: Drop - Item ID: ${id}`);
        return false;
      }}
    >
      Drop Here
    </div>
  );
}

export default function TestNative() {
  return (
    <div class="border border-solid border-stone-700 p-4 rounded-md space-y-4 relative">
      <div class="space-y-2">
        <For each={data}>
          {(item) => <Node id={item.id} title={item.title} />}
        </For>
      </div>

      <DropHere />
    </div>
  );
}
