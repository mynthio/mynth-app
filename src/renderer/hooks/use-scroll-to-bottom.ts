import * as React from "react";

const BOTTOM_THRESHOLD = 100; // px from bottom considered "at bottom"

/**
 * Manages scroll-to-bottom behaviour for a chat-like container.
 *
 * - Scrolls to bottom instantly on mount.
 * - While `isStreaming`: auto-scrolls as content grows.
 * - User scrolling up during streaming disables auto-scroll for that session.
 * - Auto-scroll re-enables automatically at the start of the next session.
 *
 * Attach `containerRef` to the scrollable element and `anchorRef` to an
 * empty `<div>` placed at the very end of the scrollable content.
 */
export function useScrollToBottom(isStreaming: boolean): {
  containerRef: React.RefObject<HTMLDivElement>;
  anchorRef: React.RefObject<HTMLDivElement>;
  scrollToBottom: () => void;
} {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const scrollToBottom = React.useCallback(() => {
    const el = containerRef.current;

    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Mutable refs so effect closures never go stale without re-subscribing.
  const shouldStickRef = React.useRef(true);
  const isStreamingRef = React.useRef(isStreaming);
  const prevIsStreamingRef = React.useRef(false);

  // Keep streaming state in sync and re-enable sticking on each new session.
  React.useLayoutEffect(() => {
    const wasStreaming = prevIsStreamingRef.current;
    prevIsStreamingRef.current = isStreaming;
    isStreamingRef.current = isStreaming;

    if (isStreaming && !wasStreaming) {
      shouldStickRef.current = true;
    }
  });

  // Scroll to absolute bottom on mount (instant, before paint).
  React.useLayoutEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Disable sticking when the user scrolls up during an active stream.
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (!isStreamingRef.current) return;
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (dist > BOTTOM_THRESHOLD) {
        shouldStickRef.current = false;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Observe the content wrapper (anchor's parent) for size changes and
  // scroll to bottom whenever content grows while sticking is enabled.
  React.useEffect(() => {
    const contentEl = anchorRef.current?.parentElement;
    if (!contentEl) return;

    const observer = new ResizeObserver(() => {
      if (shouldStickRef.current) {
        scrollToBottom();
      }
    });

    observer.observe(contentEl);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { containerRef, anchorRef, scrollToBottom };
}
