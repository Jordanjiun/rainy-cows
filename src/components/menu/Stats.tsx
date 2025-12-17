import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback } from 'react';
import { Button } from './Button';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Text });

const boxHeight = 290;
const boxWidth = 320;
const buttonWidth = 80;
const buttonHeight = 40;
const padding = 25;
const boxColor = '#ebd9c0ff';

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const Stats = ({
  appWidth,
  appHeight,
  onClick,
}: {
  appWidth: number;
  appHeight: number;
  onClick: () => void;
}) => {
  const { stats } = useGameStore();

  const statsRows = [
    { label: 'Clicks', value: stats.clicks },
    { label: 'Moonies Earned', value: stats.mooneyEarned },
    { label: 'Upgrades Bought', value: stats.upgradesBought },
    { label: 'Cows Bought', value: stats.cowsBought },
    { label: 'Cows Sold', value: stats.cowsSold },
    { label: 'Cows Renamed', value: stats.cowsRenamed },
    { label: 'Cows Pet', value: stats.cowsPet },
  ];

  function handleClick() {
    onClick();
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  const drawBase = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.fill({ color: boxColor });
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    },
    [boxWidth, boxHeight, boxColor],
  );

  const drawLine = useCallback(
    (g: Graphics) => {
      const lineY = 60;
      g.clear();
      g.moveTo(padding - 5, lineY);
      g.lineTo(boxWidth - padding + 5, lineY);
      g.stroke({ width: 3, color: 'black' });
    },
    [boxWidth],
  );

  return (
    <>
      <pixiGraphics
        interactive={true}
        onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
        onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
        draw={(g) => {
          g.clear();
          g.rect(0, 0, appWidth, appHeight);
          g.fill({ alpha: 0 });
        }}
      />

      <pixiContainer
        x={(appWidth - boxWidth) / 2}
        y={(appHeight - boxHeight - footerHeight) / 2}
      >
        <pixiGraphics draw={drawBase} />
        <pixiText
          x={boxWidth / 2}
          y={30}
          text={'Statistics'}
          anchor={0.5}
          style={{ fontSize: 28, fontFamily: 'pixelFont' }}
        />
        <pixiGraphics draw={drawLine} />
        {statsRows.map((row, i) => {
          const y = 80 + i * 20;
          return (
            <pixiContainer key={row.label}>
              <pixiText
                x={padding}
                y={y}
                text={row.label}
                style={{ fontSize: 16, fontFamily: 'pixelFont' }}
              />
              <pixiText
                x={boxWidth - padding}
                y={y}
                text={row.value.toLocaleString('en-US')}
                anchor={{ x: 1, y: 0 }}
                style={{ fontSize: 16, fontFamily: 'pixelFont' }}
              />
            </pixiContainer>
          );
        })}

        <Button
          x={(boxWidth - buttonWidth) / 2}
          y={boxHeight - buttonHeight - 20}
          buttonWidth={buttonWidth}
          buttonHeight={buttonHeight}
          buttonText={'Back'}
          buttonColor={'white'}
          onClick={handleClick}
        />
      </pixiContainer>
    </>
  );
};
