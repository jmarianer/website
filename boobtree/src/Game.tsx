import { useParams } from "react-router";
import { database, useCurrentGame } from "./database";
import { ref, set } from "firebase/database";

export function GameInProgress() {
  const { started, archive, current_round } = useCurrentGame();
  const { name: playerName, id } = useParams();

  if (!started) {
    return <div>The game hasn't started yet. Please wait for the admin to start the game.</div>;
  }

  if (playerName! in archive[current_round]) {
    return <div>Waiting for other players to finish round {current_round}...</div>;
  }
  const previousPlayer = useCurrentGame().previous_player[playerName!];

  if (current_round == 0) {
    return <>
      <div>Write a phrase here</div>
      <textarea id="next-phrase"></textarea>
      <button id="done" onClick={() => {
        console.log('dfas');
        set(ref(database, `boobtree/${id}/archive/${current_round}/${playerName}`), (document.getElementById('next-phrase') as HTMLTextAreaElement).value);
      }}>Done</button>
    </>;
  } else if (current_round % 2 == 1) {
    return <>
      <div>Draw the phrase:</div>
      <span id="previous-text">{archive[current_round-1][previousPlayer]}</span>
      <div id="next-drawing">
        <canvas id="next-drawing-canvas"></canvas>
      </div>
      <button id="done">Done</button>
    </>;
  } else {
    return <>
      <div>Guess the phrase:</div>
      <div id="drawing-image">[image]</div>
      <input type="text" id="guess-input" />
      <button id="done">Done</button>
    </>;
  }
}