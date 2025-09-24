import { ReactElement, useEffect, useState } from "react";
import { useCurrentGame } from "./database";

export function GameArchive() {
  const { game: { archive, players, totalRounds } } = useCurrentGame();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Doing this iteratively because sometimes declarative syntax is hard.
  // TODO can definitely refactor this: factor out an "addSlide" function, perhaps?
  const slides: ReactElement[] = [];
  let slideNo = 0;
  for (let chainNo = 0; chainNo < players.length; chainNo++) {
    const firstPlayer = chainNo;
    const lastPlayer = (chainNo + totalRounds - 1) % players.length;
    slides.push(
      <div key={`chain-${chainNo}-title`} className={slideNo === currentSlide ? "slide fullscreen current" : slideNo < currentSlide ? "slide fullscreen past" : "slide fullscreen future"}>
        ⛓️‍💥Chain {chainNo + 1}⛓️‍💥
      </div>
    );
    slideNo++;

    for (let roundNo = 0; roundNo < totalRounds; roundNo++) {
      const player = (chainNo + roundNo) % players.length;
      const key = `chainplayer-${chainNo}-round-${roundNo}`;
      const additionalClass =
        slideNo === currentSlide
          ? "current"
          : slideNo === currentSlide - 1 && roundNo < totalRounds - 1
          ? "previous"
          : slideNo < currentSlide
          ? "past"
          : "future";

      if (roundNo % 2 === 1) {
        slides.push(
          <div key={key} className={`slide drawing ${additionalClass}`}>
            <div className="player-name">{players[player]} drew:</div>
            <img src={archive[roundNo][player]!} alt={`Round ${roundNo} drawing by ${player}`} />
          </div>
        );
      } else {
        slides.push(
          <div key={key} className={`slide description ${additionalClass} ${roundNo === 0 ? "first" : ""}`}>
            <div className="player-name">{players[player]} wrote:</div>
            <div className="text">{archive[roundNo][player]}</div>
          </div>
        );
      }
      slideNo++;
    }

    slides.push(
      <div key={`chain-${chainNo}-end`} className={slideNo === currentSlide ? "slide fullscreen current" : slideNo < currentSlide ? "slide fullscreen past" : "slide fullscreen future"}>
        <div className="player-name">Started with {players[firstPlayer]}:</div>
        <div className="text">{archive[0][firstPlayer]}</div>
        <div className="spacer" />
        <div className="player-name">Ended with {players[lastPlayer]}:</div>
        <div className="text">{archive[totalRounds - 1][lastPlayer]}</div>
      </div>
    );
    slideNo++;
  }
  
  slides.push(
    <div className={slideNo === currentSlide ? "slide fullscreen current" : slideNo < currentSlide ? "slide fullscreen past" : "slide fullscreen future"}>
      ⛓️‍💥The end⛓️‍💥
    </div>
  );
  slideNo++;
  const totalSlides = slideNo;

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === ' ') {
      event.preventDefault();
      setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCurrentSlide((prev) => Math.max(prev - 1, 0));
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <div className="archive">{slides}</div>;
}
