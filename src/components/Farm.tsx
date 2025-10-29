import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { useCallback } from 'react';

extend({ Graphics });

const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

export const Farm = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const drawBackground = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, appWidth, appHeight * (1 - landRatio));
      g.fill({ color: '#87CEEB' });
      g.rect(
        0,
        appHeight - appHeight * landRatio,
        appWidth,
        appHeight * landRatio,
      );
      g.fill({ color: '#32CD32' });
    },
    [appWidth, appHeight],
  );

  return <pixiGraphics draw={drawBackground} />;
};
