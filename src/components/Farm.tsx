import { extend } from '@pixi/react';
import { Graphics, Text } from 'pixi.js';
import { useCallback, useMemo, useState } from 'react';
import { purgeGameData } from '../game/store';

extend({ Graphics, Text });

const landRatio = Number(import.meta.env.VITE_LAND_RATIO);
const buttonSize = 50;

export const Farm = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

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

  // chore: move into settings menu when that is available
  const drawPurgeButton = useMemo(
    () => (
      <pixiContainer
        x={10}
        y={appHeight - buttonSize - 10}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={purgeGameData}
      >
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.roundRect(0, 0, buttonSize, buttonSize, 10);
            g.fill({ color: isHovered ? 'yellow' : 'white' });
          }}
        />
        <pixiText
          x={buttonSize / 2}
          y={buttonSize / 2 - 1}
          text={'Purge'}
          anchor={0.5}
          style={{ fontSize: 16, fill: 'black', fontWeight: 'bold' }}
        />
      </pixiContainer>
    ),
    [isHovered, appHeight, purgeGameData],
  );

  return (
    <>
      <pixiGraphics draw={drawBackground} />
      {drawPurgeButton}
    </>
  );
};
