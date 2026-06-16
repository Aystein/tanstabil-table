import type { CellContext } from "@tanstack/react-table";
import type { CellRenderer } from "../features/cell-visualization/types";
import { Tooltip } from "@mantine/core";
import { useState, type JSX, type MouseEvent } from "react";
import type { VantageFeatures } from "../use-vantage-table";
import { assertIsNumberArrayColumn } from "./types";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";

export function NumberArrayColumnCell({
  column,
  table,
  getValue,
}: CellContext<VantageFeatures, any, number[] | undefined>) {
  assertIsNumberArrayColumn(column);

  const { ref, width, height, pixelWidth, pixelHeight, context } = useCanvas();
  const [hoveredIndex, setHoveredIndex] = useState<number>();

  const value = getValue();
  const feature = column.feature();

  const domain = feature.getDomain();
  const scale = feature.getColorScale();

  useFrameEffect(() => {
    if (context === null || domain === undefined || value === undefined || value.length === 0) {
      return;
    }

    context.clearRect(0, 0, pixelWidth, pixelHeight);
    const w = Math.ceil(pixelWidth / value.length);

    for (let i = 0; i < value.length; i++) {
      const x0 = Math.round((i / value.length) * pixelWidth);
      const color = scale(value[i]);

      context.fillStyle = color;
      context.fillRect(x0, 4, w, pixelHeight - 8);
    }
  }, [context, pixelWidth, pixelHeight, domain, value, scale]);

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (value === undefined || value.length === 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) {
      return;
    }

    const offsetX = event.clientX - bounds.left;
    const nextIndex = Math.min(
      value.length - 1,
      Math.max(0, Math.floor((offsetX / bounds.width) * value.length)),
    );

    setHoveredIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
  }

  if (value === undefined) {
    return table.options.renderFallbackValue;
  }

  const hasHover = hoveredIndex !== undefined && value.length > 0;
  const strokeWidth = 2;
  const hoverWidth = hasHover ? width / value.length : 0;
  const hoverX = hasHover ? hoveredIndex * hoverWidth : 0;
  const visibleHoverWidth = Math.min(hoverWidth, width - hoverX);
  const hoverHeight = Math.max(0, height - 8);

  return (
    <div
      onMouseLeave={() => setHoveredIndex(undefined)}
      onMouseMove={handleMouseMove}
      style={{ height: "100%", position: "relative", width: "100%" }}
    >
      <canvas
        ref={ref}
        style={{ height: "100%", pointerEvents: "none", width: "100%" }}
        width={pixelWidth}
        height={pixelHeight}
      />
      {hasHover ? (
        <Tooltip label={value[hoveredIndex]} opened>
          <div
            style={{
              background: "transparent",
              border: 0,
              display: "block",
              height: hoverHeight,
              left: hoverX,
              padding: 0,
              position: "absolute",
              top: 4,
              width: visibleHoverWidth,
              boxShadow: `inset 0 0 0 ${strokeWidth}px black`,
            }}
          />
        </Tooltip>
      ) : null}
    </div>
  );
}

export const numberArrayCellRenderer: CellRenderer = {
  component: NumberArrayColumnCell as (props: CellContext<any, any>) => JSX.Element,
  id: "number-array",
  name: "Number array",
};
