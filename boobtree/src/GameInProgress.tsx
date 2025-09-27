import Switch from "react-switch";
import { useCurrentGame } from "./database";
import { createRef, RefObject, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, PencilBrush } from "fabric";
import { range } from "lodash";
import { IMAGE_HEIGHT, IMAGE_WIDTH, useSize } from "./utils";

function createBlankImageDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx!.fillStyle = '#fff';
  ctx!.fillRect(0, 0, width, height);
  return canvas.toDataURL('image/png');
}

const BLANK_IMAGE = createBlankImageDataURL(IMAGE_WIDTH, IMAGE_HEIGHT);

export function GameInProgress() {
  const { game: { started, archive, currentRound, totalRounds }, userId } = useCurrentGame();

  const previousRoundRef = useRef(currentRound);
  const audioRef = createRef<HTMLAudioElement>();
  const [allowAudio, setAllowAudio] = useState(false);

  useEffect(() => {
    if (currentRound > previousRoundRef.current && audioRef.current && allowAudio) {
      audioRef.current.volume = 1;
      audioRef.current.currentTime = 0;
      console.log("Playing audio");
      audioRef.current.play().catch(console.error).then(() => {
        console.log("Audio played successfully");
      });
    }
    previousRoundRef.current = currentRound;
  }, [currentRound]);


  return <>
    <audio ref={audioRef} src="/next-round.m4a" />
    { !started
      ? <div id="instructions">The game hasn't started yet. Please wait for the admin to start the game.</div>
      : currentRound >= totalRounds
      ? <div id="instructions">The game is over. Please wait for the admin to show the archives.</div>
      : userId in archive[currentRound]
      ? <PleaseWait audio={audioRef} allowAudio={allowAudio} setAllowAudio={setAllowAudio} />
      : currentRound === 0
      ? <FirstRound />
      : currentRound % 2 === 1
      ? <DrawingRound />
      : <WritingRound />
    }
  </>;
}

function FirstRound() {
  const { game, userId } = useCurrentGame();

  const phraseRef = createRef<HTMLInputElement>();
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

  const [drawingAreaContainer, setDrawingAreaContainer] = useState<HTMLDivElement | null>(null);
  const { width: drawingAreaContainerWidth } = useSize(drawingAreaContainer);

  const canvasRef = createRef<HTMLCanvasElement>();
  const [image, setImage] = useState(BLANK_IMAGE);
  useEffect(() => {
    if (!canvasRef.current || !drawingAreaContainer) {
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
  }, [canvasRef, drawingAreaContainer, drawingAreaContainerWidth, color, thickness, image]);

  return <>
    <div id="instructions">Draw this phrase:</div>
    <div id="phrase-to-draw">{archive[currentRound - 1][(userId + players.length - 1) % players.length]}</div>
    <div id="drawing-area-container" ref={setDrawingAreaContainer}>
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

  const phraseRef = createRef<HTMLInputElement>();
  return <>
    <div id="instructions">Describe this drawing:</div>
    <img id="drawing-to-describe" src={archive[currentRound - 1][(userId + players.length - 1) % players.length]!} alt="Previous drawing" />
    <input type="text" className="phrase-input" ref={phraseRef} placeholder="e.g., A cat wearing a superhero cape"></input>
    <button id="done" onClick={() => {
      game.addResponse(userId, phraseRef.current!.value);
    } }>Done</button>
  </>;
}

type PleaseWaitProps = {
  audio: RefObject<HTMLAudioElement | null>,
  allowAudio: boolean,
  setAllowAudio: (allow: boolean) => void,
};
function PleaseWait({audio, allowAudio, setAllowAudio}: PleaseWaitProps) {
  const { game: { archive, currentRound, players } } = useCurrentGame();
  const playersDone = Object.keys(archive[currentRound]).length;
  return <>
    <div id="instructions">Please wait for other players to finish this round...</div>
    <div>{playersDone} of {players.length} are done.</div>
    <label>
      <Switch onChange={(checked) => {
        setAllowAudio(checked);
        if (checked) {
          // Play the audio immediately so that the user gets asked for permission if necessary
          audio.current!.volume = 0;
          audio.current!.currentTime = 0;
          audio.current!.play().catch(console.error);
        }
      }} checked={allowAudio} />
      <span>Play sound when next round starts</span>
    </label>
  </>;
}