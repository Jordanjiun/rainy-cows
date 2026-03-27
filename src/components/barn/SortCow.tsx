import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback } from 'react';
import { useAudio, useMenu } from '../../context/hooks';
import { Button } from '../menu/Button';
import { sortTypes, useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Text });

const boxHeight = 560;
const boxWidth = 280;
const buttonWidth = 240;
const buttonHeight = 30;
const startY = 60;
const offset = 10;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const SortCow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedMenu, setSelectedMenu } = useMenu();
  const { setSortType } = useGameStore();

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

  return (
    <>
      {selectedMenu == 'sortCow' && (
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
              y={offset * 2 + 10}
              anchor={0.5}
              text={'Change Sort'}
              style={{ fontSize: 28, fontFamily: 'pixelFont' }}
            />

            {sortTypes.map((type, i) => {
              const y = startY + i * (buttonHeight + offset);
              return (
                <Button
                  key={type}
                  x={(boxWidth - buttonWidth) / 2}
                  y={y}
                  buttonWidth={buttonWidth}
                  buttonHeight={buttonHeight}
                  buttonText={`${type}`}
                  buttonColor={'white'}
                  onClick={() => {
                    audioMap.type.play();
                    setSortType(type);
                    setSelectedMenu(null);
                  }}
                />
              );
            })}

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - buttonHeight - offset * 2}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Cancel'}
              buttonColor={'red'}
              onClick={() => {
                audioMap.type.play();
                setSelectedMenu(null);
              }}
            />
          </pixiContainer>
        </>
      )}
    </>
  );
};
