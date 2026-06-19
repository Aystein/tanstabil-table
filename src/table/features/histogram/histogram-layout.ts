import { useMemo } from "react";

export type PixelSnappedBarX = {
  index: number;
  x: number;
  width: number;
};

export type PixelSnappedHistogramBar<TEntry> = PixelSnappedBarX & {
  entry: TEntry;
  filteredHeight: number;
  filteredY: number;
  totalHeight: number;
  totalY: number;
};

export type PixelSnappedHistogramBarOptions<TEntry> = {
  desiredGap?: number;
  entries: TEntry[];
  getFiltered: (entry: TEntry, index: number) => number;
  getTotal: (entry: TEntry, index: number) => number;
  height: number;
  max: number;
  minBarWidthForGap?: number;
  width: number;
  xRange?: (entry: TEntry, index: number) => readonly [number, number];
};

export function computeFixedGapLayout(
  totalWidth: number,
  binCount: number,
  gapPixels: number,
): PixelSnappedBarX[] {
  const pixelWidth = Math.max(0, Math.round(totalWidth));
  const count = Math.max(0, Math.floor(binCount));
  const gap = Math.max(0, Math.round(gapPixels));
  const layouts: PixelSnappedBarX[] = [];

  if (count <= 0 || pixelWidth <= 0) {
    return layouts;
  }

  const totalGapSpace = (count - 1) * gap;
  const netBinWidth = Math.max(pixelWidth - totalGapSpace, 0);

  for (let index = 0; index < count; index++) {
    const exactNetStart = (index * netBinWidth) / count;
    const exactNetEnd = ((index + 1) * netBinWidth) / count;
    const pixelNetStart = Math.round(exactNetStart);
    const pixelNetEnd = Math.round(exactNetEnd);
    const width = pixelNetEnd - pixelNetStart;
    const x = pixelNetStart + index * gap;

    layouts.push({ index, x, width });
  }

  return layouts;
}

export function getPixelSnappedHistogramBarXLayout({
  count,
  desiredGap = 1,
  width,
}: {
  count: number;
  desiredGap?: number;
  minBarWidthForGap?: number;
  width: number;
  xRange?: (index: number) => readonly [number, number];
}): PixelSnappedBarX[] {
  return computeFixedGapLayout(width, count, desiredGap);
}

export function getPixelSnappedHistogramBars<TEntry>({
  desiredGap,
  entries,
  getFiltered,
  getTotal,
  height,
  max,
  minBarWidthForGap,
  width,
  xRange,
}: PixelSnappedHistogramBarOptions<TEntry>): PixelSnappedHistogramBar<TEntry>[] {
  const pixelHeight = Math.max(0, Math.round(height));
  const drawableHeight = Math.max(pixelHeight - 1, 0);
  const safeMax = Math.max(max, 0);
  const xLayout = getPixelSnappedHistogramBarXLayout({
    count: entries.length,
    desiredGap,
    minBarWidthForGap,
    width,
    xRange: xRange === undefined ? undefined : (index) => xRange(entries[index]!, index),
  });

  return xLayout.map((layout) => {
    const entry = entries[layout.index]!;
    const totalHeight =
      safeMax === 0
        ? 0
        : Math.round((Math.max(getTotal(entry, layout.index), 0) / safeMax) * drawableHeight);
    const filteredHeight =
      safeMax === 0
        ? 0
        : Math.round((Math.max(getFiltered(entry, layout.index), 0) / safeMax) * drawableHeight);

    return {
      ...layout,
      entry,
      filteredHeight,
      filteredY: pixelHeight - filteredHeight,
      totalHeight,
      totalY: pixelHeight - totalHeight,
    };
  });
}

export function usePixelSnappedHistogramBars<TEntry>(
  options: PixelSnappedHistogramBarOptions<TEntry>,
) {
  return useMemo(
    () => getPixelSnappedHistogramBars(options),
    [
      options.desiredGap,
      options.entries,
      options.getFiltered,
      options.getTotal,
      options.height,
      options.max,
      options.minBarWidthForGap,
      options.width,
      options.xRange,
    ],
  );
}
