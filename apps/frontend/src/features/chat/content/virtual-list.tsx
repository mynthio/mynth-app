import {
  createSignal,
  createMemo,
  onMount,
  onCleanup,
  JSX,
  Component,
  createEffect,
  untrack,
  batch,
  For,
} from "solid-js";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  getKey: (item: T) => string | number;
  estimateHeight?: number;
  overscan?: number;
  setControlFunctions?: (controls: { scrollToBottom: () => void }) => void;
  // Props for infinite scroll
  onLoadMore?: () => void;
  loadMoreThreshold?: number;
}

interface ItemMetadata {
  height: number;
  offset: number;
  key: string | number;
}

const VirtualList: Component<VirtualListProps<any>> = <T,>(
  props: VirtualListProps<T>
) => {
  const containerRef: { current?: HTMLDivElement } = {};
  const [scrollTop, setScrollTop] = createSignal(0);
  const [containerHeight, setContainerHeight] = createSignal(0);
  const [measuredHeights, setMeasuredHeights] = createSignal<
    Record<string | number, number>
  >({});
  const DEFAULT_HEIGHT = props.estimateHeight || 100;
  const OVERSCAN = props.overscan || 3;
  // Default threshold for triggering onLoadMore
  const LOAD_MORE_THRESHOLD = props.loadMoreThreshold ?? 200;

  // Track item metadata with positions
  const itemsMetadata = createMemo(() => {
    const heights = measuredHeights();
    let offset = 0;
    return props.items.map((item) => {
      const key = props.getKey(item);
      const height = heights[key] || DEFAULT_HEIGHT;
      const metadata: ItemMetadata = {
        key,
        height,
        offset,
      };
      offset += height;
      return metadata;
    });
  });

  const totalHeight = createMemo(() => {
    const metadata = itemsMetadata();
    if (metadata.length === 0) return 0;
    const last = metadata[metadata.length - 1];
    return last.offset + last.height;
  });

  // Function to scroll to the bottom
  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    containerRef.current?.scrollTo({ top: totalHeight(), behavior });
  };

  // Calculate visible range using binary search
  const visibleRange = createMemo(() => {
    const st = scrollTop();
    const ch = containerHeight();
    const metadata = itemsMetadata();

    let start = 0;
    let end = metadata.length - 1;

    // Find first visible item
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      if (metadata[mid].offset + metadata[mid].height < st) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    const firstVisible = Math.max(0, start - 1);

    // Find last visible item
    end = metadata.length - 1;
    const viewportBottom = st + ch;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      if (metadata[mid].offset < viewportBottom) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    const lastVisible = Math.min(metadata.length - 1, end + 1);

    return {
      start: Math.max(0, firstVisible - OVERSCAN),
      end: Math.min(metadata.length - 1, lastVisible + OVERSCAN),
    };
  });

  // Handle scroll events
  const handleScroll = () => {
    if (containerRef.current) {
      const currentScrollTop = containerRef.current.scrollTop;
      setScrollTop(currentScrollTop);

      // Check for reaching the top
      if (props.onLoadMore && currentScrollTop < LOAD_MORE_THRESHOLD) {
        // Parent component is responsible for handling loading state
        // to prevent multiple calls
        props.onLoadMore();
      }
    }
  };

  // Handle resize observer
  let resizeObserver: ResizeObserver;
  onMount(() => {
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === containerRef.current) {
            setContainerHeight(entry.contentRect.height);
          }
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    // Initial container height
    setContainerHeight(containerRef.current?.offsetHeight || 0);

    // Pass control functions up to the parent
    props.setControlFunctions?.({
      scrollToBottom: (behavior: ScrollBehavior = "smooth") =>
        scrollToBottom(behavior),
    });

    // Initial scroll to bottom
    // Use a timeout to ensure layout calculation has a chance to run
    // based on initial estimates before scrolling.
    // A microtask might be too soon.
    setTimeout(() => scrollToBottom(), 0);
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
  });

  // Track item elements and measure heights
  const measureRef = (el: HTMLDivElement, item: T) => {
    const key = props.getKey(item);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;
        batch(() => {
          setMeasuredHeights((prev) => {
            if (prev[key] === newHeight) return prev;
            return { ...prev, [key]: newHeight };
          });
        });
      }
    });
    ro.observe(el);
    onCleanup(() => ro.disconnect());
  };

  return (
    <div
      ref={containerRef.current!}
      style={{
        overflow: "auto",
        height: "100%",
        position: "relative",
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${totalHeight()}px`,
          position: "relative",
        }}
      >
        <For
          each={props.items.slice(visibleRange().start, visibleRange().end + 1)}
        >
          {(item, index) => {
            const i = index() + visibleRange().start;
            // Memoize the metadata for this specific item index
            // This ensures the style updates when itemsMetadata changes
            const metadata = createMemo(() => itemsMetadata()[i]);

            // Handle potential undefined metadata during rapid updates
            if (!metadata()) return null;

            return (
              <div
                ref={(el) => measureRef(el, item)}
                style={{
                  position: "absolute",
                  // Use the reactive memoized value
                  top: `${metadata().offset}px`,
                  width: "100%",
                }}
              >
                {props.renderItem(item, i)}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default VirtualList;
