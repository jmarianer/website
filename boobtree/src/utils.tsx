import { useState, useEffect, RefObject, createRef } from "react";

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
  }, [elt.current]);

  return size;
}

// I've been unable to get Textfit (from npm) to work properly. This uses
// elements (no pun intended) of that and also suggestions from Claude.
interface TextfitProps extends React.HTMLAttributes<HTMLDivElement> {
  width: number;
  height: number;
}

export function Textfit(props: TextfitProps) {
  const divRef = createRef<HTMLDivElement>();
  const size = useSize(divRef);
  const {width, height} = props;
  const [minFontSize, maxFontSize] = [1, 100];
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const element = divRef.current;
    if (!element) return;

    // Binary search for optimal font size
    let min = minFontSize;
    let max = maxFontSize;
    
    while (min <= max) {
      const mid = Math.floor((min + max) / 2);
      element.style.fontSize = mid + 'px';
      
      if (element.scrollHeight <= element.clientHeight) {
        min = mid + 1;
      } else {
        max = mid - 1;
      }
    }
    setFontSize(min);
  }, [minFontSize, maxFontSize, size]);

  return <div {...props} ref={divRef} style={{ width, height, fontSize }}/>;
}