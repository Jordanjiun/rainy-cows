import { useTick } from '@pixi/react';
import { Assets, Rectangle, Texture, Ticker } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { createSeededRNG, getCowScale } from './utils';

type Vec2 = { x: number; y: number };

const cowEatChance = Number(import.meta.env.VITE_COW_EAT_CHANCE);
const cowIdleWalkChance = Number(import.meta.env.VITE_COW_IDLE_WALK_CHANCE);
const cowMinTickIdle = Number(import.meta.env.VITE_COW_MIN_TICK_IDLE);
const cowMinTickWalk = Number(import.meta.env.VITE_COW_MIN_TICK_WALK);
const cowMsPerFrame = Number(import.meta.env.VITE_COW_MS_PER_FRAME);
const cowSheetCols = Number(import.meta.env.VITE_COW_SHEET_COLS);
const cowSpeed = Number(import.meta.env.VITE_COW_SPEED);

const frameSize = Number(import.meta.env.VITE_COW_FRAME_SIZE);
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

const animationsDef: Record<string, number[]> = {
  eat: [9, 10, 11, 11, 11, 10, 9],
  idle: [0],
  idleToWalk: [0, 1, 2],
  pet: [13, 14, 15, 14, 13],
  walk: [17, 18, 19],
  walkToIdle: [2, 1, 0],
};

export function useCowActions(
  appWidth: number,
  appHeight: number,
  seed: number,
) {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const [animation, setAnimation] = useState<'idle' | 'walk' | 'eat' | 'pet'>(
    'idle',
  );
  const [direction, setDirection] = useState<1 | -1>(1);
  const [canMove, setCanMove] = useState(false);
  const [isIdleActionPlaying, setIsIdleActionPlaying] = useState(false);
  const [isBeingPetted, setIsBeingPetted] = useState(false);

  const rng = useRef(createSeededRNG(seed));
  const moveDir = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const stateTimer = useRef(0);

  const cowScale = getCowScale(appWidth * appHeight);
  const cowHalfSize = (frameSize * cowScale) / 2;
  const landBoundary = appHeight * (1 - landRatio) - frameSize * cowScale + 10;

  function clampPosition(prev: Vec2, appWidth: number, appHeight: number) {
    let x = prev.x;
    let y = prev.y;

    if (x < cowHalfSize) x = cowHalfSize;
    else if (x > appWidth - cowHalfSize) x = appWidth - cowHalfSize;

    if (y < landBoundary + cowHalfSize) y = landBoundary + cowHalfSize;
    else if (y > appHeight - cowHalfSize) y = appHeight - cowHalfSize;

    return { x, y };
  }

  const handleEatAnimation = () => {
    if (animation === 'eat') {
      const timeout = setTimeout(() => {
        setAnimation('idle');
        setIsIdleActionPlaying(false);
      }, animationsDef['eat'].length * cowMsPerFrame);
      return () => clearTimeout(timeout);
    }
  };

  const petCow = () => {
    if (isBeingPetted) return;
    setIsBeingPetted(true);
    setAnimation('pet');
    setCanMove(false);
    setIsIdleActionPlaying(true);

    setTimeout(() => {
      setAnimation('idle');
      setIsIdleActionPlaying(false);
      setCanMove(true);
      setIsBeingPetted(false);
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

    if (
      (animation === 'idle' && !isIdleActionPlaying) ||
      animation === 'walk'
    ) {
      stateTimer.current += 1;
    }

    if (animation === 'idle') {
      if (!isIdleActionPlaying && rng.current() < cowEatChance) {
        setIsIdleActionPlaying(true);
        setAnimation('eat');
        return;
      }

      // Maybe start walking
      if (!isIdleActionPlaying && stateTimer.current >= cowMinTickIdle) {
        if (rng.current() < cowIdleWalkChance) {
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
      if (stateTimer.current >= cowMinTickWalk) {
        if (rng.current() < cowIdleWalkChance) {
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
          let x = prev.x + dx * cowSpeed * delta;
          let y = prev.y + dy * cowSpeed * delta;

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
          } else if (y > appHeight - cowHalfSize) {
            y = appHeight - cowHalfSize;
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

  return { pos, cowScale, animation, direction, petCow };
}

export function useCowAnimations() {
  const [animations, setAnimations] = useState<Record<
    string,
    Texture[]
  > | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const baseTexture = await Assets.load('cowblack0');
      const anims: Record<string, Texture[]> = {};

      for (const [name, indices] of Object.entries(animationsDef)) {
        const textures: Texture[] = [];

        for (const index of indices) {
          const row = Math.floor(index / cowSheetCols);
          const col = index % cowSheetCols;

          const frame = new Rectangle(
            col * frameSize,
            row * frameSize,
            frameSize,
            frameSize,
          );

          const cropped = new Texture({
            source: baseTexture.source,
            frame,
          });

          cropped.source.scaleMode = 'nearest';
          textures.push(cropped);
        }

        anims[name] = textures;
      }

      if (isMounted) setAnimations(anims);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return animations;
}
