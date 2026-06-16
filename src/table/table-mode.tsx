import { Box } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import { observeElementOffset, useVirtualizer, type Virtualizer } from "@tanstack/react-virtual";
import { useSelector } from "@tanstack/react-store";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { TableBodyCell } from "./table-cell";
import { getVirtualCenterColumns, TableHeaderRows } from "./table-grid-headers";
import { TableRowBand } from "./table-pane";
import { borderWidth, detailRowHeight, headerTextHeight, type TableInstance } from "./table-types";

const maxNativeScrollHeight = 15_000_000;

function getScrollScale({
  logicalHeight,
  maxNativeHeight,
  viewportHeight,
}: {
  logicalHeight: number;
  maxNativeHeight: number;
  viewportHeight: number;
}) {
  if (logicalHeight <= maxNativeHeight) {
    return 1;
  }

  const logicalScrollableHeight = Math.max(1, logicalHeight - viewportHeight);
  const nativeScrollableHeight = Math.max(1, maxNativeHeight - viewportHeight);

  return Math.max(1, logicalScrollableHeight / nativeScrollableHeight);
}

function getNativeContentHeight(logicalHeight: number, maxNativeHeight: number) {
  return Math.max(1, Math.min(logicalHeight, maxNativeHeight));
}

function useElementHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const updateHeight = () => {
      setHeight(element.clientHeight);
    };
    const resizeObserver = new ResizeObserver(updateHeight);

    updateHeight();
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref]);

  return height;
}

function getVirtualizerScrollScale<TElement extends Element>(
  virtualizer: Virtualizer<TElement, Element>,
) {
  const logicalHeight = virtualizer.getTotalSize();
  const viewportHeight =
    virtualizer.scrollElement?.clientHeight ?? virtualizer.scrollRect?.height ?? 0;

  return getScrollScale({
    logicalHeight,
    maxNativeHeight: maxNativeScrollHeight,
    viewportHeight,
  });
}

function observeScaledElementOffset<TElement extends Element>(): (
  instance: Virtualizer<TElement, Element>,
  callback: (offset: number, isScrolling: boolean) => void,
) => void | (() => void) {
  return (virtualizer, callback) => {
    return observeElementOffset(virtualizer, (offset, isScrolling) => {
      callback(offset * getVirtualizerScrollScale(virtualizer), isScrolling);
    });
  };
}

function scrollToScaledOffset<TElement extends Element>(): (
  offset: number,
  options: { adjustments?: number; behavior?: ScrollBehavior },
  instance: Virtualizer<TElement, Element>,
) => void {
  return (offset, { adjustments = 0, behavior }, virtualizer) => {
    virtualizer.scrollElement?.scrollTo({
      top: (offset + adjustments) / getVirtualizerScrollScale(virtualizer),
      behavior,
    });
  };
}

