import { extend } from '@pixi/react';
import { Graphics, Text } from 'pixi.js';
import { useCallback } from 'react';

extend({ Graphics, Text });

const barTextSep = 25;

export const LoadingBar = ({
  appWidth,
  appHeight,
  progress,
}: {
  appWidth: number;
  appHeight: number;
  progress: number;
}) => {
  const barWidth = appWidth * 0.6;
  const barHeight = appHeight * 0.05;
  const barX = (appWidth - barWidth) / 2;
  const barY = (appHeight - barHeight) / 2;

  const drawBackground = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, appWidth, appHeight);
      g.fill({ color: '#87CEEB' });
      g.rect(barX, barY - barTextSep, barWidth, barHeight);
      g.fill({ color: 'black' });
    },
    [appWidth, appHeight],
  );

  const drawProgress = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(barX, barY - barTextSep, (progress / 100) * barWidth, barHeight);
      g.fill({ color: 'green' });
    },
    [appWidth, appHeight, progress],
  );

  return (
    <>
      <pixiGraphics draw={drawBackground} />
      <pixiGraphics draw={drawProgress} />
      <pixiText
        text={`Loading... ${progress}%`}
        x={appWidth / 2}
        y={appHeight / 2 + barTextSep}
        anchor={0.5}
        style={{ fontSize: 24, fontFamily: 'pixelFont' }}
      />
    </>
  );
};
