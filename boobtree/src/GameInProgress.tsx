import { Navigate, useParams } from "react-router";
import { useCurrentGame } from "./database";
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";

export function GameInProgress() {
  const game = useCurrentGame();
  const { started, archive, currentRound, players, totalRounds } = game;
  const params = useParams();
  const playerName = params.name!;
  const id = params.id!;

  useEffect(() => {
    if (!players.includes(playerName)) {
      game.addPlayer(playerName);
    }
  }, [playerName, players, game]);
  
  if (!started) {
    return <div>The game hasn't started yet. Please wait for the admin to start the game.</div>;
  }
  if (currentRound >= totalRounds) {
    return <Navigate to={`/game/${id}/archive`} />;
  }

  if (playerName in archive[currentRound]) {
    return <div>Waiting for other players to finish round {currentRound+1}...</div>;
  }
  if (currentRound === 0) {
    return <FirstRound />;
  } else if (currentRound % 2 === 1) {
    return <DrawingRound />;
  } else {
    return <WritingRound />;
  }
}

function WritingRound() {
  const game = useCurrentGame();
  const { currentRound, archive } = game;
  const playerName = useParams().name!;
  const previousPlayer = game.previousPlayer(playerName);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  return <>
    <div id="instructions">Describe that drawing below</div>
    <div id="previous">
      <img id="previous-drawing-image" src={archive[currentRound - 1][previousPlayer]} alt="Previous drawing" />
    </div>
    <div id="next">
      <textarea id="next-phrase" ref={textareaRef}></textarea>
    </div>
    <button id="done" onClick={() => {
      game.addResponse(playerName, textareaRef.current!.value);
    } }>Done</button>
  </>;
}

function DrawingRound() {
  const game = useCurrentGame();
  const { currentRound, archive } = game;
  const playerName = useParams().name!;
  const previousPlayer = game.previousPlayer(playerName);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = new Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: 500,
      height: 300,
    });
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.width = 5;
    canvas.freeDrawingBrush.color = "#000000";

    fabricCanvasRef.current = canvas;
    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  return <>
    <div id="instructions">Draw that phrase below</div>
    <div id="previous">
      <span>{archive[currentRound - 1][previousPlayer]}</span>
    </div>
    <div id="next">
      <canvas ref={canvasRef} id="next-drawing-canvas"></canvas>
    </div>
    <button id="done" onClick={() => {
      game.addResponse(playerName, fabricCanvasRef.current!.toDataURL({ format: 'png', multiplier: 1 }));
    } }>Done</button>
  </>;
}

function FirstRound() {
  const game = useCurrentGame();
  const playerName = useParams().name!;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  return <>
    <div id="instructions">Write a phrase here</div>
    <div id="previous"></div>
    <div id="next">
      <textarea id="next-phrase" ref={textareaRef}></textarea>
    </div>
    <button id="done" onClick={() => {
      game.addResponse(playerName, textareaRef.current!.value);
    } }>Done</button>
  </>;
}
