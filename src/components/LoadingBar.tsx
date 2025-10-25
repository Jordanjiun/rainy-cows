import { extend } from '@pixi/react';
import { Graphics, Text } from 'pixi.js';
import { useCallback } from 'react';

extend({ Graphics, Text });

export const LoadingBar = ({
  width,
  height,
  progress,
}: {
  width: number;
  height: number;
  progress: number;
}) => {
  const drawBackground = useCallback((g: Graphics) => {
    g.clear();
    g.setFillStyle({ color: 'black' });
    g.rect(0, 0, width, height);
    g.fill();
  }, []);

  const drawProgress = useCallback(
    (g: Graphics) => {
      g.clear();
      g.setFillStyle({ color: 'green' });
      g.rect(0, 0, (progress / 100) * width, height);
      g.fill();
    },
    [progress],
  );

  return (
    <>
      <pixiGraphics draw={drawBackground} />
      <pixiGraphics draw={drawProgress} />
      <pixiText
        text={`Loading... ${progress}%`}
        x={width / 2}
        y={height * 2}
        anchor={0.5}
        style={{
          fill: 'white',
          fontSize: 24,
          fontFamily: 'Arial',
        }}
      />
    </>
  );
};
