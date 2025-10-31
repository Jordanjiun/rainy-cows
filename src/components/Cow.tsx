import { extend, useTick } from '@pixi/react';
import { Assets, Rectangle, Sprite, Texture } from 'pixi.js';
import { useState, useRef, useEffect } from 'react';

extend({ Sprite });

type Vec2 = { x: number; y: number };
const frameSize = Number(import.meta.env.VITE_COW_FRAME_SIZE);
const cowMaxArea = Number(import.meta.env.VITE_COW_MAX_AREA);
const cowMinArea = Number(import.meta.env.VITE_COW_MIN_AREA);
const cowMaxScale = Number(import.meta.env.VITE_COW_MAX_SCALE);
const cowMinScale = Number(import.meta.env.VITE_COW_MIN_SCALE);
const cowSpeed = Number(import.meta.env.VITE_COW_SPEED);
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

function getCowScale(input: number) {
  if (input <= cowMinArea) return cowMinScale;
  if (input >= cowMaxArea) return cowMaxScale;
  return (
    cowMinScale +
    ((input - cowMinArea) * (cowMaxScale - cowMinScale)) /
      (cowMaxArea - cowMinArea)
  );
}

export const Cow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const [cowTexture, setCowTexture] = useState<Texture | null>(null);
  const cowScale = getCowScale(appWidth * appHeight);

  const direction = useRef<{ dx: number; dy: number }>({
    dx: Math.random() - 0.5,
    dy: Math.random() - 0.5,
  });

  const landBoundary = appHeight * (1 - landRatio) - frameSize * cowScale;

  useEffect(() => {
    Assets.load('cowblack0').then((texture) => {
      const frame = new Rectangle(0, 0, frameSize, frameSize);
      const cropped = new Texture({
        source: texture.source,
        frame,
      });
      setCowTexture(cropped);
    });
  }, []);

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

  if (!cowTexture) return null;
  cowTexture.source.scaleMode = 'nearest';

  return (
    <pixiSprite
      texture={cowTexture}
      x={pos.x}
      y={pos.y}
      scale={cowScale}
      anchor={0.5}
    />
  );
};
