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
    g.clear();
    g.setFillStyle({ color: 'green' });
    g.rect(0, 0, appWidth, appHeight);
    g.fill();
  }, []);

  return (
    <>
      <pixiGraphics draw={drawBackground} />
    </>
  );
};
