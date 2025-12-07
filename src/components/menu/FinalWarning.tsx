import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback } from 'react';
import { purgeGameData } from '../../game/store';
import { Button } from './Button';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Text });

const boxHeight = 200;
const boxWidth = 260;
const buttonWidth = 80;
const buttonHeight = 40;
const buttonOffset = 20;
const buttonY = boxHeight - buttonHeight - 15;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const FinalWarning = ({
  appWidth,
  appHeight,
  onClick,
}: {
  appWidth: number;
  appHeight: number;
  onClick: () => void;
}) => {
  const drawBase = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.fill({ color: '#ebd9c0ff' });
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    },
    [boxWidth, boxHeight],
  );

  function handleClick(isDelete: boolean = false) {
    if (isDelete) {
      purgeGameData();
    }
    onClick();
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  return (
    <>
      <pixiGraphics
        interactive={true}
        onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
        onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
        draw={(g) => {
          g.clear();
          g.rect(0, 0, appWidth, appHeight);
          g.fill({ color: 'black', alpha: 0.5 });
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
          text={'Warning!'}
          anchor={0.5}
          style={{ fill: 'red', fontSize: 28, fontFamily: 'pixelFont' }}
        />
        <pixiText
          x={boxWidth / 2}
          y={boxHeight / 2 - 10}
          text={
            'You are about to delete your save file. This is irreversible. Are you sure you want to continue?'
          }
          anchor={0.5}
          style={{
            fontSize: 16,
            fontFamily: 'pixelFont',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: boxWidth - 40,
          }}
        />

        <Button
          x={boxWidth - buttonWidth - buttonOffset}
          y={buttonY}
          buttonWidth={buttonWidth}
          buttonHeight={buttonHeight}
          buttonText={'No'}
          fontsize={28}
          buttonColor={'#E28C80'}
          onClick={() => handleClick(false)}
        />
        <Button
          x={buttonOffset}
          y={buttonY}
          buttonWidth={buttonWidth}
          buttonHeight={buttonHeight}
          buttonText={'Yes'}
          fontsize={28}
          buttonColor={'#80E28C'}
          onClick={() => handleClick(true)}
        />
      </pixiContainer>
    </>
  );
};
