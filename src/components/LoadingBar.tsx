import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback } from 'react';

extend({ Container, Graphics, Text });

export const LoadingBar = ({ progress }: { progress: number }) => {
  const drawBackground = useCallback((g: Graphics) => {
    g.clear();
    g.setFillStyle({ color: 'black' });
    g.rect(0, 0, 300, 20);
    g.fill();
  }, []);

  const drawProgress = useCallback(
    (g: Graphics) => {
      g.clear();
      g.setFillStyle({ color: 'green' });
      g.rect(0, 0, (progress / 100) * 300, 20);
      g.fill();
    },
    [progress],
  );

  return (
    <pixiContainer x={250} y={290}>
      <pixiGraphics draw={drawBackground} />
      <pixiGraphics draw={drawProgress} />
      <pixiText
        text={`Loading... ${progress}%`}
        x={150}
        y={40}
        anchor={0.5}
        style={{
          fill: 0xffffff,
          fontSize: 18,
          fontFamily: 'Arial',
        }}
      />
    </pixiContainer>
  );
};
