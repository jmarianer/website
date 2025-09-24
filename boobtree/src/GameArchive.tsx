import { useEffect, useRef } from "react";
import Reveal from "reveal.js";
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import { useCurrentGame } from "./database";

export function GameArchive() {
  const { game: { archive, players, totalRounds } } = useCurrentGame();

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
    <div className="archive reveal" ref={deckDivRef}>
      <div className="slides">
        {players.map((_, chainNo) => {
          const lastPlayer = (chainNo + totalRounds - 1) % players.length;
          return <>
            <section key={`chain-${chainNo}-title`}>
              Chain {chainNo+1}
            </section>
            {archive.map((round, roundNo) => {
              const player = (chainNo + roundNo) % players.length;
              return (
                <section key={`chainplayer-${chainNo}-round-${roundNo}`}>
                  {roundNo % 2 === 1 ? (
                    <>
                      <div>{players[player]} drew:</div>
                      <img src={round[player]!} alt={`Round ${roundNo} drawing by ${player}`} />
                    </>
                  ) :
                    <>
                      <div>{players[player]} wrote:</div>
                      <div className="text">{round[player]}</div>
                    </>
                  }
                </section>
              );
            })}
            <section key={`chain-${chainNo}-end`}>
              <div>Started with {players[chainNo]}:</div>
              <div className="text">{archive[0][chainNo]}</div>
              <div>Ended with {players[lastPlayer]}:</div>
              <div className="text">{archive[totalRounds - 1][lastPlayer]}</div>
            </section>
          </>
        })}
      </div>
    </div>
  );
}
