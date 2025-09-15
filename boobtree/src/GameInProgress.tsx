import { Navigate, useParams } from "react-router";
import { useCurrentGame } from "./database";
import { useEffect, useRef } from "react";
import { Canvas, PencilBrush } from "fabric";

export function GameInProgress() {
  const game = useCurrentGame();
  const { started, archive, current_round, players, total_rounds } = game;
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
  if (current_round >= total_rounds) {
    return <Navigate to={`/game/${id}/archive`} />;
  }

  if (playerName in archive[current_round]) {
    return <div>Waiting for other players to finish round {current_round+1}...</div>;
  }
  if (current_round === 0) {
    return <FirstRound />;
  } else if (current_round % 2 === 1) {
    return <DrawingRound />;
  } else {
    return <WritingRound />;
  }
}

function WritingRound() {
  const game = useCurrentGame();
  const { current_round, archive, previous_player } = game;
  const params = useParams();
  const playerName = params.name!;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  return <>
    <div id="instructions">Describe that drawing below</div>
    <div id="previous">
      <img id="previous-drawing-image" src={archive[current_round - 1][previous_player[playerName]]} alt="Previous drawing" />
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
  const { archive, current_round, previous_player } = game;
  const params = useParams();
  const playerName = params.name!;

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
      <span>{archive[current_round - 1][previous_player[playerName]]}</span>
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
  const params = useParams();
  const playerName = params.name!;

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
