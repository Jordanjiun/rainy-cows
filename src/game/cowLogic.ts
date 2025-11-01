import { useTick } from '@pixi/react';
import { Assets, Rectangle, Texture } from 'pixi.js';
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
  eat: [8, 9, 10, 11, 11, 11, 10, 9, 8],
  idle: [0],
  idleToWalk: [0, 1, 2],
  walk: [16, 17, 18, 19],
  walkToIdle: [2, 1, 0],
};

export function useCowActions(
  appWidth: number,
  appHeight: number,
  seed = Date.now(),
) {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const [animation, setAnimation] = useState<'idle' | 'walk' | 'eat'>('idle');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [canMove, setCanMove] = useState(false);
  const [isIdleActionPlaying, setIsIdleActionPlaying] = useState(false);

  const rng = useRef(createSeededRNG(seed));
  const moveDir = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const stateTimer = useRef(0);

  const cowScale = getCowScale(appWidth * appHeight);
  const landBoundary = appHeight * (1 - landRatio) - frameSize * cowScale;

  const seedDirection = () => {
    const dx = rng.current() < 0.5 ? 1 : -1;
    const dy = (rng.current() - 0.5) * 0.4;
    moveDir.current = { dx, dy };
    setDirection(dx >= 0 ? 1 : -1);
  };

  // Keep cow inside screen when resizing
  useEffect(() => {
    setPos((prev) => {
      const cowScale = getCowScale(appWidth * appHeight);
      const landBoundary =
        appHeight * (1 - landRatio) - frameSize * cowScale + 10;
      const halfSize = (frameSize * cowScale) / 2;
      let x = prev.x;
      let y = prev.y;

      if (x < halfSize) x = halfSize;
      else if (x > appWidth - halfSize) x = appWidth - halfSize;

      if (y < landBoundary + halfSize) y = landBoundary + halfSize;
      else if (y > appHeight - halfSize) y = appHeight - halfSize;

      return { x, y };
    });
  }, [appWidth, appHeight]);

  useTick((ticker) => {
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
          const halfSize = (frameSize * cowScale) / 2;

          // Bounce off edges
          if (x < halfSize) {
            x = halfSize;
            dx = Math.abs(dx);
            setDirection(1);
          } else if (x > appWidth - halfSize) {
            x = appWidth - halfSize;
            dx = -Math.abs(dx);
            setDirection(-1);
          }

          if (y < landBoundary + halfSize + 10) {
            y = landBoundary + halfSize + 10;
            dy = Math.abs(dy);
          } else if (y > appHeight - halfSize) {
            y = appHeight - halfSize;
            dy = -Math.abs(dy);
          }

          moveDir.current = { dx, dy };
          return { x, y };
        });
      }
    }
  });

  useEffect(() => {
    if (animation === 'eat') {
      const timeout = setTimeout(() => {
        setAnimation('idle');
        setIsIdleActionPlaying(false);
      }, animationsDef[animation].length * cowMsPerFrame);
      return () => clearTimeout(timeout);
    }
  }, [animation]);

  return { pos, cowScale, animation, direction };
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
