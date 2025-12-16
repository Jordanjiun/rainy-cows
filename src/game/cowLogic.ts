import { useTick } from '@pixi/react';
import { Ticker } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { createSeededRNG, getCowScale } from './utils';
import { useGameStore } from './store';
import { animationsDef } from './cowBuilder';
import { useAudio } from '../context/hooks';
import { cowConfig } from '../data/cowData';
import type { Cow } from './cowModel';

type AnimationKey = 'eat' | 'idle' | 'pet' | 'walk';
type AnimationOptions = {
  blockMovement?: boolean;
  setIdleAfter?: boolean;
};
type Vec2 = { x: number; y: number };

const cowMsPerFrame = cowConfig.msPerFrame;
const frameSize = cowConfig.frameSize;
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);
const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export function useCowActions(appWidth: number, appHeight: number, cow: Cow) {
  const { audioMap } = useAudio();
  const { addStats } = useGameStore();
  const cowScale = getCowScale(appWidth * appHeight);
  const cowHalfSize = (frameSize * cowScale) / 2;
  const landBoundary = appHeight * (1 - landRatio) - frameSize * cowScale + 10;

  const animationTimeoutRef = useRef<number | null>(null);
  const eatCooldown = useRef(0);
  const isBeingPetted = useRef(false);
  const moveDir = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const rng = useRef(createSeededRNG(cow.seed));
  const stateTimer = useRef(0);

  const [pos, setPos] = useState<Vec2>(() =>
    getRandomStartPosition(appWidth, appHeight, rng.current),
  );
  const [animation, setAnimation] = useState<'idle' | 'walk' | 'eat' | 'pet'>(
    'idle',
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const [canMove, setCanMove] = useState(false);
  const [isIdleActionPlaying, setIsIdleActionPlaying] = useState(false);

  function getRandomStartPosition(
    appWidth: number,
    appHeight: number,
    rng: () => number,
  ) {
    const minX = cowHalfSize;
    const maxX = appWidth - cowHalfSize;
    const minY = landBoundary + cowHalfSize;
    const maxY = appHeight - footerHeight - cowHalfSize;
    const x = minX + rng() * (maxX - minX);
    const y = minY + rng() * (maxY - minY);

    return { x, y };
  }

  function clampPosition(prev: Vec2, appWidth: number, appHeight: number) {
    let x = prev.x;
    let y = prev.y;

    if (x < cowHalfSize) x = cowHalfSize;
    else if (x > appWidth - cowHalfSize) x = appWidth - cowHalfSize;

    if (y < landBoundary + cowHalfSize) y = landBoundary + cowHalfSize;
    else if (y > appHeight - footerHeight - cowHalfSize)
      y = appHeight - footerHeight - cowHalfSize;

    return { x, y };
  }

  const playAnimation = (
    animName: AnimationKey,
    options: AnimationOptions = {},
  ) => {
    const { blockMovement = false, setIdleAfter = true } = options;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    setAnimation(animName);
    setIsIdleActionPlaying(true);
    setCanMove(!blockMovement);

    if (setIdleAfter) {
      animationTimeoutRef.current = setTimeout(() => {
        setAnimation('idle');
        setIsIdleActionPlaying(false);
        setCanMove(true);
        animationTimeoutRef.current = null;
      }, animationsDef[animName].length * cowMsPerFrame);
    }
  };

  const handleEatAnimation = () => {
    if (animation === 'eat') {
      playAnimation('eat');
    }
  };

  const handlePetAnimation = () => {
    if (isBeingPetted.current) return;
    var soundId = audioMap.moo.play();
    audioMap.moo.rate(cow.pitch ?? 1, soundId);
    isBeingPetted.current = true;
    addStats('cowsPet');
    playAnimation('pet');
    setTimeout(() => {
      isBeingPetted.current = false;
    }, animationsDef['pet'].length * cowMsPerFrame);
  };

  const seedDirection = () => {
    const dx = rng.current() < 0.5 ? 1 : -1;
    const dy = (rng.current() - 0.5) * 0.4;
    moveDir.current = { dx, dy };
    setDirection(dx >= 0 ? 1 : -1);
  };

  const updateCow = (ticker: Ticker) => {
    const delta = ticker.deltaTime;

    if (eatCooldown.current > 0) {
      eatCooldown.current -= 1;
    }

    if (
      (animation === 'idle' && !isIdleActionPlaying) ||
      animation === 'walk'
    ) {
      stateTimer.current += 1;
    }

    if (animation === 'idle') {
      if (
        !isIdleActionPlaying &&
        eatCooldown.current <= 0 &&
        rng.current() < cowConfig.eatChance * cow.stats.eatChance
      ) {
        setIsIdleActionPlaying(true);
        setAnimation('eat');
        eatCooldown.current = cowConfig.eatCooldown;
        return;
      }

      // Maybe start walking
      if (!isIdleActionPlaying && stateTimer.current >= cowConfig.minTickIdle) {
        if (rng.current() < cowConfig.idleWalkChance) {
          setAnimation('walk');
          stateTimer.current = 0;
          seedDirection();
          setCanMove(false);
          setTimeout(
            () => setCanMove(true),
            animationsDef['idleToWalk'].length * cowMsPerFrame,
          );
        }
      }
    } else if (animation === 'walk') {
      if (stateTimer.current >= cowConfig.minTickWalk) {
        if (rng.current() < cowConfig.idleWalkChance) {
          setAnimation('idle');
          stateTimer.current = 0;
          moveDir.current = { dx: 0, dy: 0 };
          setCanMove(false);
          setIsIdleActionPlaying(true);
          setTimeout(() => {
            setIsIdleActionPlaying(false);
            setCanMove(true);
          }, animationsDef['walkToIdle'].length * cowMsPerFrame);
        }
      }

      if (canMove) {
        let { dx, dy } = moveDir.current;
        dy += (rng.current() - 0.5) * 0.1;
        dx = dx >= 0 ? Math.abs(dx) : -Math.abs(dx);

        setPos((prev) => {
          let x = prev.x + dx * cowConfig.speed * delta;
          let y = prev.y + dy * cowConfig.speed * delta;

          // Bounce off edges
          if (x < cowHalfSize) {
            x = cowHalfSize;
            dx = Math.abs(dx);
            setDirection(1);
          } else if (x > appWidth - cowHalfSize) {
            x = appWidth - cowHalfSize;
            dx = -Math.abs(dx);
            setDirection(-1);
          }

          if (y < landBoundary + cowHalfSize) {
            y = landBoundary + cowHalfSize;
            dy = Math.abs(dy);
          } else if (y > appHeight - footerHeight - cowHalfSize) {
            y = appHeight - footerHeight - cowHalfSize;
            dy = -Math.abs(dy);
          }

          moveDir.current = { dx, dy };
          return { x, y };
        });
      }
    }
  };

  useEffect(() => {
    setPos((prev) => clampPosition(prev, appWidth, appHeight));
  }, [appWidth, appHeight]);

  useTick((ticker) => {
    updateCow(ticker);
  });

  useEffect(() => {
    handleEatAnimation();
  }, [animation]);

  return { pos, cowScale, animation, direction, handlePetAnimation };
}
