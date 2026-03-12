import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback } from 'react';

extend({ Graphics });

export const Player = ({
  x,
  y,
  size,
}: {
  x: number;
  y: number;
  size: number;
}) => {
  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, size, size);
      g.fill({ color: 'white' });
    },
    [size],
  );

  return <pixiGraphics draw={draw} x={x} y={y} />;
};
