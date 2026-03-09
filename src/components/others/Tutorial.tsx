import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo } from 'react';
import { useAudio, useCow, useMenu } from '../../context/hooks';
import { Button } from '../menu/Button';
import { FloatingArrow } from './FloatingArrow';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Text });

const boxHeight = 200;
const boxWidth = 300;
const menuWidth = 210;
const menuHeight = 300;
const buttonWidth = 80;
const buttonHeight = 40;
const buttonOffset = 20;
const buttonY = boxHeight - buttonHeight - 15;
const shopWidth = 325;
const shopHeight = 400;
const boxColor = '#ebd9c0ff';

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const Tutorial = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { setSelectedCow } = useCow();
  const { setSelectedMenu } = useMenu();
  const { cows, tutorial, setTutorial } = useGameStore();

  useEffect(() => {
    if (tutorial == 2.5) setSelectedMenu('menu');
    else if (tutorial == 3) setSelectedMenu('shop');
    else if (tutorial == 4) setSelectedCow(cows[0]);
  }, [tutorial, setSelectedMenu]);

  const drawBase = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.fill({ color: boxColor });
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
            g.rect(0, 0, appWidth - 60, appHeight);
            g.rect(appWidth - 60, 0, appWidth, appHeight - 60);
            g.rect(appWidth - 60, appHeight - 10, appWidth, 10);
            g.rect(appWidth - 10, appHeight - 60, appWidth, 50);
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
        <FloatingArrow
          x={appWidth - 35}
          y={appHeight - 90}
          rotation={Math.PI}
        />
      </>
    );
  }, [appWidth, appHeight]);

  const drawSecondHalfScene = useMemo(() => {
    const buttonX = (appWidth - menuWidth) / 2 + buttonOffset;
    const buttonY = (appHeight - menuHeight) / 2 + buttonOffset + 10;
    return (
      <>
        <pixiGraphics
          interactive={true}
          onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
          onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
          draw={(g) => {
            g.clear();
            g.rect(0, 0, buttonX, appHeight);
            g.rect(buttonX, 0, appWidth, buttonY);
            g.rect(buttonX, buttonY + 50, appWidth, appHeight);
            g.rect(buttonX + 50, buttonY, appWidth, 50);
            g.fill({ color: 'black', alpha: 0.5 });
          }}
        />
        <FloatingArrow x={buttonX + 25} y={buttonY - 25} rotation={Math.PI} />
      </>
    );
  }, [appWidth, appHeight]);

  const drawThirdScene = useMemo(() => {
    return (
      <>
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
              (appHeight - shopHeight) / 2 + 22,
            );
            g.rect(
              (appWidth - shopWidth) / 2 + 245,
              (appHeight - shopHeight) / 2 + 57,
              appWidth,
              appHeight,
            );
            g.rect(
              (appWidth - shopWidth) / 2 + 305,
              (appHeight - shopHeight) / 2 + 22,
              appWidth,
              35,
            );
            g.fill({ color: 'black', alpha: 0.5 });
          }}
        />
        <FloatingArrow
          x={(appWidth - shopWidth) / 2 + 275}
          y={(appHeight - shopHeight) / 2 + 85}
        />
      </>
    );
  }, [appWidth, appHeight]);

  const drawFourthScene = useMemo(() => {
    const thisBoxWidth = 330;
    const thisBoxHeight = 160;
    return (
      <>
        <pixiGraphics
          interactive={true}
          onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
          onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
          draw={(g) => {
            g.clear();
            g.rect(0, appHeight - footerHeight, appWidth, footerHeight);
            g.fill({ color: 'black', alpha: 0.5 });
          }}
        />
        <pixiContainer
          x={(appWidth - thisBoxWidth) / 2}
          y={appHeight - thisBoxHeight - 10}
        >
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(0, 0, thisBoxWidth, thisBoxHeight, 10);
              g.fill({ color: boxColor });
              g.roundRect(0, 0, thisBoxWidth, thisBoxHeight, 10);
              g.stroke({ width: 3, color: 'black' });
            }}
          />
          <pixiText
            x={thisBoxWidth / 2}
            y={thisBoxHeight / 2 - 2}
            text={`Long-pressing a cow opens up its info box like so. Cows earn mooney and xp by grazing. Different cows have varying stats that affect their production, which improves with their level and affection. Try giving your cow a pet now!`}
            anchor={0.5}
            style={{
              fontSize: 16,
              fontFamily: 'pixelFont',
              align: 'center',
              wordWrap: true,
              wordWrapWidth: thisBoxWidth - 20,
            }}
          />
        </pixiContainer>
      </>
    );
  }, [appWidth, appHeight]);

  const drawFifthScene = useMemo(() => {
    const thisBoxWidth = 260;
    const thisBoxHeight = 170;
    return (
      <>
        <pixiGraphics
          interactive={true}
          onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
          onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
          draw={(g) => {
            g.clear();
            g.rect(0, 0, 10, appHeight);
            g.rect(10, 0, appWidth, appHeight - 60);
            g.rect(10, appHeight - 10, appWidth, 10);
            g.rect(60, appHeight - 60, appWidth, 50);
            g.fill({ color: 'black', alpha: 0.5 });
          }}
        />
        <pixiContainer x={70} y={appHeight - thisBoxHeight - 10}>
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(0, 0, thisBoxWidth, thisBoxHeight, 10);
              g.fill({ color: boxColor });
              g.roundRect(0, 0, thisBoxWidth, thisBoxHeight, 10);
              g.stroke({ width: 3, color: 'black' });
            }}
          />
          <pixiText
            x={thisBoxWidth / 2}
            y={thisBoxHeight / 2 - 2}
            text={`What a cutie! Remember to pet your cows daily to improve and maintain their affection levels. One last thing: You can also gain mooney by clicking whenever harvest time is activated, give it a try!`}
            anchor={0.5}
            style={{
              fontSize: 16,
              fontFamily: 'pixelFont',
              align: 'center',
              wordWrap: true,
              wordWrapWidth: thisBoxWidth - 20,
            }}
          />
        </pixiContainer>
        <FloatingArrow x={35} y={appHeight - 90} rotation={Math.PI} />
      </>
    );
  }, [appWidth, appHeight]);

  return (
    <>
      {tutorial == 1 && drawFirstScene}
      {tutorial == 2 && drawSecondScene}
      {tutorial == 2.5 && drawSecondHalfScene}
      {tutorial == 3 && drawThirdScene}
      {tutorial == 4 && drawFourthScene}
      {tutorial == 5 && drawFifthScene}
    </>
  );
};
