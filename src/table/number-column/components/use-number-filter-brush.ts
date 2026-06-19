import type { Bin, ScaleLinear } from "d3";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { useGesture } from "@use-gesture/react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RowData } from "@tanstack/react-table";
import type { PixelSnappedBarX } from "../../features/histogram/histogram-layout";
import { getNumberBinId } from "../number-column-def";
import type { FilterValue, NumberColumn } from "../types";

const inputFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 6,
  useGrouping: false,
});
const EMPTY_BIN_IDS: string[] = [];

type DragState =
  | {
      type: "create" | "min" | "max" | "move";
      startX: number;
      startMin: number;
      startMax: number;
      startedOnBrush: boolean;
    }
  | undefined;

type BrushRange =
  | {
      min: number | undefined;
      max: number | undefined;
    }
  | undefined;

type BinFilterValue = Extract<FilterValue, { mode: "bins" }>;
type BrushLikeFilterValue =
  | Extract<FilterValue, { mode: "brush" }>
  | { min?: number; max?: number };

export function formatInputValue(value: number | undefined) {
  return value === undefined ? "" : inputFormatter.format(value);
}

export function parseInputValue(value: string) {
  const parsedValue = Number(value);

  return value.trim() === "" || !Number.isFinite(parsedValue) ? undefined : parsedValue;
}

function clampValue(value: number, [min, max]: [number, number]) {
  return Math.min(Math.max(value, min), max);
}

function roundValue(value: number) {
  return Number(value.toFixed(6));
}

function isBinFilterValue(filterValue: FilterValue | undefined): filterValue is BinFilterValue {
  return filterValue !== undefined && "mode" in filterValue && filterValue.mode === "bins";
}

function getBrushRange(filterValue: FilterValue | undefined): BrushRange {
  if (filterValue === undefined || isBinFilterValue(filterValue)) {
    return undefined;
  }

  const brushValue = filterValue as BrushLikeFilterValue;

  if (brushValue.min === undefined && brushValue.max === undefined) {
    return undefined;
  }

  return {
    min: brushValue.min,
    max: brushValue.max,
  };
}

function getSelectedBinIds(filterValue: FilterValue | undefined) {
  return isBinFilterValue(filterValue) ? filterValue.binIds : EMPTY_BIN_IDS;
}

function createBrushFilterValue(range: BrushRange): FilterValue | undefined {
  if (range?.min === undefined && range?.max === undefined) {
    return undefined;
  }

  return {
    mode: "brush",
    min: range.min,
    max: range.max,
  };
}

function createBinFilterValue(binIds: string[]): FilterValue | undefined {
  return binIds.length === 0 ? undefined : { mode: "bins", binIds };
}

function normalizeBrushRange(
  nextMin: number | undefined,
  nextMax: number | undefined,
  binDomain: [number, number],
): BrushRange {
  const min = nextMin === undefined ? undefined : roundValue(clampValue(nextMin, binDomain));
  const max = nextMax === undefined ? undefined : roundValue(clampValue(nextMax, binDomain));

  if (min === undefined && max === undefined) {
    return undefined;
  }

  return { min, max };
}

export function getBinIndexForValue(
  value: number,
  bins: Bin<number, number>[],
  binDomain: [number, number],
) {
  return bins.findIndex((bin, index) => {
    const x0 = bin.x0 ?? binDomain[0];
    const x1 = bin.x1 ?? binDomain[1];

    return index === bins.length - 1 ? value >= x0 && value <= x1 : value >= x0 && value < x1;
  });
}

export function getBinIndexForX(x: number, barLayout: PixelSnappedBarX[]) {
  return barLayout.findIndex((bar, index) => {
    const x1 = bar.x + bar.width;

    if (bar.width <= 0) {
      return false;
    }

    return index === barLayout.length - 1 ? x >= bar.x && x <= x1 : x >= bar.x && x < x1;
  });
}

