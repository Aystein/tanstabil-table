import { Tooltip } from "@mantine/core";
import { useCanvas } from "@/hooks/use-canvas";
import { useFrameEffect } from "@/hooks/use-frame-effect";
import { useState, type MouseEvent } from "react";

const glyphColor = "#0f766e";
const glyphMutedColor = "#d1d5db";

export function UpsetGlyph({
  categories,
  activeCategories,
  frequencies,
}: {
  categories: string[];
  activeCategories: string[] | undefined;
  frequencies?: Record<string, number>;
}) {
  const { ref, width, height, pixelWidth, pixelHeight, context, ratio } = useCanvas();
  const [hoveredIndex, setHoveredIndex] = useState<number>();

  useFrameEffect(() => {
    if (context === null || pixelWidth === 0 || pixelHeight === 0) {
      return;
    }

    const numPoints = categories.length;

    context.clearRect(0, 0, pixelWidth, pixelHeight);

    if (numPoints === 0) {
      return;
    }

    const activeSet = new Set(activeCategories ?? []);
    const activeIndices = categories.reduce<number[]>((indices, category, index) => {
      if (activeSet.has(category)) {
        indices.push(index);
      }
      return indices;
    }, []);

    const bandWidth = pixelWidth / numPoints;

    // Dynamic sizing based on band width and number of points
    const minGap = 4 * ratio;
    const minRadius = 2 * ratio;
    const maxRadius = 6 * ratio;
    const pointSize = Math.max(minRadius, Math.min(maxRadius, (bandWidth - minGap) / 2));

    const lineY = pixelHeight / 2;

    // Draw connecting line if multiple points are active
    if (activeIndices.length > 1) {
      const x1 = (activeIndices[0] + 0.5) * bandWidth;
      const x2 = (activeIndices[activeIndices.length - 1] + 0.5) * bandWidth;

      context.strokeStyle = glyphColor;
      context.lineWidth = 1.5 * ratio;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(x1, lineY);
      context.lineTo(x2, lineY);
      context.stroke();
    }

    // Draw points
    for (let i = 0; i < numPoints; i++) {
      const isActive = activeSet.has(categories[i]);
      const x = (i + 0.5) * bandWidth;
      const y = lineY;
      const radius = pointSize;

      context.fillStyle = isActive ? glyphColor : glyphMutedColor;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }, [context, pixelWidth, pixelHeight, categories, activeCategories, frequencies, ratio]);

  if (categories.length === 0) {
    return null;
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();

    if (categories.length === 0 || bounds.width === 0 || event.buttons !== 0) {
      return;
    }

    const offsetX = event.clientX - bounds.left;
    const nextIndex = Math.min(
      categories.length - 1,
      Math.max(0, Math.floor((offsetX / bounds.width) * categories.length)),
    );

    setHoveredIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
  }

  const hasHover = hoveredIndex !== undefined && width > 0 && height > 0;
  const bandWidth = categories.length > 0 ? width / categories.length : 0;
  const pointRadius = Math.max(2, Math.min(6, (bandWidth - 4) / 2));
  const outlineSize = Math.max(8, pointRadius * 2 + 6);
  const outlineStrokeWidth = 2;
  const outlineCenter = outlineSize / 2;
  const outlineRadius = Math.max(0, outlineCenter - outlineStrokeWidth / 2);
  const hoverX = hasHover ? (hoveredIndex + 0.5) * bandWidth : 0;
  const hoverY = height / 2;

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
        aria-hidden="true"
      />
      {hasHover ? (
        <Tooltip label={categories[hoveredIndex]} opened>
          <svg
            style={{
              background: "transparent",
              border: 0,
              display: "block",
              height: outlineSize,
              left: hoverX,
              overflow: "visible",
              padding: 0,
              pointerEvents: "none",
              position: "absolute",
              top: hoverY,
              transform: "translate(-50%, -50%)",
              width: outlineSize,
            }}
          >
            <circle
              cx={outlineCenter}
              cy={outlineCenter}
              r={outlineRadius}
              fill="none"
              stroke="black"
              strokeWidth={outlineStrokeWidth}
            />
          </svg>
        </Tooltip>
      ) : null}
    </div>
  );
}
