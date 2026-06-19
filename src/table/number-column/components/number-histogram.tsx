import * as d3 from "d3";
import type { Bin } from "d3";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";
import { getPixelSnappedHistogramBarXLayout } from "../../features/histogram/histogram-layout";
import type { PixelSnappedBarX } from "../../features/histogram/histogram-layout";
import { getBinIndexForValue } from "./use-number-filter-brush";

export type NumberHistogramEntry = {
  bin: Bin<number, number>;
  filteredCount: number;
  totalCount: number;
};

export function getNumberHistogramDomain(
  bins: Bin<number, number>[],
  domain: [number, number] | undefined,
): [number, number] {
  const firstBin = bins[0];
  const lastBin = bins.at(-1);

  return [firstBin?.x0 ?? domain?.[0] ?? 0, lastBin?.x1 ?? domain?.[1] ?? 1];
}

export function getNumberHistogramEntries({
  binDomain,
  bins,
  columnId,
  rows,
}: {
  binDomain: [number, number];
  bins: Bin<number, number>[];
  columnId: string;
  rows: { getValue: <TValue>(columnId: string) => TValue }[];
}): NumberHistogramEntry[] {
  const filteredCounts = bins.map(() => 0);

  for (const row of rows) {
    const value = row.getValue<number | undefined>(columnId);

    if (typeof value !== "number" || Number.isNaN(value)) {
      continue;
    }

    const binIndex = getBinIndexForValue(value, bins, binDomain);

    if (binIndex !== -1) {
      filteredCounts[binIndex] += 1;
    }
  }

  return bins.map((bin, index) => ({
    bin,
    filteredCount: filteredCounts[index] ?? 0,
    totalCount: bin.length,
  }));
}

export function getNumberHistogramMax(histogram: NumberHistogramEntry[]) {
  return Math.max(0, ...histogram.map((entry) => Math.max(entry.filteredCount, entry.totalCount)));
}

export function NumberHistogramPlot({
  binDomain,
  children,
  colorScale,
  height,
  histogram,
  max = getNumberHistogramMax(histogram),
  width,
}: {
  binDomain: [number, number];
  children?: ReactNode;
  colorScale: (value: number | undefined) => string;
  height: number;
  histogram: NumberHistogramEntry[];
  max?: number;
  width: number;
}) {
  const { ref, pixelWidth, pixelHeight, context } = useCanvas();
  const pixelBarLayout = useNumberHistogramBarLayout({
    binCount: histogram.length,
    width: pixelWidth,
  });

  useFrameEffect(() => {
    if (context === null || pixelWidth === 0 || pixelHeight === 0) {
      return;
    }

    drawNumberHistogram({
      binDomain,
      colorScale,
      context,
      histogram,
      max,
      pixelBarLayout,
      pixelHeight,
      pixelWidth,
    });
  }, [context, pixelBarLayout, pixelWidth, pixelHeight, histogram, binDomain, max, colorScale]);

  return (
    <div style={{ height, position: "relative", width }}>
      <canvas
        ref={ref}
        style={{ height: "100%", pointerEvents: "none", width: "100%" }}
        width={pixelWidth}
        height={pixelHeight}
      />
      {children}
    </div>
  );
}

export function useNumberHistogramScale({
  binDomain,
  width,
}: {
  binDomain: [number, number];
  width: number;
}) {
  return useMemo(
    () => d3.scaleLinear().domain(binDomain).range([0, width]).clamp(true),
    [binDomain, width],
  );
}

export function useNumberHistogramBarLayout({
  binCount,
  width,
}: {
  binCount: number;
  width: number;
}): PixelSnappedBarX[] {
  return useMemo(
    () =>
      getPixelSnappedHistogramBarXLayout({
        count: binCount,
        desiredGap: 2,
        minBarWidthForGap: 2,
        width,
      }),
    [binCount, width],
  );
}

function drawNumberHistogram({
  binDomain,
  colorScale,
  context,
  histogram,
  max,
  pixelBarLayout,
  pixelHeight,
  pixelWidth,
}: {
  binDomain: [number, number];
  colorScale: (value: number | undefined) => string;
  context: CanvasRenderingContext2D;
  histogram: NumberHistogramEntry[];
  max: number;
  pixelBarLayout: PixelSnappedBarX[];
  pixelHeight: number;
  pixelWidth: number;
}) {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, pixelWidth, pixelHeight);

  const drawableHeight = Math.max(pixelHeight - 1, 0);
  const safeMax = Math.max(max, 0);

  for (const bar of pixelBarLayout) {
    const entry = histogram[bar.index];

    if (entry === undefined) {
      continue;
    }

    const isFiltered = entry.filteredCount !== entry.totalCount;

    const totalHeight =
      safeMax === 0 ? 0 : Math.round((Math.max(entry.totalCount, 0) / safeMax) * drawableHeight);
    const filteredHeight =
      safeMax === 0 ? 0 : Math.round((Math.max(entry.filteredCount, 0) / safeMax) * drawableHeight);
    const totalY = pixelHeight - totalHeight;
    const filteredY = pixelHeight - filteredHeight;

    if (bar.width === 0 || totalHeight === 0) {
      continue;
    }

    const { bin } = entry;
    const colorValue = ((bin.x0 ?? binDomain[0]) + (bin.x1 ?? binDomain[1])) / 2;

    if (isFiltered) {
      context.strokeStyle = "black";
      context.globalAlpha = 1;
      context.strokeRect(bar.x, totalY, bar.width, totalHeight);
    }

    context.fillStyle = colorScale(colorValue);
    context.globalAlpha = 1;
    context.fillRect(bar.x, filteredY, bar.width, filteredHeight);
  }

  context.globalAlpha = 1;
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, pixelHeight - 0.5);
  context.lineTo(pixelWidth, pixelHeight - 0.5);
  context.stroke();
}
