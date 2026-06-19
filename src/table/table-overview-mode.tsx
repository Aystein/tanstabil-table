import { Box, Tooltip } from "@mantine/core";
import type { RowData } from "@tanstack/react-table";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { getCategoricalColor as getFallbackCategoricalColor } from "./category-column/category-column-feature";
import type { CategoryFeatureShape } from "./category-column/types";
import type { NumberFeatureShape } from "./number-column/types";
import { TableHeaderRows } from "./table-grid-headers";
import {
  borderWidth,
  headerTextHeight,
  type OverviewRowHeight,
  type TableInstance,
  type TableRow,
  type TanstabilColumn,
} from "./table-types";

type OverviewColumn<TData extends RowData> = {
  column: TanstabilColumn<TData>;
  kind: "numeric" | "categorical" | "utility";
  left: number;
  pane: "center" | "pinned";
  width: number;
  domain?: [number, number];
};

type OverviewTooltipState = {
  label: string;
  x: number;
  y: number;
};

function getColumnFeature<TData extends RowData>(column: TanstabilColumn<TData>) {
  const featureColumn = column as typeof column & {
    feature?: () => unknown;
  };

  return typeof featureColumn.feature === "function" ? featureColumn.feature() : undefined;
}

function getCategoricalValue(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function hasCategoricalColorScale(
  feature: unknown,
): feature is Pick<CategoryFeatureShape, "getColorScale"> {
  return (
    typeof feature === "object" &&
    feature !== null &&
    "getColorScale" in feature &&
    typeof feature.getColorScale === "function"
  );
}

function getOverviewCategoricalColor<TData extends RowData>(
  column: TanstabilColumn<TData>,
  value: unknown,
) {
  const category = getCategoricalValue(value);
  const feature = getColumnFeature(column);

  if (hasCategoricalColorScale(feature)) {
    const colorScale = feature.getColorScale();

    if (typeof colorScale === "function") {
      return colorScale(category);
    }
  }

  return getFallbackCategoricalColor(category);
}

function hasNumberColorScale(
  feature: unknown,
): feature is Pick<NumberFeatureShape, "getColorScale"> {
  return (
    typeof feature === "object" &&
    feature !== null &&
    "getColorScale" in feature &&
    typeof feature.getColorScale === "function"
  );
}

function getOverviewNumberColor<TData extends RowData>(
  column: TanstabilColumn<TData>,
  value: number,
) {
  const feature = getColumnFeature(column);

  if (hasNumberColorScale(feature)) {
    const colorScale = feature.getColorScale();

    if (typeof colorScale === "function") {
      return colorScale(value);
    }
  }

  return "black";
}

function stringifyOverviewValue(value: unknown) {
  if (value === undefined) {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
  }

  if (typeof value === "string") {
    return value === "" ? '""' : value;
  }

  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  if (typeof value === "symbol") {
    return value.description ?? value.toString();
  }

  if (typeof value === "function") {
    return "[Function]";
  }

  try {
    return JSON.stringify(value) ?? Object.prototype.toString.call(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function getCssVarValue(element: Element, name: string, fallback: string) {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function getPixelSnap(ratio: number) {
  const devicePixel = 1 / ratio;

  return {
    position: (value: number) => Math.round(value * ratio) / ratio,
    size: (value: number) => Math.max(devicePixel, Math.round(value * ratio) / ratio),
    devicePixel,
  };
}

function getNumberDomain<TData extends RowData>(
  rows: TableRow<TData>[],
  columnId: string,
): [number, number] | undefined {
  let min = Infinity;
  let max = -Infinity;

  for (const row of rows) {
    const value = row.getValue<unknown>(columnId);

    if (typeof value !== "number" || Number.isNaN(value)) {
      continue;
    }

    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return min === Infinity || max === -Infinity ? undefined : [min, max];
}

function getOverviewColumnKind<TData extends RowData>(column: TanstabilColumn<TData>) {
  const columnType = column.columnDef.columnType;

  if (columnType === "number") {
    return "numeric";
  }

  if (columnType === undefined) {
    return "utility";
  }

  return "categorical";
}

function getOverviewColumns<TData extends RowData>({
  centerColumns,
  leftWidth,
  rows,
}: {
  centerColumns: TanstabilColumn<TData>[];
  leftWidth: number;
  rows: TableRow<TData>[];
}) {
  const overviewColumns = centerColumns.map((column) => ({
    column,
    left: leftWidth + column.getStart("center"),
  }));

  return overviewColumns.map(({ column, left }) => {
    const kind = getOverviewColumnKind(column);
    const width = column.getSize();

    return {
      column,
      domain: kind === "numeric" ? getNumberDomain(rows, column.id) : undefined,
      kind,
      left,
      pane: "center",
      width: Math.max(0, width),
    } satisfies OverviewColumn<TData>;
  });
}

function getPinnedOverviewColumns<TData extends RowData>({
  instance,
  rows,
  viewportWidth,
}: {
  instance: TableInstance<TData>;
  rows: TableRow<TData>[];
  viewportWidth: number;
}) {
  const leftColumns = instance.getLeftVisibleLeafColumns().map((column) => ({
    column,
    left: column.getStart("left"),
  }));
  const rightWidth = instance.getRightTotalSize();
  const rightStart = viewportWidth - rightWidth;
  const rightColumns = instance.getRightVisibleLeafColumns().map((column) => ({
    column,
    left: rightStart + column.getStart("right"),
  }));

  return [...leftColumns, ...rightColumns].map(({ column, left }) => {
    const kind = getOverviewColumnKind(column);
    const width = column.getSize();

    return {
      column,
      domain: kind === "numeric" ? getNumberDomain(rows, column.id) : undefined,
      kind,
      left,
      pane: "pinned",
      width: Math.max(0, width),
    } satisfies OverviewColumn<TData>;
  });
}

function TableOverviewCanvas<TData extends RowData>({
  canvasHeight,
  canvasWidth,
  columns,
  overviewRowHeight,
  rows,
  scrollElement,
}: {
  canvasHeight: number;
  canvasWidth: number;
  columns: OverviewColumn<TData>[];
  overviewRowHeight: OverviewRowHeight;
  rows: TableRow<TData>[];
  scrollElement: HTMLDivElement | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tooltipAnchorRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [tooltip, setTooltip] = useState<OverviewTooltipState | null>(null);
  const width = Math.max(canvasWidth, 1);
  const height = Math.max(canvasHeight, 1);

  const drawStateRef = useRef({
    columns,
    height,
    overviewRowHeight,
    rows,
    width,
  });

  drawStateRef.current = {
    columns,
    height,
    overviewRowHeight,
    rows,
    width,
  };

  function drawCanvas({
    currentHorizontalScrollOffset = scrollElement?.scrollLeft ?? 0,
    currentScrollOffset = scrollElement?.scrollTop ?? 0,
  }: {
    currentHorizontalScrollOffset?: number;
    currentScrollOffset?: number;
  } = {}) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const { columns, height, overviewRowHeight, rows, width } = drawStateRef.current;

    const ratio = window.devicePixelRatio || 1;
    const pixelWidth = Math.max(1, Math.ceil(width * ratio));
    const pixelHeight = Math.max(1, Math.ceil(height * ratio));

    if (canvas.width !== pixelWidth) {
      canvas.width = pixelWidth;
    }

    if (canvas.height !== pixelHeight) {
      canvas.height = pixelHeight;
    }

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    const background = getCssVarValue(canvas, "--color-background", "white");
    const border = getCssVarValue(canvas, "--color-border", "hsl(0 0% 88%)");
    const muted = getCssVarValue(canvas, "--color-muted", "hsl(0 0% 96%)");

    ctx.resetTransform();
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const snap = getPixelSnap(ratio);
    const rowPixelHeight = snap.size(overviewRowHeight);
    const firstRowIndex = Math.max(0, Math.floor(currentScrollOffset / overviewRowHeight) - 1);
    const lastRowIndex = Math.min(
      rows.length,
      Math.ceil((currentScrollOffset + height) / overviewRowHeight) + 1,
    );

    for (const overviewColumn of columns) {
      const { column, domain, kind, pane } = overviewColumn;
      const rawLeft =
        pane === "center"
          ? overviewColumn.left - currentHorizontalScrollOffset
          : overviewColumn.left;
      const width = snap.size(overviewColumn.width);
      const left = snap.position(rawLeft);

      if (width <= 0 || left >= drawStateRef.current.width || left + width <= 0) {
        continue;
      }

      ctx.fillStyle = border;
      ctx.fillRect(left + width - snap.devicePixel, 0, snap.devicePixel, height);

      if (kind === "utility") {
        ctx.fillStyle = muted;
        ctx.fillRect(left, 0, Math.max(width - snap.devicePixel, 0), height);
        continue;
      }

      for (let rowIndex = firstRowIndex; rowIndex < lastRowIndex; rowIndex++) {
        const row = rows[rowIndex];

        if (!row) {
          continue;
        }

        const value = row.getValue<unknown>(column.id);
        const y = snap.position(rowIndex * overviewRowHeight - currentScrollOffset);

        if (kind === "numeric") {
          ctx.fillStyle = muted;
          ctx.fillRect(left, y, Math.max(width - snap.devicePixel, 0), rowPixelHeight);

          if (typeof value !== "number" || Number.isNaN(value) || !domain) {
            continue;
          }

          const [min, max] = domain;
          const progress = max === min ? 1 : (value - min) / (max - min);
          const barWidth = snap.size(
            (width - snap.devicePixel) * Math.max(0, Math.min(1, progress)),
          );

          ctx.fillStyle = getOverviewNumberColor(column, value);
          ctx.fillRect(left, y, barWidth, rowPixelHeight);
          continue;
        }

        if (Array.isArray(value)) {
          const values = value.length > 0 ? value : ["(missing)"];
          const stripeWidth = snap.size((width - snap.devicePixel) / values.length);

          values.forEach((entry, index) => {
            ctx.fillStyle = getOverviewCategoricalColor(column, entry);
            ctx.fillRect(snap.position(left + index * stripeWidth), y, stripeWidth, rowPixelHeight);
          });
          continue;
        }

        ctx.fillStyle = getOverviewCategoricalColor(column, value);
        ctx.fillRect(left, y, Math.max(width - snap.devicePixel, 0), rowPixelHeight);
      }
    }
  }

  function getHoveredTooltip(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return null;
    }

    const bounds = canvas.getBoundingClientRect();
    const localX = event.clientX - bounds.left;
    const localY = event.clientY - bounds.top;
    const currentHorizontalScrollOffset = scrollElement?.scrollLeft ?? 0;
    const currentScrollOffset = scrollElement?.scrollTop ?? 0;
    const rowIndex = Math.floor((currentScrollOffset + localY) / overviewRowHeight);
    const row = rows[rowIndex];

    if (!row || localX < 0 || localY < 0 || localX > bounds.width || localY > bounds.height) {
      return null;
    }

    const hoveredColumn = [...columns].reverse().find((overviewColumn) => {
      const left =
        overviewColumn.pane === "center"
          ? overviewColumn.left - currentHorizontalScrollOffset
          : overviewColumn.left;

      return localX >= left && localX < left + overviewColumn.width;
    });

    if (!hoveredColumn) {
      return null;
    }

    return {
      label: stringifyOverviewValue(row.getValue<unknown>(hoveredColumn.column.id)),
      x: event.clientX,
      y: event.clientY,
    } satisfies OverviewTooltipState;
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const nextTooltip = getHoveredTooltip(event);

    if (!nextTooltip) {
      setTooltip(null);
      return;
    }

    setTooltip((currentTooltip) =>
      currentTooltip?.label === nextTooltip.label &&
      currentTooltip.x === nextTooltip.x &&
      currentTooltip.y === nextTooltip.y
        ? currentTooltip
        : nextTooltip,
    );
  }

  useLayoutEffect(() => {
    drawCanvas();
  }, [columns, height, overviewRowHeight, rows, width]);

  useEffect(() => {
    if (!scrollElement) {
      return;
    }

    function drawOnNextFrame() {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        drawCanvas({
          currentHorizontalScrollOffset: scrollElement?.scrollLeft ?? 0,
          currentScrollOffset: scrollElement?.scrollTop ?? 0,
        });
      });
    }

    scrollElement.addEventListener("scroll", drawOnNextFrame, { passive: true });

    return () => {
      scrollElement.removeEventListener("scroll", drawOnNextFrame);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [scrollElement]);

  return (
    <>
      <Tooltip
        disabled={!tooltip}
        label={tooltip?.label}
        multiline
        offset={10}
        opened={!!tooltip}
        position="right"
        target={tooltipAnchorRef}
        withinPortal
      />
      <Box
        ref={tooltipAnchorRef}
        aria-hidden
        style={{
          height: 1,
          left: tooltip?.x ?? -1000,
          pointerEvents: "none",
          position: "fixed",
          top: tooltip?.y ?? -1000,
          width: 1,
        }}
      />
      <canvas
        ref={canvasRef}
        data-overview-canvas="true"
        onPointerLeave={() => setTooltip(null)}
        onPointerMove={handlePointerMove}
        style={{
          display: "block",
          height,
          width,
        }}
      />
    </>
  );
}

export function OverviewMode<TData extends RowData>({
  instance,
  overviewRowHeight,
}: {
  instance: TableInstance<TData>;
  overviewRowHeight: OverviewRowHeight;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const visibleRows = instance.getRowModel().rows;
  const leftHeaders = instance.getLeftLeafHeaders();
  const rightHeaders = instance.getRightLeafHeaders();
  const leftWidth = instance.getLeftTotalSize();
  const centerWidth = instance.getCenterTotalSize();
  const rightWidth = instance.getRightTotalSize();
  const centerColumns = instance.getCenterVisibleLeafColumns();
  const centerHeaders = instance.getCenterLeafHeaders();
  const filterHeight = instance.atoms.filterHeight.get();
  const tableHeaderHeight = headerTextHeight + filterHeight + borderWidth;
  const totalWidth = leftWidth + centerWidth + rightWidth;

  (instance.options.rowVirtualizerRef as { current: unknown }).current = undefined;

  useLayoutEffect(() => {
    const element = viewportRef.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      const nextSize = {
        height: element.clientHeight,
        width: element.clientWidth,
      };

      setViewportSize((currentSize) =>
        currentSize.height === nextSize.height && currentSize.width === nextSize.width
          ? currentSize
          : nextSize,
      );
    };
    const resizeObserver = new ResizeObserver(updateSize);

    updateSize();
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const virtualCenterColumns = useMemo(
    () =>
      centerColumns
        .map((column, index) => {
          const header = centerHeaders[index];

          if (!header) {
            return null;
          }

          return {
            column,
            header,
            index,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    [centerColumns, centerHeaders],
  );
  const centerColumnIds = useMemo(() => centerColumns.map((column) => column.id), [centerColumns]);
  const viewportWidth = viewportSize.width || viewportRef.current?.clientWidth || totalWidth;
  const viewportHeight =
    viewportSize.height || viewportRef.current?.clientHeight || tableHeaderHeight;
  const contentHeight = Math.max(
    viewportHeight,
    tableHeaderHeight + visibleRows.length * overviewRowHeight,
  );

  const overviewCanvasHeight = Math.max(1, viewportHeight - tableHeaderHeight);
  const contentWidth = Math.max(totalWidth, viewportWidth);
  const centerContentWidth = Math.max(centerWidth, contentWidth - leftWidth - rightWidth);
  const overviewCenterColumns = useMemo(
    () =>
      getOverviewColumns({
        centerColumns,
        leftWidth,
        rows: visibleRows,
      }),
    [centerColumns, leftWidth, visibleRows],
  );
  const overviewPinnedColumns = useMemo(
    () =>
      getPinnedOverviewColumns({
        instance,
        rows: visibleRows,
        viewportWidth,
      }),
    [instance, viewportWidth, visibleRows],
  );
  const overviewColumns = useMemo(
    () => [...overviewCenterColumns, ...overviewPinnedColumns],
    [overviewCenterColumns, overviewPinnedColumns],
  );

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

        <Box
          style={{
            height: overviewCanvasHeight,
            left: 0,
            position: "sticky",
            top: tableHeaderHeight,
            width: viewportWidth,
            zIndex: 10,
          }}
        >
          <TableOverviewCanvas
            canvasHeight={overviewCanvasHeight}
            canvasWidth={viewportWidth}
            columns={overviewColumns}
            overviewRowHeight={overviewRowHeight}
            rows={visibleRows}
            scrollElement={viewportRef.current}
          />
        </Box>
      </Box>
    </Box>
  );
}
