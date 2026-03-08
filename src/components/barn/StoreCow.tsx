import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import { useAudio, useCow, useMenu, useToast } from '../../context/hooks';
import { cowPrices } from '../../data/gameData';
import { useGameStore } from '../../game/store';
import { measureText } from '../../game/utils';
import { Button } from '../menu/Button';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 20;
const boxHeight = 180;
const boxWidth = 260;
const buttonWidth = 110;
const buttonHeight = 35;
const buttonOffset = 14;
const buttonY = boxHeight - buttonHeight - 15;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const StoreCow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { showToast } = useToast();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();
  const { cows, mooney, updateCowBarned, removeMooney } = useGameStore();

  const [mooneyImage, setMooneyImage] = useState<Texture | null>(null);

  const keys = Object.keys(cowPrices).map(Number);
  const maxKey = Math.max(...keys);
  const currentPrice = cowPrices[cows.length + 1] ?? cowPrices[maxKey]!;
  const value = currentPrice * 0.1;

  useEffect(() => {
    let mounted = true;
    async function loadCoinImage() {
      const loaded = await Assets.load<Texture>('mooney');
      if (mounted) setMooneyImage(loaded);
    }
    loadCoinImage();
    return () => {
      mounted = false;
    };
  }, []);

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

  function handleClick(isConfirm: boolean = false) {
    if (isConfirm && selectedCow) {
      if (mooney < value) {
        audioMap.wrong.play();
        showToast(
          'You do not have enough mooney to store this cow.',
          '#E28C80',
        );
        return;
      }
      audioMap.coin.play();
      updateCowBarned(selectedCow.id, true);
      removeMooney(value);
    } else audioMap.type.play();
    setSelectedCow(null);
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  if (!selectedCow || !mooneyImage) return null;

  const iconWidth = mooneyImage.width;
  const textWidth = measureText(value.toLocaleString('en-US'), {
    fontSize: baseFontSize,
    fontFamily: 'pixelFont',
  });
  const totalWidthDynamic = iconWidth + textWidth;
  const startX = (boxWidth - totalWidthDynamic) / 2;

  return (
    <>
      {selectedMenu == 'storeCow' && (
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
              y={boxHeight / 2 - 50}
              text={`Do you want to barn ${selectedCow.name} for:`}
              anchor={0.5}
              style={{
                fontSize: baseFontSize,
                fontFamily: 'pixelFont',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: boxWidth - 30,
              }}
            />
            <pixiContainer x={-3} y={(boxHeight - iconWidth) / 2 + 1}>
              <pixiSprite texture={mooneyImage} x={startX - 2} />
              <pixiText
                x={startX + iconWidth + 3}
                y={5}
                text={value.toLocaleString('en-US')}
                style={{ fontSize: baseFontSize, fontFamily: 'pixelFont' }}
              />
            </pixiContainer>
            <Button
              x={boxWidth - buttonWidth - buttonOffset}
              y={buttonY}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Cancel'}
              fontsize={24}
              buttonColor={'#E28C80'}
              onClick={() => handleClick(false)}
            />
            <Button
              x={buttonOffset}
              y={buttonY}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Confirm'}
              fontsize={24}
              buttonColor={'#80E28C'}
              onClick={() => handleClick(true)}
            />
          </pixiContainer>
        </>
      )}
    </>
  );
};
