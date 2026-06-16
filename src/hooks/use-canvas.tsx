import { useState, useCallback } from "react";

export function useCanvas() {
  const [size, setSize] = useState({ width: 0, height: 0, pixelWidth: 0, pixelHeight: 0 });
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const ref = useCallback((node: HTMLCanvasElement | null) => {
    // If the node unmounts, clear everything out
    if (!node) {
      setContext(null);
      return;
    }

    // 1. Grab the 2D context immediately
    const ctx = node.getContext("2d");
    setContext(ctx);

    // 2. Set up the ResizeObserver
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0];
        const { inlineSize: pixelWidth, blockSize: pixelHeight } =
          entry.devicePixelContentBoxSize[0];

        setSize({ width, height, pixelWidth, pixelHeight });
      }
    });

    observer.observe(node);

    // ✨ The React 19 Cleanup
    return () => {
      observer.disconnect();
      setContext(null);
    };
  }, []);

  return { ...size, context, ratio: window.devicePixelRatio, ref };
}
