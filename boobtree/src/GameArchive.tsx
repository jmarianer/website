import { cloneElement, ReactElement, useEffect, useState } from "react";
import { useCurrentGame } from "./database";
import { useSwipeable } from "react-swipeable";

export function GameArchive() {
  const { game: { archive, players, totalRounds } } = useCurrentGame();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Doing this iteratively because sometimes declarative syntax is hard.
  const slides: ReactElement[] = [];
  let slideNo = 0;

  function addSlide(contents: ReactElement<{className: string}>) {
    const additionalClass =
      slideNo === currentSlide
      ? "current"
      : slideNo === currentSlide - 1
      ? "previous"
      : slideNo < currentSlide
      ? "past"
      : "future";
    slides.push(cloneElement(contents, {
      className: `slide ${contents.props.className} ${additionalClass}`,
    }));
    slideNo++;
  }

  for (let chainNo = 0; chainNo < players.length; chainNo++) {
    const firstPlayer = chainNo;
    const lastPlayer = (chainNo + totalRounds - 1) % players.length;
    addSlide(
      <div key={`chain-${chainNo}-title`} className="fullscreen">
        ⛓️‍💥Chain {chainNo + 1}⛓️‍💥
      </div>
    );

    for (let roundNo = 0; roundNo < totalRounds; roundNo++) {
      const player = (chainNo + roundNo) % players.length;
      const key = `chainplayer-${chainNo}-round-${roundNo}`;

      if (roundNo % 2 === 1) {
        addSlide(
          <div key={key} className="drawing">
            <div className="player-name">{players[player]} drew:</div>
            <img src={archive[roundNo][player]!} alt={`Round ${roundNo} drawing by ${players[player]}`} />
          </div>
        );
      } else {
        addSlide(
          <div key={key} className="description">
            <div className="player-name">{players[player]} wrote:</div>
            <div className="text">{archive[roundNo][player]}</div>
          </div>
        );
      }
    }

    addSlide(
      <div key={`chain-${chainNo}-end`} className="fullscreen">
        <div className="player-name">Started with {players[firstPlayer]}:</div>
        <div className="text">{archive[0][firstPlayer]}</div>
        <div className="spacer" />
        <div className="player-name">Ended with {players[lastPlayer]}:</div>
        <div className="text">{archive[totalRounds - 1][lastPlayer]}</div>
      </div>
    );
  }
  
  addSlide(
    <div key={`the-end`} className="fullscreen">
      ⛓️‍💥The end⛓️‍💥
    </div>
  );
  const totalSlides = slideNo;

  function nextSlide() {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }
  function previousSlide() {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === ' ') {
      event.preventDefault();
      nextSlide();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      previousSlide();
    }
  }

  const handlers = useSwipeable({
    onSwipedUp: nextSlide,
    onSwipedDown: previousSlide,
    preventScrollOnSwipe: true,
  })

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return <div className="archive" {...handlers}>
    {slides}
    <div className="controls">
      <div onClick={previousSlide} id="previous-slide" style={{visibility: currentSlide === 0 ? 'hidden' : 'visible'}}>
        <svg width="23" height="12">
          <path d="M2 10 L12 2 L22 10" />
        </svg>
      </div>
      <div onClick={nextSlide} id="next-slide" style={{visibility: currentSlide === totalSlides - 1 ? 'hidden' : 'visible'}}>
        <svg width="23" height="12">
          <path d="M2 2 L12 10 L22 2" />
        </svg>
      </div>
    </div>
  </div>;
}
