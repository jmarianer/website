import { useState, useEffect } from "react";

export const IMAGE_WIDTH = 500;
export const IMAGE_HEIGHT = 300;

export function useSize(elt: Element | null): DOMRectReadOnly {
  const [size, setSize] = useState(new DOMRectReadOnly());

  useEffect(() => {
    if (!elt) {
      return;
    }

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setSize(entry.contentRect);
      }
    });
    resizeObserver.observe(elt);

    return () => {
      resizeObserver.disconnect();
    };
  }, [elt]);

  return size;
}

// I've been unable to get Textfit (from npm) to work properly. This uses
// elements (no pun intended) of that and also suggestions from Claude.
interface TextfitProps extends React.HTMLAttributes<HTMLDivElement> {
  width: number;
  height: number;
}

export function Textfit(props: TextfitProps) {
  const [div, setDiv] = useState<HTMLDivElement | null>(null);
  const size = useSize(div);
  const {width, height} = props;
  const [minFontSize, maxFontSize] = [1, 100];
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    if (!div) return;

    // Binary search for optimal font size
    let min = minFontSize;
    let max = maxFontSize;
    
    while (min <= max) {
      const mid = Math.floor((min + max) / 2);
      div.style.fontSize = mid + 'px';
      
      if (div.scrollHeight <= div.clientHeight) {
        min = mid + 1;
      } else {
        max = mid - 1;
      }
    }
    setFontSize(max);
    div.style.fontSize = max + 'px';
  }, [minFontSize, maxFontSize, size]);

  return <div {...props} ref={setDiv} style={{ width, height, fontSize: fontSize + 'px' }}/>;
}