export function TableMode<TData extends RowData>({ instance }: { instance: TableInstance<TData> }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewportHeight = useElementHeight(viewportRef);
  const visibleRows = instance.getRowModel().rows;
  const leftHeaders = instance.getLeftLeafHeaders();
  const rightHeaders = instance.getRightLeafHeaders();
  const leftWidth = instance.getLeftTotalSize();
  const centerWidth = instance.getCenterTotalSize();
  const rightWidth = instance.getRightTotalSize();
  const centerColumns = instance.getCenterVisibleLeafColumns();
  const centerHeaders = instance.getCenterLeafHeaders();
  const rowHeight = useSelector(instance.atoms.rowHeight);
  const filterHeight = useSelector(instance.atoms.filterHeight);
  const tableHeaderHeight = headerTextHeight + filterHeight + borderWidth;
  const totalWidth = leftWidth + centerWidth + rightWidth;

  const rowVirtualizer = useVirtualizer({
    count: visibleRows.length,
    estimateSize: (index) => {
      const row = visibleRows[index];

      if (row && !row.getIsGrouped() && row.getIsExpanded()) {
        return rowHeight + detailRowHeight;
      }

      return rowHeight;
    },
    getScrollElement: () => viewportRef.current,
    observeElementOffset: observeScaledElementOffset(),
    overscan: 5,
    paddingStart: tableHeaderHeight,
    scrollToFn: scrollToScaledOffset(),
  });

  instance.options.rowVirtualizerRef.current = rowVirtualizer;

  const columnVirtualizer = useVirtualizer({
    count: centerColumns.length,
    estimateSize: (index) => centerColumns[index]?.getSize() ?? 0,
    getScrollElement: () => viewportRef.current,
    horizontal: true,
    overscan: 2,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [rowHeight, rowVirtualizer]);

  // Invalidate measurements when height of rows change (through expanding for instance)
  useEffect(() => {
    const options = instance.atoms.expanded.subscribe(() => {
      rowVirtualizer.measure();
    });

    return () => {
      options.unsubscribe();
    };
  }, [instance.atoms.expanded, rowVirtualizer]);

  const virtualCenterColumns = getVirtualCenterColumns({
    centerColumns,
    centerHeaders,
    virtualColumns: columnVirtualizer.getVirtualItems(),
  });
  const virtualCenterColumnIds = useMemo(
    () => new Set(virtualCenterColumns.map((entry) => entry.column.id)),
    [virtualCenterColumns],
  );
  const centerColumnIds = useMemo(() => centerColumns.map((column) => column.id), [centerColumns]);
  const virtualRows = rowVirtualizer.getVirtualItems();
  const logicalContentHeight = rowVirtualizer.getTotalSize();
  const scrollScale = getScrollScale({
    logicalHeight: logicalContentHeight,
    maxNativeHeight: maxNativeScrollHeight,
    viewportHeight,
  });
  const contentHeight = getNativeContentHeight(logicalContentHeight, maxNativeScrollHeight);
  const logicalScrollOffset = rowVirtualizer.scrollOffset ?? 0;
  const nativeScrollOffset = viewportRef.current?.scrollTop ?? logicalScrollOffset / scrollScale;
  const viewportWidth =
    columnVirtualizer.scrollRect?.width ?? viewportRef.current?.clientWidth ?? totalWidth;
  const contentWidth = Math.max(totalWidth, viewportWidth);
  const centerContentWidth = Math.max(centerWidth, contentWidth - leftWidth - rightWidth);

  return (
    <Box ref={viewportRef} style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      <Box
        style={{
          height: contentHeight,
          position: "relative",
          width: contentWidth,
        }}
      >
        <TableHeaderRows
          centerColumnIds={centerColumnIds}
          centerContentWidth={centerContentWidth}
          contentWidth={contentWidth}
          instance={instance}
          leftHeaders={leftHeaders}
          leftWidth={leftWidth}
          rightHeaders={rightHeaders}
          rightWidth={rightWidth}
          scrollElementRef={viewportRef}
          virtualCenterColumns={virtualCenterColumns}
        />

        {virtualRows.map((virtualRow) => {
          const row = visibleRows[virtualRow.index];

          if (!row) {
            return null;
          }

          const hasDetail = !row.getIsGrouped() && row.getIsExpanded();

          return (
            <TableRowBand
              key={row.id}
              row={row}
              top={nativeScrollOffset + virtualRow.start - logicalScrollOffset}
              virtualRow={virtualRow}
              width={contentWidth}
            >
              {leftWidth > 0 ? (
                <Box
                  style={{
                    background: "var(--row-bg)",
                    height: "100%",
                    left: 0,
                    position: "sticky",
                    width: leftWidth,
                    zIndex: 20,
                  }}
                >
                  {row.getLeftVisibleCells().map((cell) => (
                    <TableBodyCell key={cell.id} cell={cell} instance={instance} pane="left" />
                  ))}
                  <Box
                    aria-hidden
                    style={{
                      background: "var(--color-border)",
                      bottom: 0,
                      pointerEvents: "none",
                      position: "absolute",
                      right: 0,
                      top: 0,
                      width: 1,
                      zIndex: 30,
                    }}
                  />
                </Box>
              ) : null}

              <Box
                style={{
                  height: virtualRow.size,
                  left: leftWidth,
                  position: "absolute",
                  top: 0,
                  width: centerContentWidth,
                }}
              >
                {row
                  .getCenterVisibleCells()
                  .filter((cell) => virtualCenterColumnIds.has(cell.column.id))
                  .map((cell) => (
                    <TableBodyCell key={cell.id} cell={cell} instance={instance} pane="center" />
                  ))}
              </Box>

              {hasDetail ? (
                <Box
                  style={{
                    background: "color-mix(in oklab, var(--color-muted) 20%, transparent)",
                    borderTop: "1px solid var(--color-border)",
                    color: "var(--color-muted-foreground)",
                    height: detailRowHeight,
                    left: 0,
                    padding: "0.5rem 0.75rem",
                    position: "absolute",
                    top: rowHeight,
                    width: contentWidth,
                    zIndex: 40,
                  }}
                >
                  test
                </Box>
              ) : null}

              {rightWidth > 0 ? (
                <Box
                  style={{
                    background: "var(--row-bg)",
                    height: "100%",
                    marginLeft: "auto",
                    position: "sticky",
                    right: 0,
                    width: rightWidth,
                    zIndex: 20,
                  }}
                >
                  {row.getRightVisibleCells().map((cell) => (
                    <TableBodyCell key={cell.id} cell={cell} instance={instance} pane="right" />
                  ))}
                  <Box
                    aria-hidden
                    style={{
                      background: "var(--color-border)",
                      bottom: 0,
                      left: 0,
                      pointerEvents: "none",
                      position: "absolute",
                      top: 0,
                      width: 1,
                      zIndex: 30,
                    }}
                  />
                </Box>
              ) : null}
            </TableRowBand>
          );
        })}
      </Box>
    </Box>
  );
}
