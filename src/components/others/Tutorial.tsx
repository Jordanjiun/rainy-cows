import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { useAudio } from '../../context/hooks';
import { Button } from '../menu/Button';
import { FloatingArrow } from './FloatingArrow';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Text });

const boxHeight = 200;
const boxWidth = 300;
const buttonWidth = 80;
const buttonHeight = 40;
const buttonOffset = 20;
const buttonY = boxHeight - buttonHeight - 15;
const shopWidth = 325;
const shopHeight = 400;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const Tutorial = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { tutorial, setTutorial } = useGameStore();

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

  const drawFirstScene = useMemo(() => {
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
            y={44}
            text={'Welcome to\nRainy Cows!'}
            anchor={0.5}
            style={{ fontSize: 24, fontFamily: 'pixelFont', lineHeight: 20 }}
          />
          <pixiText
            x={boxWidth / 2}
            y={boxHeight / 2}
            text={'Would you like to view a quick tutorial on how to play?'}
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
            onClick={() => {
              audioMap.type.play();
              setTutorial(0);
            }}
          />
          <Button
            x={buttonOffset}
            y={buttonY}
            buttonWidth={buttonWidth}
            buttonHeight={buttonHeight}
            buttonText={'Yes'}
            fontsize={28}
            buttonColor={'#80E28C'}
            onClick={() => {
              audioMap.type.play();
              setTutorial(2);
            }}
          />
        </pixiContainer>
      </>
    );
  }, [appWidth, appHeight]);

  const drawSecondScene = useMemo(() => {
    return (
      <>
        <pixiGraphics
          interactive={true}
          onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
          onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
          draw={(g) => {
            g.clear();
            g.rect(0, 0, appWidth - 120, appHeight);
            g.rect(appWidth - 120, 0, appWidth, appHeight - 60);
            g.rect(appWidth - 120, appHeight - 10, appWidth, 10);
            g.rect(appWidth - 70, appHeight - 60, appWidth, 50);
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
            y={boxHeight / 2}
            text={`Rainy cows is an idle collector clicking game, so let's get your first cow!`}
            anchor={0.5}
            style={{
              fontSize: 16,
              fontFamily: 'pixelFont',
              align: 'center',
              wordWrap: true,
              wordWrapWidth: boxWidth - 40,
            }}
          />
        </pixiContainer>
      </>
    );
  }, [appWidth, appHeight]);

  const drawThirdScene = useMemo(() => {
    return (
      <pixiGraphics
        interactive={true}
        onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
        onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
        draw={(g) => {
          g.clear();
          g.rect(0, 0, (appWidth - shopWidth) / 2 + 245, appHeight);
          g.rect(
            (appWidth - shopWidth) / 2 + 245,
            0,
            appWidth,
            (appHeight - shopHeight) / 2 + 32,
          );
          g.rect(
            (appWidth - shopWidth) / 2 + 245,
            (appHeight - shopHeight) / 2 + 67,
            appWidth,
            appHeight,
          );
          g.rect(
            (appWidth - shopWidth) / 2 + 305,
            (appHeight - shopHeight) / 2 + 32,
            appWidth,
            35,
          );
          g.fill({ color: 'black', alpha: 0.5 });
        }}
      />
    );
  }, [appWidth, appHeight]);

  return (
    <>
      {tutorial == 1 && drawFirstScene}
      {tutorial == 2 && (
        <>
          {drawSecondScene}
          <FloatingArrow
            x={appWidth - 95}
            y={appHeight - 90}
            rotation={Math.PI}
          />
        </>
      )}
      {tutorial == 3 && (
        <>
          {drawThirdScene}
          <FloatingArrow
            x={(appWidth - shopWidth) / 2 + 275}
            y={(appHeight - shopHeight) / 2 + 95}
          />
        </>
      )}
    </>
  );
};
