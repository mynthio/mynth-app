import { createEffect, createSignal, For } from "solid-js";

// Core Packages
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { pointerOutsideOfPreview } from "@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
// Optional Packages
import {
  attachClosestEdge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";

const defaultItems = [
  {
    id: "task-1",
    label: "Organize a team-building event",
  },
  {
    id: "task-2",
    label: "Create and maintain office inventory",
  },
  {
    id: "task-3",
    label: "Update company website content",
  },
  {
    id: "task-4",
    label: "Plan and execute marketing campaigns",
  },
  {
    id: "task-5",
    label: "Coordinate employee training sessions",
  },
  {
    id: "task-6",
    label: "Manage facility maintenance",
  },
  {
    id: "task-7",
    label: "Organize customer feedback surveys",
  },
  {
    id: "task-8",
    label: "Coordinate travel arrangements",
  },
];

const itemKey = Symbol("item");

function isItemData(data) {
  return data[itemKey] === true;
}

const idleState = { type: "idle" };
const draggingState = { type: "dragging" };

function ListItem(props) {
  let myDiv;
  const [closestEdge, setClosestEdge] = createSignal(null);
  const [draggableState, setDraggableState] = createSignal(idleState);

  createEffect(() => {
    const data = {
      [itemKey]: true,
      item: props.item,
      index: props.index,
    };

    draggable({
      element: myDiv,
      getInitialData: () => data,
      onGenerateDragPreview({ nativeSetDragImage }) {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({
            x: "16px",
            y: "8px",
          }),
          render({ container }) {
            setDraggableState({ type: "preview", container });

            return () => setDraggableState(draggingState);
          },
        });
      },
      onDragStart() {
        setDraggableState(draggingState);
      },
      onDrop() {
        setDraggableState(idleState);
      },
    });

    dropTargetForElements({
      element: myDiv,
      canDrop({ source }) {
        return isItemData(source.data);
      },
      getData({ input }) {
        return attachClosestEdge(data, {
          element: myDiv,
          input,
          allowedEdges: ["top", "bottom"],
        });
      },
      onDrag({ self, source }) {
        const isSource = source.element === myDiv;
        if (isSource) {
          setClosestEdge(null);
          return;
        }

        const closestEdge = extractClosestEdge(self.data);

        const sourceIndex = source.data.index;

        const isItemBeforeSource = props.index === sourceIndex - 1;
        const isItemAfterSource = props.index === sourceIndex + 1;

        const isDropIndicatorHidden =
          (isItemBeforeSource && closestEdge === "bottom") ||
          (isItemAfterSource && closestEdge === "top");

        if (isDropIndicatorHidden) {
          setClosestEdge(null);
          return;
        }

        setClosestEdge(closestEdge);
      },
      onDragLeave() {
        setClosestEdge(null);
        console.log("drag leave");
      },
      onDrop() {
        setClosestEdge(null);
        console.log("dropped");
      },
    });
  });

  return (
    <div class={"todo__container"} ref={myDiv}>
      <div
        classList={{
          todo__item: true,
          dragging: draggableState().type === "dragging",
        }}
      >
        {props.item.label}
      </div>
      {/* 1. Blue indicator of where the draggable item is closet */}
      <Show when={closestEdge()}>
        <DropIndicator edge={closestEdge()} gap="1px" />
      </Show>

      {/* 2. Add draggable element to the mouse pointer */}
      <Show when={draggableState().type === "preview"}>
        <Portal mount={draggableState().container}>
          <div class={"todo__container"}>
            <div class="todo__item dragging">{props.item.label}</div>
          </div>
        </Portal>
      </Show>
    </div>
  );
}

function DropIndicator(props) {
  return (
    <div
      classList={{
        todo__item__indicator: true,
        "todo__item__indicator--top": props.edge === "top",
        "todo__item__indicator--bottom ": props.edge === "bottom",
      }}
    />
  );
}

export default function ListExample() {
  const [listState, setListState] = createSignal(
    {
      items: defaultItems,
    },
    { equals: false }
  );

  const reorderItem = function ({
    startIndex,
    indexOfTarget,
    closestEdgeOfTarget,
  }) {
    const finishIndex = getReorderDestinationIndex({
      startIndex,
      closestEdgeOfTarget,
      indexOfTarget,
      axis: "vertical",
    });

    if (finishIndex === startIndex) {
      // If there would be no change, we skip the update
      return;
    }

    setListState((prev) => {
      return {
        items: reorder({
          list: JSON.parse(JSON.stringify(prev.items)),
          startIndex,
          finishIndex,
        }),
      };
    });
  };

  createEffect(() => {
    monitorForElements({
      // form getInitialData
      canMonitor({ source }) {
        return isItemData(source.data);
      },

      onDrop({ location, source }) {
        const target = location.current.dropTargets[0];
        if (!target) {
          return;
        }

        const sourceData = source.data;
        const targetData = target.data;

        if (!isItemData(sourceData) || !isItemData(targetData)) {
          return;
        }

        const indexOfTarget = listState()?.items.findIndex(
          (item) => item.id === targetData.item.id
        );

        if (indexOfTarget < 0) {
          return;
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData);

        reorderItem({
          startIndex: sourceData.index, // 0
          indexOfTarget, // 1
          closestEdgeOfTarget, // top or bottom
        });
      },
    });
  });

  return (
    <div class="main">
      <div class="todo">
        <For each={listState()?.items}>
          {(item, index) => <ListItem item={item} index={index()} />}
        </For>
      </div>
    </div>
  );
}
