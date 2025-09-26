import { useState, useEffect, RefObject } from "react";

export const IMAGE_WIDTH = 500;
export const IMAGE_HEIGHT = 300;

export function useSize(elt: RefObject<Element | null>): DOMRectReadOnly {
  const [size, setSize] = useState(new DOMRectReadOnly());

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setSize(entry.contentRect);
      }
    });
    if (elt.current) {
      resizeObserver.observe(elt.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [elt]);

  return size;
}