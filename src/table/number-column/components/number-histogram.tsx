import * as d3 from "d3";
import type { Bin } from "d3";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";
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
  const { ref, width: canvasWidth, pixelWidth, pixelHeight, context } = useCanvas();

  useFrameEffect(() => {
    if (context === null || pixelWidth === 0 || pixelHeight === 0) {
      return;
    }

    drawNumberHistogram({
      binDomain,
      canvasWidth,
      colorScale,
      context,
      histogram,
      max,
      pixelHeight,
      pixelWidth,
    });
  }, [context, canvasWidth, pixelWidth, pixelHeight, histogram, binDomain, max, colorScale]);

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

function drawNumberHistogram({
  binDomain,
  canvasWidth,
  colorScale,
  context,
  histogram,
  max,
  pixelHeight,
  pixelWidth,
}: {
  binDomain: [number, number];
  canvasWidth: number;
  colorScale: (value: number | undefined) => string;
  context: CanvasRenderingContext2D;
  histogram: NumberHistogramEntry[];
  max: number;
  pixelHeight: number;
  pixelWidth: number;
}) {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, pixelWidth, pixelHeight);

  const pixelXScale = d3.scaleLinear().domain(binDomain).range([0, pixelWidth]);
  const pixelHeightScale = d3.scaleLinear().domain([0, max]).range([0, pixelHeight]);
  const gap = Math.max(1, Math.round(pixelWidth / Math.max(canvasWidth, 1)));

  for (const [index, { bin, filteredCount, totalCount }] of histogram.entries()) {
    const x0 = Math.round(pixelXScale(bin.x0 ?? binDomain[0]));
    const x1 = Math.round(pixelXScale(bin.x1 ?? binDomain[1]));
    const barX = index === 0 ? x0 : x0 + gap;
    const barWidth = Math.max(x1 - barX, 0);
    const totalBarHeight = max === 0 ? 0 : Math.round(pixelHeightScale(totalCount));
    const filteredBarHeight = max === 0 ? 0 : Math.round(pixelHeightScale(filteredCount));

    if (barWidth === 0 || totalBarHeight === 0) {
      continue;
    }

    const colorValue = ((bin.x0 ?? binDomain[0]) + (bin.x1 ?? binDomain[1])) / 2;

    context.fillStyle = colorScale(colorValue);
    context.globalAlpha = 0.2;
    context.fillRect(barX, pixelHeight - totalBarHeight, barWidth, totalBarHeight);

    if (filteredBarHeight === 0) {
      context.globalAlpha = 1;
      continue;
    }

    context.globalAlpha = 1;
    context.fillRect(barX, pixelHeight - filteredBarHeight, barWidth, filteredBarHeight);
  }

  context.globalAlpha = 1;
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, pixelHeight - 0.5);
  context.lineTo(pixelWidth, pixelHeight - 0.5);
  context.stroke();
}
