import { useCurrentGame } from "./database";
import { useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, PencilBrush } from "fabric";
import { range } from "lodash";

function createBlankImageDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx!.fillStyle = '#fff';
  ctx!.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
}

const IMAGE_WIDTH = 500;
const IMAGE_HEIGHT = 300;
const BLANK_IMAGE = createBlankImageDataURL(IMAGE_WIDTH, IMAGE_HEIGHT);

export function GameInProgress() {
  const { game: { started, archive, currentRound, totalRounds }, userId } = useCurrentGame();

  if (!started) {
    return <div id="instructions">The game hasn't started yet. Please wait for the admin to start the game.</div>;
  } else if (currentRound >= totalRounds) {
    return <div id="instructions">The game is over. Please wait for the admin to show the archives.</div>;
  } else if (userId in archive[currentRound]) {
    return <PleaseWait />;
  } else if (currentRound === 0) {
    return <FirstRound />;
  } else if (currentRound % 2 === 1) {
    return <DrawingRound />;
  } else {
    return <WritingRound />;
  }
}

function FirstRound() {
  const { game, userId } = useCurrentGame();

  const phraseRef = useRef<HTMLInputElement>(null);
  return <>
    <div id="instructions">Write a phrase for others to draw:</div>
    <input type="text" className="phrase-input" ref={phraseRef} placeholder="e.g., A cat wearing a superhero cape"></input>
    <div className="spacer"></div>
    <button id="done" onClick={() => {
      game.addResponse(userId, phraseRef.current!.value);
    } }>Done</button>
  </>;
}

function DrawingRound() {
  const { game, userId } = useCurrentGame();
  const { archive, currentRound, players } = game;

  const colors = ["black", "red", "orange", "yellow", "green", "blue", "purple", "white"];
  const [color, setColor] = useState("black");
  const [thickness, setThickness] = useState(5);

  const [drawingAreaContainerWidth, setDrawingAreaContainerWidth] = useState(0);
  const drawingAreaContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDrawingAreaContainerWidth(entry.contentRect.width);
      }
    });
    if (drawingAreaContainerRef.current) {
      resizeObserver.observe(drawingAreaContainerRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [drawingAreaContainerRef]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState(BLANK_IMAGE);
  useEffect(() => {
    if (!canvasRef.current || !drawingAreaContainerRef.current) {
      return;
    }

    const canvasWidth = Math.min(drawingAreaContainerWidth - 20, IMAGE_WIDTH);
    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: canvasWidth,
      height: canvasWidth * IMAGE_HEIGHT / IMAGE_WIDTH,
    });
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = thickness * canvasWidth / IMAGE_WIDTH;
    canvas.freeDrawingBrush.color = color;

    FabricImage.fromURL(image).then((img) => {
      img.scaleToWidth(canvasWidth);
      canvas.backgroundImage = img;
      canvas.renderAll();
    });

    canvas.on('path:created', function() {
      setImage(canvas.toDataURL({ format: 'png', multiplier: IMAGE_WIDTH / canvasWidth }) );
    });

    return () => {
      canvas.dispose();
    };
  }, [canvasRef, drawingAreaContainerRef, drawingAreaContainerWidth, color, thickness, image]);

  return <>
    <div id="instructions">Draw this phrase:</div>
    <div id="phrase-to-draw">{archive[currentRound - 1][(userId + players.length - 1) % players.length]}</div>
    <div id="drawing-area-container" ref={drawingAreaContainerRef}>
      <div id="drawing-area">
        <canvas ref={canvasRef} />
      </div>
    </div>
    <div id="color-picker">
      {colors.map(c => (
        <div
          key={c}
          className={`swatch-container ${c}` + (c === color ? " active" : "")}
          onClick={() => setColor(c)}>
          <div className="color-swatch" style={{ backgroundColor: c }} />
        </div>
      ))}
    </div>
    <div id="thickness-picker">
      {range(1, 17, 2).map(t => (
        <div
          key={t}
          className={`swatch-container ${color}` + (t === thickness ? " active" : "")}
          onClick={() => setThickness(t)}>
          <div className="thickness-swatch" style={{ backgroundColor: color, height: t }} />
        </div>
      ))}
    </div>
    <button id="done" onClick={() => {
      game.addResponse(userId, image);
    } }>Done</button>
  </>;
}

function WritingRound() {
  const { game, userId } = useCurrentGame();
  const { archive, currentRound, players } = game;

  const phraseRef = useRef<HTMLInputElement>(null);
  return <>
    <div id="instructions">Describe this drawing:</div>
    <img id="drawing-to-describe" src={archive[currentRound - 1][(userId + players.length - 1) % players.length]!} alt="Previous drawing" />
    <input type="text" className="phrase-input" ref={phraseRef} placeholder="e.g., A cat wearing a superhero cape"></input>
    <button id="done" onClick={() => {
      game.addResponse(userId, phraseRef.current!.value);
    } }>Done</button>
  </>;
}

function PleaseWait() {
  const { game: { archive, currentRound, players } } = useCurrentGame();
  const playersDone = Object.keys(archive[currentRound]).length;
  return <>
    <div id="instructions">Please wait for other players to finish this round...</div>
    <div>{playersDone} of {players.length} are done.</div>
  </>;
}