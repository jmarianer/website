import { cloneElement, ReactElement, useEffect, createRef, useState } from "react";
import { useCurrentGame } from "./database";
import { useSwipeable } from "react-swipeable";
import { IMAGE_HEIGHT, IMAGE_WIDTH, useSize, Textfit } from "./utils";

const REFERENCE_HEIGHT = 600;
const DRAWING_START = 200;
const TEXT_HEIGHT = 100;
const TEXT_START = 350;

export function GameArchive() {
  const { game: { archive, players, totalRounds } } = useCurrentGame();
  const [currentSlide, setCurrentSlide] = useState(0);

  const archiveRef = createRef<HTMLDivElement>();
  const { height: slideHeight } = useSize(archiveRef);
  const scalingFactor = slideHeight / REFERENCE_HEIGHT;

  // Doing this iteratively because sometimes declarative syntax is hard.
  const slides: ReactElement[] = [];
  let slideNo = 0;

  enum SlideType {
    FirstText, MiddleText, LastText, Drawing, Fullscreen
  }
  function addSlide(slideType: SlideType, contents: ReactElement<{className: string, style?: any}>) {
    let top = 0, height = 'auto';

    if (slideType === SlideType.Fullscreen) {
      height = '100%';
    }
    if (slideNo === currentSlide) {
      switch (slideType) {
        case SlideType.FirstText:
          top = 0;
          height = slideHeight + 'px';
          break;
        case SlideType.MiddleText:
        case SlideType.LastText:
          top = TEXT_START;
          break;
        case SlideType.Drawing:
          top = DRAWING_START;
          break;
        case SlideType.Fullscreen:
          top = 0;
          break;
      }
    } else if (slideNo === currentSlide - 1) {
      switch (slideType) {
        case SlideType.FirstText:
          top = 0;
          height = '200px';
          break;
        case SlideType.MiddleText:
        case SlideType.Drawing:
          top = 0;
          break;
        case SlideType.LastText:
        case SlideType.Fullscreen:
          top = -2 * REFERENCE_HEIGHT;
          break;
      }
    } else if (slideNo < currentSlide) {
      switch (slideType) {
        case SlideType.Drawing:
          top = -2 * REFERENCE_HEIGHT - DRAWING_START;
          break;
        case SlideType.FirstText:
          height = slideHeight + 'px';
          top = -2 * REFERENCE_HEIGHT;
          break;
        case SlideType.MiddleText:
        case SlideType.LastText:
        case SlideType.Fullscreen:
          top = -2 * REFERENCE_HEIGHT;
          break;
      }
    } else {
      top = REFERENCE_HEIGHT * 1.25;
      if (slideType === SlideType.FirstText) {
        height = slideHeight + 'px';
      }
    }

    slides.push(cloneElement(contents, {
      className: 'slide',
      style: {
        top: top * scalingFactor,
        height,
      }
    }));

    slideNo++;
  }

  for (let chainNo = 0; chainNo < players.length; chainNo++) {
    const firstPlayer = chainNo;
    const lastPlayer = (chainNo + totalRounds - 1) % players.length;
    addSlide(
      SlideType.Fullscreen,
      <div key={`chain-${chainNo}-title`}>
        ⛓️‍💥Chain {chainNo + 1}⛓️‍💥
      </div>
    );

    for (let roundNo = 0; roundNo < totalRounds; roundNo++) {
      const player = (chainNo + roundNo) % players.length;
      const key = `chainplayer-${chainNo}-round-${roundNo}`;

      if (roundNo % 2 === 1) {
        addSlide(
          SlideType.Drawing,
          <div key={key}>
            <div className="player-name">{players[player]} drew:</div>
            <img
              style={{
                width: IMAGE_WIDTH * scalingFactor,
                height: IMAGE_HEIGHT * scalingFactor,
              }}
              src={archive[roundNo][player]!}
              alt={`Round ${roundNo} drawing by ${players[player]}`} />
          </div>
        );
      } else {
        addSlide(
          roundNo === 0 ? SlideType.FirstText : roundNo === totalRounds - 1 ? SlideType.LastText : SlideType.MiddleText,
          <div key={key}>
            <div className="player-name">{players[player]} wrote:</div>
            <Textfit
              className="text"
              width={IMAGE_WIDTH * scalingFactor}
              height={TEXT_HEIGHT * scalingFactor}
            >{archive[roundNo][player]}</Textfit>
          </div>
        );
      }
    }

    addSlide(
      SlideType.Fullscreen,
      <div key={`chain-${chainNo}-end`}>
        <div className="player-name">Started with {players[firstPlayer]}:</div>
        <Textfit
          className="text"
          width={IMAGE_WIDTH * scalingFactor}
          height={TEXT_HEIGHT * scalingFactor}
        >{archive[0][firstPlayer]}</Textfit>
        <div className="spacer" />
        <div className="player-name">Ended with {players[lastPlayer]}:</div>
        <Textfit
          className="text"
          width={IMAGE_WIDTH * scalingFactor}
          height={TEXT_HEIGHT * scalingFactor}
        >{archive[totalRounds - 1][lastPlayer]}</Textfit>
      </div>
    );
  }
  
  addSlide(
    SlideType.Fullscreen,
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
    if (event.key === 'ArrowDown' || event.key === ' ' && !event.shiftKey) {
      event.preventDefault();
      nextSlide();
    } else if (event.key === 'ArrowUp' || event.key === ' ' && event.shiftKey) {
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

  return <div className="archive" {...handlers} ref={archiveRef}>
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
