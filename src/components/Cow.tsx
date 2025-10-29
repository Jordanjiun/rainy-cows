import { extend, useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback, useState, useRef } from 'react';

extend({ Graphics });

type Vec2 = { x: number; y: number };
const cowSize = Number(import.meta.env.VITE_COW_SIZE);
const cowSpeed = Number(import.meta.env.VITE_COW_SPEED);
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

export const Cow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const [pos, setPos] = useState<Vec2>({ x: appWidth / 2, y: appHeight / 2 });
  const direction = useRef<{ dx: number; dy: number }>({
    dx: Math.random() - 0.5,
    dy: Math.random() - 0.5,
  });
  const landBoundary = appHeight * (1 - landRatio) - cowSize;

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

      if (x < 0) {
        x = 0;
        dx = Math.abs(dx);
      } else if (x > appWidth - cowSize) {
        x = appWidth - cowSize;
        dx = -Math.abs(dx);
      }

      if (y < landBoundary) {
        y = landBoundary;
        dy = Math.abs(dy);
      } else if (y > appHeight - cowSize) {
        y = appHeight - cowSize;
        dy = -Math.abs(dy);
      }

      direction.current = { dx, dy };
      return { x, y };
    });
  });

  const drawCow = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(pos.x, pos.y, cowSize, cowSize);
      g.fill({ color: 'white' });
    },
    [pos],
  );

  return <pixiGraphics draw={drawCow} />;
};
