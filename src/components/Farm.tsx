import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback } from 'react';

extend({ Graphics });

export const Farm = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const drawBackground = useCallback((g: Graphics) => {
    g.rect(0, 0, appWidth, appHeight);
    g.fill({ color: 'green' });
  }, []);

  const drawPointers = useCallback((g: Graphics) => {
    g.circle(0, 0, 10);
    g.circle(0, appHeight, 10);
    g.circle(appWidth, 0, 10);
    g.circle(appWidth, appHeight, 10);
    g.fill({ color: 'red' });
  }, []);

  return (
    <>
      <pixiGraphics draw={drawBackground} />
      <pixiGraphics draw={drawPointers} />
    </>
  );
};
