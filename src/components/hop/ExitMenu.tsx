import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { useCallback } from 'react';
import { useAudio, useCow, useMenu, useScene } from '../../context/hooks';
import { useGameStore } from '../../game/store';
import { Button } from '../menu/Button';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 20;
const boxHeight = 200;
const boxWidth = 300;
const buttonWidth = 80;
const buttonHeight = 40;
const buttonOffset = 20;
const buttonY = boxHeight - buttonHeight - 15;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const ExitMenu = ({
  appWidth,
  appHeight,
  score,
}: {
  appWidth: number;
  appHeight: number;
  score: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();
  const { addCowXp } = useGameStore();
  const { switchScene } = useScene();

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

  function handleClick(yes: boolean = false) {
    if (yes) {
      setSelectedCow(null);
      switchScene('BarnScene');
    }
    audioMap.type.play();
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  if (!selectedCow) return null;

  return (
    <>
      {selectedMenu == 'exitEarly' && (
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
              y={35}
              text={'Return to Barn?'}
              anchor={0.5}
              style={{ fill: 'red', fontSize: 28, fontFamily: 'pixelFont' }}
            />
            <pixiText
              x={boxWidth / 2}
              y={boxHeight / 2 - 5}
              text={
                'Leaving before finishing the run would result in no XP gain for this cow!'
              }
              anchor={0.5}
              style={{
                fontSize: baseFontSize,
                fontFamily: 'pixelFont',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: boxWidth - 30,
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
      )}

      {selectedMenu == 'exitGame' && (
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
              y={35}
              text={'Game over'}
              anchor={0.5}
              style={{ fontSize: 28, fontFamily: 'pixelFont' }}
            />
            <pixiText
              x={boxWidth / 2}
              y={boxHeight / 2 - 5}
              text={`${selectedCow.name} gained ${score.toLocaleString('en-US')} XP!`}
              anchor={0.5}
              style={{
                fontSize: baseFontSize,
                fontFamily: 'pixelFont',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: boxWidth - 30,
              }}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={buttonY}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Moo'}
              fontsize={28}
              buttonColor={'white'}
              onClick={() => {
                var soundId = audioMap.moo.play();
                audioMap.moo.rate(selectedCow.pitch ?? 1, soundId);
                addCowXp(selectedCow.id, score);
                setSelectedCow(null);
                setSelectedMenu(null);
                switchScene('BarnScene');
              }}
            />
          </pixiContainer>
        </>
      )}
    </>
  );
};
