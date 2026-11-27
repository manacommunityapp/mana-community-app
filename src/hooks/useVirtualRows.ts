import { useState, useCallback, useMemo, useRef, type UIEvent } from "react";

export interface VirtualWindowResult {
  startIndex: number;
  endIndex: number;
  topSpacerHeight: number;
  bottomSpacerHeight: number;
  isVirtualized: boolean;
}

export interface ComputeVirtualWindowParams {
  totalCount: number;
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  overscan?: number;
  virtualizeThreshold?: number;
}

/**
 * Pure calculation for fixed-height row windowing. Keeps HTML table layout
 * valid with top/bottom spacer rows while capping mounted DOM nodes to
 * viewport + overscan even on 10,000+ billing/visitor records.
 */
export function computeVirtualWindow({
  totalCount,
  scrollTop,
  viewportHeight,
  rowHeight,
  overscan = 6,
  virtualizeThreshold = 50,
}: ComputeVirtualWindowParams): VirtualWindowResult {
  if (totalCount <= 0 || rowHeight <= 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
      isVirtualized: false,
    };
  }

  if (totalCount < virtualizeThreshold) {
    return {
      startIndex: 0,
      endIndex: totalCount,
      topSpacerHeight: 0,
      bottomSpacerHeight: 0,
      isVirtualized: false,
    };
  }

  const safeScrollTop = Math.max(0, scrollTop);
  const safeViewport = Math.max(rowHeight, viewportHeight);

  const visibleStart = Math.floor(safeScrollTop / rowHeight);
  const visibleCount = Math.ceil(safeViewport / rowHeight);

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(totalCount, visibleStart + visibleCount + overscan);

  return {
    startIndex,
    endIndex,
    topSpacerHeight: startIndex * rowHeight,
    bottomSpacerHeight: Math.max(0, (totalCount - endIndex) * rowHeight),
    isVirtualized: true,
  };
}

export interface UseVirtualRowsOptions {
  rowHeight: number;
  viewportHeight?: number;
  overscan?: number;
  virtualizeThreshold?: number;
}

export function useVirtualRows<T>(items: readonly T[], options: UseVirtualRowsOptions) {
  const {
    rowHeight,
    viewportHeight: defaultViewportHeight = 520,
    overscan = 6,
    virtualizeThreshold = 50,
  } = options;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const onScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setScrollTop(nextTop);
  }, []);

  const measuredHeight = containerRef.current?.clientHeight || defaultViewportHeight;

  const windowMeta = useMemo(
    () =>
      computeVirtualWindow({
        totalCount: items.length,
        scrollTop,
        viewportHeight: measuredHeight,
        rowHeight,
        overscan,
        virtualizeThreshold,
      }),
    [items.length, scrollTop, measuredHeight, rowHeight, overscan, virtualizeThreshold]
  );

  const visibleItems = useMemo(
    () => items.slice(windowMeta.startIndex, windowMeta.endIndex),
    [items, windowMeta.startIndex, windowMeta.endIndex]
  );

  return {
    containerRef,
    onScroll,
    visibleItems,
    ...windowMeta,
  };
}
