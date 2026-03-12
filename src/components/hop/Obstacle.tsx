import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback } from 'react';

extend({ Graphics });

export const Obstacle = ({
  x,
  width,
  height,
  groundY,
}: {
  x: number;
  width: number;
  height: number;
  groundY: number;
}) => {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, -height, width, height);
      g.fill({ color: 'green' });
    },
    [width, height],
  );

  return <pixiGraphics draw={draw} x={x} y={groundY} />;
};
