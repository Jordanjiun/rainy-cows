import { useTick } from '@pixi/react';
import { Assets, Rectangle, Texture } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { createSeededRNG, getCowScale } from './utils';

type Vec2 = { x: number; y: number };

const frameSize = Number(import.meta.env.VITE_COW_FRAME_SIZE);
const cowIdleWalkChance = Number(import.meta.env.VITE_COW_IDLE_WALK_CHANCE);
const cowMinTickIdle = Number(import.meta.env.VITE_COW_MIN_TICK_IDLE);
const cowMinTickWalk = Number(import.meta.env.VITE_COW_MIN_TICK_WALK);
const cowSheetCols = Number(import.meta.env.VITE_COW_SHEET_COLS);
const cowSpeed = Number(import.meta.env.VITE_COW_SPEED);
const cowWalkDelay = Number(import.meta.env.VITE_COW_WALK_DELAY_MS);
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

const animationsDef: Record<string, number[]> = {
  idle: [0],
  look: [0, 1, 2, 4, 5, 4, 2, 1],
  walk: [16, 17, 18, 19],
  walkHorizontal: [16, 17, 18, 19],
  walkDown: [20, 21, 22, 23],
  walkUp: [24, 25, 26, 27],
  walkHorizontalToIdle: [2, 1],
  idleToWalk: [0, 1, 2],
  walkToIdle: [2, 1, 0],
};

export function useCowRandomMovement(
  appWidth: number,
  appHeight: number,
  seed = Date.now(),
) {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const [animation, setAnimation] = useState<'idle' | 'walk'>('idle');
  const [direction, setDirection] = useState<1 | -1>(1);
  const [canMove, setCanMove] = useState(false);

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

  // Ensure cow stays in bounds when app resizes
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
    stateTimer.current += 1;

    // Decide whether to switch state
    if (animation === 'idle' && stateTimer.current >= cowMinTickIdle) {
      if (rng.current() < cowIdleWalkChance) {
        setAnimation('walk');
        stateTimer.current = 0;
        seedDirection();
        setCanMove(false);
        setTimeout(() => setCanMove(true), cowWalkDelay); // Delay movement start
      }
    } else if (animation === 'walk' && stateTimer.current >= cowMinTickWalk) {
      if (rng.current() < cowIdleWalkChance) {
        setAnimation('idle');
        stateTimer.current = 0;
        moveDir.current = { dx: 0, dy: 0 };
        setCanMove(false);
      }
    }

    if (animation === 'walk' && canMove) {
      let { dx, dy } = moveDir.current;
      dy += (rng.current() - 0.5) * 0.1;
      dx = dx >= 0 ? Math.abs(dx) : -Math.abs(dx);

      setPos((prev) => {
        let x = prev.x + dx * cowSpeed * delta;
        let y = prev.y + dy * cowSpeed * delta;
        const halfSize = (frameSize * cowScale) / 2;

        // Bounce off boundaries
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
  });

  return { pos, cowScale, animation, direction };
}

export function useCowKeyboardMovement(appWidth: number, appHeight: number) {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const [animation, setAnimation] = useState<
    'idle' | 'walkHorizontal' | 'walkDown' | 'walkUp'
  >('idle');
  const [direction, setDirection] = useState<1 | -1>(1);
  const keys = useRef<Record<string, boolean>>({});
  const cowScale = getCowScale(appWidth * appHeight);
  const landBoundary = appHeight * (1 - landRatio) - frameSize * cowScale + 10;

  // Ensure cow stays in bounds when app resizes
  useEffect(() => {
    setPos((prev) => {
      const cowScale = getCowScale(appWidth * appHeight);
      const landBoundary =
        appHeight * (1 - landRatio) - frameSize * cowScale + 10;

      let x = prev.x;
      let y = prev.y;
      const halfSize = (frameSize * cowScale) / 2;

      if (x < halfSize) x = halfSize;
      else if (x > appWidth - halfSize) x = appWidth - halfSize;

      if (y < landBoundary + halfSize) y = landBoundary + halfSize;
      else if (y > appHeight - halfSize) y = appHeight - halfSize;

      return { x, y };
    });
  }, [appWidth, appHeight]);

  // Keyboard input tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useTick((ticker) => {
    const delta = ticker.deltaTime;
    let dx = 0;
    let dy = 0;

    if (keys.current['w']) dy -= 1;
    if (keys.current['s']) dy += 1;
    if (keys.current['a']) dx -= 1;
    if (keys.current['d']) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len;
    dy /= len;

    // Determine animation and direction
    if (dx === 0 && dy === 0) {
      setAnimation('idle');
    } else if (Math.abs(dy) > Math.abs(dx)) {
      setAnimation(dy < 0 ? 'walkUp' : 'walkDown');
    } else {
      setAnimation('walkHorizontal');
      if (dx !== 0) setDirection(dx > 0 ? 1 : -1);
    }

    // Move cow
    if (dx !== 0 || dy !== 0) {
      setPos((prev) => {
        let x = prev.x + dx * cowSpeed * delta;
        let y = prev.y + dy * cowSpeed * delta;

        if (x < (frameSize * cowScale) / 2) x = (frameSize * cowScale) / 2;
        else if (x > appWidth - (frameSize * cowScale) / 2)
          x = appWidth - (frameSize * cowScale) / 2;

        if (y < landBoundary + (frameSize * cowScale) / 2)
          y = landBoundary + (frameSize * cowScale) / 2;
        else if (y > appHeight - (frameSize * cowScale) / 2)
          y = appHeight - (frameSize * cowScale) / 2;

        return { x, y };
      });
    }
  });

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