export function useNumberFilterBrush<TData extends RowData>({
  cssBarLayout,
  binDomain,
  bins,
  column,
  xScale,
}: {
  cssBarLayout: PixelSnappedBarX[];
  binDomain: [number, number];
  bins: Bin<number, number>[];
  column: NumberColumn<TData>;
  xScale: ScaleLinear<number, number>;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStateRef = useRef<DragState>(undefined);
  const suppressClickUntilRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredBinIndex, setHoveredBinIndex] = useState<number | undefined>(undefined);

  const externalFilterValue = column.getFilterValue() as FilterValue | undefined;
  const externalBrushRange = useMemo(
    () => getBrushRange(externalFilterValue),
    [externalFilterValue],
  );
  const externalSelectedBinIds = useMemo(
    () => getSelectedBinIds(externalFilterValue),
    [externalFilterValue],
  );
  const [brushRange, setBrushRange] = useState<BrushRange>(externalBrushRange);
  const [minInput, setMinInput] = useState(() => formatInputValue(externalBrushRange?.min));
  const [maxInput, setMaxInput] = useState(() => formatInputValue(externalBrushRange?.max));
  const [selectedBinIds, setSelectedBinIds] = useState<string[]>(externalSelectedBinIds);

  const selectedMin =
    brushRange === undefined ? undefined : clampValue(brushRange.min ?? binDomain[0], binDomain);
  const selectedMax =
    brushRange === undefined ? undefined : clampValue(brushRange.max ?? binDomain[1], binDomain);
  const brushMin =
    selectedMin === undefined || selectedMax === undefined
      ? undefined
      : Math.min(selectedMin, selectedMax);
  const brushMax =
    selectedMin === undefined || selectedMax === undefined
      ? undefined
      : Math.max(selectedMin, selectedMax);
  const brushX = brushMin === undefined ? 0 : xScale(brushMin);
  const brushWidth =
    brushMin === undefined || brushMax === undefined ? 0 : Math.max(xScale(brushMax) - brushX, 0);
  const selectedBinIdSet = useMemo(() => new Set(selectedBinIds), [selectedBinIds]);

  useLayoutEffect(() => {
    setBrushRange(externalBrushRange);
    setMinInput(formatInputValue(externalBrushRange?.min));
    setMaxInput(formatInputValue(externalBrushRange?.max));
    setSelectedBinIds(externalSelectedBinIds);
  }, [externalBrushRange, externalSelectedBinIds]);

  const maybeSetFilterValue = useDebouncedCallback(
    (nextValue: FilterValue | undefined) => {
      column.setFilterValue(nextValue);
    },
    { wait: 250 },
  );

  const syncBrushRange = useCallback(
    (
      nextMin: number | undefined,
      nextMax: number | undefined,
      options: { formatInputs?: boolean } = {},
    ) => {
      const nextRange = normalizeBrushRange(nextMin, nextMax, binDomain);

      setBrushRange(nextRange);
      setSelectedBinIds([]);
      if (options.formatInputs !== false) {
        setMinInput(formatInputValue(nextRange?.min));
        setMaxInput(formatInputValue(nextRange?.max));
      }
      maybeSetFilterValue(createBrushFilterValue(nextRange));
    },
    [binDomain, maybeSetFilterValue],
  );

  const clearFilter = useCallback(() => {
    setBrushRange(undefined);
    setMinInput("");
    setMaxInput("");
    setSelectedBinIds([]);
    maybeSetFilterValue(undefined);
  }, [maybeSetFilterValue]);

  const syncSelectedBinIds = useCallback(
    (nextBinIds: string[]) => {
      setBrushRange(undefined);
      setMinInput("");
      setMaxInput("");
      setSelectedBinIds(nextBinIds);
      maybeSetFilterValue(createBinFilterValue(nextBinIds));
    },
    [maybeSetFilterValue],
  );

  const onMinInputChange = useCallback(
    (nextMinInput: string) => {
      const nextMin = parseInputValue(nextMinInput);

      setMinInput(nextMinInput);
      syncBrushRange(nextMin, parseInputValue(maxInput), { formatInputs: false });
    },
    [maxInput, syncBrushRange],
  );

  const onMaxInputChange = useCallback(
    (nextMaxInput: string) => {
      const nextMax = parseInputValue(nextMaxInput);

      setMaxInput(nextMaxInput);
      syncBrushRange(parseInputValue(minInput), nextMax, { formatInputs: false });
    },
    [minInput, syncBrushRange],
  );

  const getRelativeX = useCallback((clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();

    return rect === undefined ? 0 : clientX - rect.left;
  }, []);

  const isBrushHit = useCallback(
    (x: number) => {
      return brushMin !== undefined && x >= brushX && x <= brushX + brushWidth;
    },
    [brushMin, brushWidth, brushX],
  );

  const updateHoveredBin = useCallback(
    (x: number) => {
      if (isDragging) {
        return;
      }

      if (isBrushHit(x)) {
        setHoveredBinIndex(undefined);
        return;
      }

      const nextIndex = getBinIndexForX(x, cssBarLayout);

      setHoveredBinIndex(nextIndex === -1 ? undefined : nextIndex);
    },
    [cssBarLayout, isBrushHit, isDragging],
  );

  const getBinIndexAtX = useCallback(
    (x: number) => {
      return getBinIndexForX(x, cssBarLayout);
    },
    [cssBarLayout],
  );

  const toggleBinAtX = useCallback(
    (x: number) => {
      const binIndex = getBinIndexAtX(x);
      const bin = binIndex === -1 ? undefined : bins[binIndex];

      if (bin === undefined) {
        return;
      }

      const binId = getNumberBinId(bin);
      const nextBinIds = selectedBinIdSet.has(binId)
        ? selectedBinIds.filter((selectedBinId) => selectedBinId !== binId)
        : [...selectedBinIds, binId];

      syncSelectedBinIds(nextBinIds);
    },
    [bins, getBinIndexAtX, selectedBinIdSet, selectedBinIds, syncSelectedBinIds],
  );

  const beginDrag = useCallback(
    (x: number) => {
      const value = xScale.invert(x);
      const handleHitWidth = 6;
      let type: NonNullable<DragState>["type"] = "create";
      let nextMin = value;
      let nextMax = value;
      let startedOnBrush = false;

      if (brushMin !== undefined && brushMax !== undefined) {
        const brushRight = brushX + brushWidth;

        nextMin = brushMin;
        nextMax = brushMax;

        if (Math.abs(x - brushX) <= handleHitWidth) {
          type = "min";
          nextMin = value;
        } else if (Math.abs(x - brushRight) <= handleHitWidth) {
          type = "max";
          nextMax = value;
        } else if (x >= brushX && x <= brushRight) {
          type = "move";
          startedOnBrush = true;
        }
      }

      dragStateRef.current = {
        type,
        startX: x,
        startMin: nextMin,
        startMax: nextMax,
        startedOnBrush,
      };

      setHoveredBinIndex(undefined);
    },
    [brushMax, brushMin, brushWidth, brushX, xScale],
  );

  const updateDrag = useCallback(
    (x: number) => {
      const dragState = dragStateRef.current;

      if (dragState === undefined) {
        return;
      }

      const value = xScale.invert(x);

      setHoveredBinIndex(undefined);

      if (dragState.type === "create") {
        syncBrushRange(Math.min(value, dragState.startMin), Math.max(value, dragState.startMin));

        return;
      }

      if (dragState.type === "min") {
        syncBrushRange(Math.min(value, dragState.startMax), dragState.startMax);

        return;
      }

      if (dragState.type === "max") {
        syncBrushRange(dragState.startMin, Math.max(value, dragState.startMin));

        return;
      }

      const valueDelta = value - xScale.invert(dragState.startX);
      const rangeWidth = dragState.startMax - dragState.startMin;
      const nextMin = clampValue(dragState.startMin + valueDelta, [
        binDomain[0],
        binDomain[1] - rangeWidth,
      ]);

      syncBrushRange(nextMin, nextMin + rangeWidth);
    },
    [binDomain, syncBrushRange, xScale],
  );

  const finishDrag = useCallback(() => {
    dragStateRef.current = undefined;
    setIsDragging(false);
  }, []);

  const gestureBind = useGesture(
    {
      onClick: ({ event }) => {
        event.stopPropagation();

        if (performance.now() < suppressClickUntilRef.current) {
          return;
        }

        const x = getRelativeX(event.clientX);

        if (isBrushHit(x)) {
          clearFilter();
        } else {
          toggleBinAtX(x);
        }
      },
      onDrag: ({ event, first, last, intentional, xy: [clientX], initial: [initialClientX] }) => {
        event.preventDefault();

        if (first || dragStateRef.current === undefined) {
          beginDrag(getRelativeX(initialClientX));
        }

        if (intentional) {
          setIsDragging(true);
          suppressClickUntilRef.current = performance.now() + 120;
          updateDrag(getRelativeX(clientX));
        }

        if (last) {
          finishDrag();
        }
      },
      onPointerLeave: () => {
        if (dragStateRef.current === undefined) {
          setHoveredBinIndex(undefined);
        }
      },
      onPointerDown: ({ event }) => {
        event.stopPropagation();
      },
      onPointerMove: ({ event }) => {
        if (dragStateRef.current === undefined) {
          updateHoveredBin(getRelativeX(event.clientX));
        }
      },
    },
    {
      drag: {
        axis: "x",
        eventOptions: { passive: false },
        filterTaps: false,
        pointer: { capture: false, keys: false, touch: true },
        tapsThreshold: 3,
        threshold: 3,
        triggerAllEvents: true,
      },
    },
  );

  return {
    brushMin,
    brushWidth,
    brushX,
    gestureBind,
    hoveredBinIndex,
    isDragging,
    maxInput,
    minInput,
    onMaxInputChange,
    onMinInputChange,
    selectedBinIds,
    svgRef,
  };
}
