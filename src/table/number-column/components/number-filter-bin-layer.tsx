import { useMemo } from "react";
import type { Bin } from "d3";
import type { PixelSnappedBarX } from "../../features/histogram/histogram-layout";
import { getNumberBinId } from "../number-column-def";

export function NumberFilterBinLayer({
  cssBarLayout,
  bins,
  histogramHeight,
  hoveredBinIndex,
  selectedBinIds,
}: {
  cssBarLayout: PixelSnappedBarX[];
  bins: Bin<number, number>[];
  histogramHeight: number;
  hoveredBinIndex: number | undefined;
  selectedBinIds: string[];
}) {
  const selectedBinIdSet = useMemo(() => new Set(selectedBinIds), [selectedBinIds]);
  const hoveredBar = hoveredBinIndex === undefined ? undefined : cssBarLayout[hoveredBinIndex];

  return (
    <>
      {bins.map((bin, index) => {
        const binId = getNumberBinId(bin);
        const bar = cssBarLayout[index];

        if (!selectedBinIdSet.has(binId) || bar === undefined) {
          return null;
        }

        return (
          <rect
            key={binId}
            x={bar.x + 0.5}
            y={0.5}
            width={Math.max(bar.width - 1, 0)}
            height={Math.max(histogramHeight - 1, 0)}
            fill="color-mix(in oklab, var(--color-primary) 15%, transparent)"
            pointerEvents="none"
            stroke="color-mix(in oklab, var(--color-primary) 80%, transparent)"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {hoveredBar === undefined ? null : (
        <rect
          x={hoveredBar.x + 0.5}
          y={0.5}
          width={Math.max(hoveredBar.width - 1, 0)}
          height={Math.max(histogramHeight - 1, 0)}
          fill="transparent"
          pointerEvents="none"
          stroke="var(--color-foreground)"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </>
  );
}
