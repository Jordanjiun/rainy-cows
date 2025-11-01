import { useTick } from '@pixi/react';
import { Assets, Rectangle, Texture } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';

type Vec2 = { x: number; y: number };

const frameSize = Number(import.meta.env.VITE_COW_FRAME_SIZE);
const cowMaxArea = Number(import.meta.env.VITE_COW_MAX_AREA);
const cowMinArea = Number(import.meta.env.VITE_COW_MIN_AREA);
const cowMaxScale = Number(import.meta.env.VITE_COW_MAX_SCALE);
const cowMinScale = Number(import.meta.env.VITE_COW_MIN_SCALE);
const cowSheetCols = Number(import.meta.env.VITE_COW_SHEET_COLS);
const cowSpeed = Number(import.meta.env.VITE_COW_SPEED);
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

const animationsDef: Record<string, number[]> = {
  idle: [0],
  look: [0, 1, 2, 4, 5, 4, 2, 1],
  walk: [40, 41, 42, 43],
};

export function getCowScale(input: number) {
  if (input <= cowMinArea) return cowMinScale;
  if (input >= cowMaxArea) return cowMaxScale;
  return (
    cowMinScale +
    ((input - cowMinArea) * (cowMaxScale - cowMinScale)) /
      (cowMaxArea - cowMinArea)
  );
}

export function useCowRandomMovement(appWidth: number, appHeight: number) {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const direction = useRef<{ dx: number; dy: number }>({
    dx: Math.random() - 0.5,
    dy: Math.random() - 0.5,
  });

  const cowScale = getCowScale(appWidth * appHeight);
  const landBoundary = appHeight * (1 - landRatio) - frameSize * cowScale;

  useTick((ticker) => {
    const delta = ticker.deltaTime;

    setPos((prev) => {
      let x = prev.x;
      let y = prev.y;
      let { dx, dy } = direction.current;

      dx += (Math.random() - 0.5) * 0.1;
      dy += (Math.random() - 0.5) * 0.1;

      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= len;
      dy /= len;

      x += dx * cowSpeed * delta;
      y += dy * cowSpeed * delta;

      if (x < 0 + (frameSize * cowScale) / 2) {
        x = (frameSize * cowScale) / 2;
        dx = Math.abs(dx);
      } else if (x > appWidth - (frameSize * cowScale) / 2) {
        x = appWidth - (frameSize * cowScale) / 2;
        dx = -Math.abs(dx);
      }

      if (y < landBoundary + (frameSize * cowScale) / 2) {
        y = landBoundary + (frameSize * cowScale) / 2;
        dy = Math.abs(dy);
      } else if (y > appHeight - (frameSize * cowScale) / 2) {
        y = appHeight - (frameSize * cowScale) / 2;
        dy = -Math.abs(dy);
      }

      direction.current = { dx, dy };
      return { x, y };
    });
  });

  return { pos, cowScale };
}

export function useCowKeyboardMovement(appWidth: number, appHeight: number) {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const keys = useRef<Record<string, boolean>>({});
  const cowScale = getCowScale(appWidth * appHeight);
  const landBoundary = appHeight * (1 - landRatio) - frameSize * cowScale + 10;

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

    if (dx !== 0 || dy !== 0) {
      setPos((prev) => {
        let x = prev.x + dx * cowSpeed * delta;
        let y = prev.y + dy * cowSpeed * delta;

        if (x < 0 + (frameSize * cowScale) / 2) x = (frameSize * cowScale) / 2;
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

  return { pos, cowScale };
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
