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
  text: string;
}

function getRealHeight(elt: HTMLElement) {
  const styles = window.getComputedStyle(elt);
  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;
  return elt.clientHeight - paddingTop - paddingBottom;
}

export function Textfit(props: TextfitProps) {
  const [div, setDiv] = useState<HTMLDivElement | null>(null);
  const size = useSize(div);
  const [minFontSize, maxFontSize] = [1, 100];
  const [fontSize, setFontSize] = useState(maxFontSize);
  const [text, setText] = useState(props.text);

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

    // Get line count
    div.style.height = 'fit-content';
    const totalHeight = getRealHeight(div);
    div.innerText = 'A';
    const lineCount = totalHeight / getRealHeight(div);
    div.innerText = props.text;
    div.style.height = props.height + 'px';
    
    // Minimize width
    if (lineCount === 2) {
      div.style.width = 'fit-content';
      const words = props.text.split(' ');
      let width = div.clientWidth;
      let finalHtml = words.join(' ');
      for (let i = 0; i < words.length - 1; i++) {
        const html = words.slice(0, i + 1).join(' ') + '<br>' + words.slice(i + 1).join(' ');
        div.innerHTML = html;
        if (div.clientWidth < width) {
          width = div.clientWidth;
          finalHtml = html;
        }
      }
      setText(finalHtml);
      div.innerHTML = finalHtml;
      div.style.width = props.width + 'px';
    }
  }, [minFontSize, maxFontSize, size]);

  return <div
    {...props}
    ref={setDiv}
    style={{
      width: props.width + 'px',
      height: props.height + 'px',
      fontSize: fontSize + 'px'
    }}>
    {text}
  </div>;
}