import { useMemo } from "react";
import type { Bin, ScaleLinear } from "d3";
import { getNumberBinId } from "../number-column-def";

export function NumberFilterBinLayer({
  bins,
  binDomain,
  histogramHeight,
  hoveredBinIndex,
  selectedBinIds,
  xScale,
}: {
  bins: Bin<number, number>[];
  binDomain: [number, number];
  histogramHeight: number;
  hoveredBinIndex: number | undefined;
  selectedBinIds: string[];
  xScale: ScaleLinear<number, number>;
}) {
  const selectedBinIdSet = useMemo(() => new Set(selectedBinIds), [selectedBinIds]);
  const hoveredBin = hoveredBinIndex === undefined ? undefined : bins[hoveredBinIndex];
  const hoveredBinX = hoveredBin === undefined ? 0 : xScale(hoveredBin.x0 ?? binDomain[0]);
  const hoveredBinWidth =
    hoveredBin === undefined ? 0 : Math.max(xScale(hoveredBin.x1 ?? binDomain[1]) - hoveredBinX, 0);

  return (
    <>
      {bins.map((bin) => {
        const binId = getNumberBinId(bin);

        if (!selectedBinIdSet.has(binId)) {
          return null;
        }

        const x = xScale(bin.x0 ?? binDomain[0]);
        const binWidth = Math.max(xScale(bin.x1 ?? binDomain[1]) - x, 0);

        return (
          <rect
            key={binId}
            x={x + 0.5}
            y={0.5}
            width={Math.max(binWidth - 1, 0)}
            height={Math.max(histogramHeight - 1, 0)}
            fill="color-mix(in oklab, var(--color-primary) 15%, transparent)"
            pointerEvents="none"
            stroke="color-mix(in oklab, var(--color-primary) 80%, transparent)"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {hoveredBin === undefined ? null : (
        <rect
          id="test"
          x={hoveredBinX + 0.5}
          y={0.5}
          width={Math.max(hoveredBinWidth - 1, 0)}
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
