import { useParams } from "react-router";
import { database, useCurrentGame } from "./database";
import { ref, set } from "firebase/database";
import { useEffect } from "react";

export function GameInProgress() {
  const { started, archive, current_round, players } = useCurrentGame();
  const params = useParams();
  const playerName = params.name!;
  const id = params.id!;

  useEffect(() => {
    if (players.every((player) => player in archive[current_round])) {
      set(ref(database, `boobtree/${id}/current_round`), current_round + 1);
    }
  }, [current_round, archive]);

  if (!started) {
    return <div>The game hasn't started yet. Please wait for the admin to start the game.</div>;
  }

  if (playerName in archive[current_round]) {
    return <div>Waiting for other players to finish round {current_round}...</div>;
  }
  const previousPlayer = useCurrentGame().previous_player[playerName!];

  if (current_round == 0) {
    return <>
      <div id="instructions">Write a phrase here</div>
      <div id="previous"></div>
      <div id="next">
        <textarea id="next-phrase"></textarea>
      </div>
      <button id="done" onClick={() => {
        set(ref(database, `boobtree/${id}/archive/${current_round}/${playerName}`), (document.getElementById('next-phrase') as HTMLTextAreaElement).value);
      }}>Done</button>
    </>;
  } else if (current_round % 2 == 1) {
    return <>
      <div id="instructions">Draw the phrase:</div>
      <div id="previous">
        <span>{archive[current_round - 1][previousPlayer]}</span>
      </div>
      <div id="next">
        <canvas id="next-drawing-canvas"></canvas>
      </div>
      <button id="done">Done</button>
    </>;
  } else {
    return <>
      <div id="instructions">Guess the phrase:</div>
      <div id="drawing-image">[image]</div>
      <input type="text" id="guess-input" />
      <button id="done">Done</button>
    </>;
  }
}