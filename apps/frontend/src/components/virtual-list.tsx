import {
  createEffect,
  createSignal,
  createMemo,
  For,
  JSX,
  onCleanup,
  onMount,
} from "solid-js";
import { Dynamic } from "solid-js/web";

export interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => JSX.Element;
  itemEstimatedSize?: number;
  overscan?: number;
  topPadding?: number;
  bottomPadding?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
  style?: any;
}

export function VirtualList<T>(props: VirtualListProps<T>) {
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  const [visibleRange, setVisibleRange] = createSignal({ start: 0, end: 0 });
  const [sizes, setSizes] = createSignal<Map<number, number>>(new Map());
  const [totalHeight, setTotalHeight] = createSignal(0);
  const [scrollTop, setScrollTop] = createSignal(0);
  const [isScrolling, setIsScrolling] = createSignal(false);
  const [previousItemsLength, setPreviousItemsLength] = createSignal(0);
  let scrollTimeout: number;
  let resizeObserver: ResizeObserver | null = null;
  const itemRefs = new Map<number, HTMLElement>();
  const processedIds = new Set<string | number>();

  const defaultProps = {
    itemEstimatedSize: 50,
    overscan: 3,
    topPadding: 0,
    bottomPadding: 0,
    endReachedThreshold: 250,
  };

  const options = { ...defaultProps, ...props };

  // Cache offset calculations to improve performance
  const offsetCache = new Map<number, number>();

  const clearOffsetCache = () => {
    offsetCache.clear();
  };

  const updateSizes = (index: number, size: number) => {
    const currentSize = sizes().get(index);
    if (currentSize === size) return;

    setSizes((prev) => {
      const next = new Map(prev);
      next.set(index, size);
      return next;
    });

    // Clear offset cache since sizes have changed
    clearOffsetCache();

    // Recalculate layout after size update to ensure accuracy
    requestAnimationFrame(() => {
      calculateTotalHeight();
      calculateRange();
    });
  };

  const getItemSize = (index: number) => {
    return sizes().get(index) || options.itemEstimatedSize;
  };

  const getItemOffset = (index: number) => {
    // Check cache first
    if (offsetCache.has(index)) {
      return offsetCache.get(index)!;
    }

    // Calculate offset and cache it
    let offset = options.topPadding;
    for (let i = 0; i < index; i++) {
      offset += getItemSize(i);
    }

    offsetCache.set(index, offset);
    return offset;
  };

  const calculateTotalHeight = () => {
    let height = options.topPadding;
    for (let i = 0; i < props.items.length; i++) {
      height += getItemSize(i);
    }
    height += options.bottomPadding;
    setTotalHeight(height);
    return height;
  };

  const calculateRange = () => {
    const container = containerRef();
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    setScrollTop(currentScrollTop);

    let startIndex = 0;
    let currentOffset = options.topPadding;

    // Find start index using binary search for better performance with large lists
    let low = 0;
    let high = props.items.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = getItemOffset(mid);
      const size = getItemSize(mid);

      if (offset < currentScrollTop && offset + size <= currentScrollTop) {
        low = mid + 1;
      } else if (offset >= currentScrollTop) {
        high = mid - 1;
      } else {
        startIndex = mid;
        break;
      }
    }

    if (low > high) {
      startIndex = low;
    }

    // Ensure we don't miss any items by starting from a safe position
    startIndex = Math.max(0, startIndex - 1);

    // Find end index
    let endIndex = startIndex;
    let visibleHeight = 0;
    const targetHeight =
      container.clientHeight + options.overscan * options.itemEstimatedSize;

    while (endIndex < props.items.length && visibleHeight < targetHeight) {
      visibleHeight += getItemSize(endIndex);
      endIndex++;
    }

    // Ensure we have at least a minimal range to render
    if (endIndex - startIndex < 3) {
      endIndex = Math.min(props.items.length, startIndex + 10);
    }

    const rangeStart = Math.max(0, startIndex - options.overscan);
    const rangeEnd = Math.min(props.items.length, endIndex + options.overscan);

    setVisibleRange({
      start: rangeStart,
      end: rangeEnd,
    });

    // Check if we need to fetch more data
    if (
      props.onEndReached &&
      !isScrolling() &&
      currentScrollTop + container.clientHeight + options.endReachedThreshold >=
        totalHeight()
    ) {
      props.onEndReached();
    }
  };

  const handleScroll = () => {
    setIsScrolling(true);
    window.clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      setIsScrolling(false);

      // Check if we need to load more after scrolling stops
      const container = containerRef();
      if (container && props.onEndReached) {
        const currentScrollTop = container.scrollTop;
        if (
          currentScrollTop +
            container.clientHeight +
            options.endReachedThreshold >=
          totalHeight()
        ) {
          props.onEndReached();
        }
      }
    }, 150);

    requestAnimationFrame(calculateRange);
  };

  const setupResizeObserver = () => {
    if (!resizeObserver && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        let needsUpdate = false;

        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const index = element.dataset.index
            ? parseInt(element.dataset.index, 10)
            : -1;

          if (index >= 0) {
            const newSize = entry.contentRect.height;
            const currentSize = getItemSize(index);

            if (Math.abs(newSize - currentSize) > 1) {
              updateSizes(index, newSize);
              needsUpdate = true;
            }
          }
        }

        if (needsUpdate) {
          calculateTotalHeight();
          calculateRange();
        }
      });
    }

    return resizeObserver;
  };

  // Clean up observers for items no longer in the list
  const cleanupItemObservers = () => {
    if (!resizeObserver) return;

    const currentItems = new Set();
    // Track current visible items
    for (let i = visibleRange().start; i < visibleRange().end; i++) {
      currentItems.add(i);
    }

    // Unobserve items no longer in view, but keep recent ones in case we scroll back
    const bufferSize = 50; // Keep a buffer of items
    const start = Math.max(0, visibleRange().start - bufferSize);
    const end = Math.min(props.items.length, visibleRange().end + bufferSize);

    for (let i = start; i < end; i++) {
      currentItems.add(i);
    }

    // Unobserve items outside buffer zone
    itemRefs.forEach((el, index) => {
      if (!currentItems.has(index)) {
        resizeObserver?.unobserve(el);
        itemRefs.delete(index);
      }
    });
  };

  onMount(() => {
    const container = containerRef();
    if (container) {
      container.addEventListener("scroll", handleScroll);
      calculateRange();
    }

    setupResizeObserver();
  });

  onCleanup(() => {
    const container = containerRef();
    if (container) {
      container.removeEventListener("scroll", handleScroll);
    }
    window.clearTimeout(scrollTimeout);

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    itemRefs.clear();
    offsetCache.clear();
    processedIds.clear();
  });

  createEffect(() => {
    // Force dependency tracking on items length
    const itemsLength = props.items.length;

    // Track if items were added
    const itemsAdded = itemsLength > previousItemsLength();
    setPreviousItemsLength(itemsLength);

    // Reset size cache when items change drastically
    if (
      sizes().size > 0 &&
      Math.abs(sizes().size - itemsLength) > itemsLength * 0.5
    ) {
      setSizes(new Map());
      clearOffsetCache();
    }

    // Always recalculate when items change
    calculateTotalHeight();
    calculateRange();

    // If new items were added, clean up less frequently to ensure
    // we don't lose rendered items when scrolling back
    if (!itemsAdded || itemsLength % 30 === 0) {
      cleanupItemObservers();
    }
  });

  // Combine user classes with default classes
  const containerClass = createMemo(() => {
    const baseClasses =
      "h-full overflow-auto relative scrollbar scrollbar-track-color-transparent scrollbar-thumb-color-accent/50 scrollbar-rounded scrollbar-w-3px scrollbar-h-3px scrollbar-radius-2 scrollbar-track-radius-4 scrollbar-thumb-radius-4";
    return props.className ? `${baseClasses} ${props.className}` : baseClasses;
  });

  return (
    <div ref={setContainerRef} class={containerClass()} style={props.style}>
      <div class="relative" style={{ height: `${totalHeight()}px` }}>
        <For each={props.items.slice(visibleRange().start, visibleRange().end)}>
          {(item, index) => {
            const actualIndex = () => index() + visibleRange().start;
            const itemOffset = createMemo(() => getItemOffset(actualIndex()));

            return (
              <div
                class="absolute left-0 right-0"
                style={{
                  top: `${itemOffset()}px`,
                }}
                data-index={actualIndex()}
                data-virtual-index={actualIndex()}
                ref={(el) => {
                  if (el) {
                    // Store reference to the element
                    itemRefs.set(actualIndex(), el);

                    // Measure item size
                    const size = el.getBoundingClientRect().height;
                    if (Math.abs(size - getItemSize(actualIndex())) > 1) {
                      updateSizes(actualIndex(), size);
                    }

                    // Observe element for size changes
                    if (resizeObserver) {
                      resizeObserver.observe(el);
                    }
                  }
                }}
              >
                {props.renderItem(item, actualIndex())}
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
