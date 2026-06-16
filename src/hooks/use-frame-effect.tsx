import { useEffect, useRef, type DependencyList } from "react";

export function useFrameEffect(callback: () => void, dependencies: DependencyList) {
  // 1. Keep a fresh reference to the callback to avoid stale closures,
  // without forcing the effect to re-run if the callback itself changes.
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    // 2. Request a SINGLE animation frame
    const frameId = requestAnimationFrame(() => {
      callbackRef.current();
    });

    // 3. Cleanup: If the component unmounts OR the dependencies change
    // again *before* the frame has a chance to paint, cancel the pending frame.
    return () => {
      cancelAnimationFrame(frameId);
    };

    // We intentionally spread the user's dependencies here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
