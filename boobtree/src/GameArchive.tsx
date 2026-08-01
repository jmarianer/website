import { cloneElement, ReactElement, useEffect, useState, useCallback } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { useCurrentGame } from "./database";
import { useSwipeable } from "react-swipeable";
import { IMAGE_HEIGHT, IMAGE_WIDTH, useSize, Textfit } from "./utils";
import { addressAtIndex, formatPath, parsePath, slideCount, slideIndex } from "./archiveAddress";

const REFERENCE_HEIGHT = 600;
const DRAWING_START = 200;
const TEXT_HEIGHT = 100;
const TEXT_START = 400;

export function GameArchive() {
  const { game } = useCurrentGame();
  const { id: gameId, archive, players, totalRounds } = game;
  const { '*': slidePath } = useParams();
  const navigate = useNavigate();

  // The current slide lives in the URL, so every slide is shareable.
  const archiveRoot = `/game/${gameId}/archive`;
  const address = parsePath(slidePath ?? '', game);
  const totalSlides = slideCount(game);
  const currentSlide = address ? slideIndex(address, game) : 0;

  const [archiveDiv, setArchiveDiv] = useState<HTMLDivElement | null>(null);
  const { height: slideHeight } = useSize(archiveDiv);
  const scalingFactor = slideHeight / REFERENCE_HEIGHT;

  // Doing this iteratively because sometimes declarative syntax is hard.
  const slides: ReactElement[] = [];
  let slideNo = 0;

  enum SlideType {
    FirstText, MiddleText, LastText, Drawing, Fullscreen
  }
  function addSlide(slideType: SlideType, contents: ReactElement<{className: string, style?: any}>) {
    let top = 0, minHeight = 'auto';

    if (slideType === SlideType.Fullscreen) {
      minHeight = '100%';
    }
    if (slideNo === currentSlide) {
      switch (slideType) {
        case SlideType.FirstText:
          top = 0;
          minHeight = slideHeight + 'px';
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
          minHeight = '0px';
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
          minHeight = slideHeight + 'px';
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
        minHeight = slideHeight + 'px';
      }
    }

    top *= scalingFactor;

    slides.push(cloneElement(contents, {
      className: 'slide',
      style: { top, minHeight }
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
              text={archive[roundNo][player] || ''}
            />
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
          text={archive[0][firstPlayer] || ''}
        />
        <div className="spacer" />
        <div className="player-name">Ended with {players[lastPlayer]}:</div>
        <Textfit
          className="text"
          width={IMAGE_WIDTH * scalingFactor}
          height={TEXT_HEIGHT * scalingFactor}
          text={archive[totalRounds - 1][lastPlayer] || ''}
        />
      </div>
    );
  }
  
  addSlide(
    SlideType.Fullscreen,
    <div key={`the-end`} className="fullscreen">
      ⛓️‍💥The end⛓️‍💥
    </div>
  );

  function goToSlide(index: number) {
    const clamped = Math.min(Math.max(index, 0), totalSlides - 1);
    const path = formatPath(addressAtIndex(clamped, game));
    // Replace rather than push, so Back still leaves the archive in one press
    // instead of walking back through every slide.
    navigate(`${archiveRoot}/${path}`, { replace: true });
  }
  function nextSlide() {
    goToSlide(currentSlide + 1);
  }
  function previousSlide() {
    goToSlide(currentSlide - 1);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown' || event.key === ' ' && !event.shiftKey) {
        event.preventDefault();
        nextSlide();
      } else if (event.key === 'ArrowUp' || event.key === ' ' && event.shiftKey) {
        event.preventDefault();
        previousSlide();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  const swipeHandlers = useSwipeable({
    onSwipedUp: nextSlide,
    onSwipedDown: previousSlide,
    preventScrollOnSwipe: true,
  })

  const setArchiveRefs = useCallback((r: HTMLDivElement) => {
    setArchiveDiv(r);
    swipeHandlers.ref(r);
  }, []);

  if (!address) {
    return <Navigate to={archiveRoot} replace />;
  }

  // Slide positions are all relative to the measured height, so hold off until
  // the container has been measured. Otherwise a deep link would render its
  // slide in the wrong place and then visibly animate into position.
  if (slideHeight === 0) {
    return <div className="archive" ref={setArchiveRefs} />;
  }

  return <div className="archive" {...swipeHandlers} ref={setArchiveRefs} >
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
