import { useEffect, useRef } from "react";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import { useCurrentGame } from "./database";

export function GameArchive() {
  const { archive, players } = useCurrentGame();

  const deckDivRef = useRef<HTMLDivElement>(null); // reference to deck container div
  const deckRef = useRef<Reveal.Api | null>(null); // reference to deck reveal instance

  useEffect(() => {
    if (deckRef.current) return;

    deckRef.current = new Reveal(deckDivRef.current!, {
      transition: "slide",
    });
    deckRef.current.initialize();

    return () => {
      try {
        if (deckRef.current) {
          deckRef.current.destroy();
          deckRef.current = null;
        }
      } catch (e) {
        console.warn("Reveal.js destroy call failed.");
      }
    };
  }, []);

  return (
    // Your presentation is sized based on the width and height of
    // our parent element. Make sure the parent is not 0-height.
    <div className="archive reveal" ref={deckDivRef}>
      <div className="slides">
        {players.map((_, i) =>
          <>
            <section key={`player-${i}-title`}>
              Chain {i+1}
            </section>
            {archive.map((round, j) => {
              const player = players[(i + j) % players.length];
              return (
                <section key={`player-${i}-round-${j}`}>
                  {j % 2 === 1 ? (
                    <>
                      <div>{player} drew:</div>
                      <img src={round[player]} alt={`Round ${j} drawing by ${player}`} />
                    </>
                  ) : (
                    <>
                      <div>{player} wrote:</div>
                      <div id="text">{round[player]}</div>
                    </>
                  )}
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
