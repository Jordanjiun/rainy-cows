import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import { useAudio, useCow, useMenu } from '../../context/hooks';
import { cowXpPerLevel } from '../../data/cowData';
import { useGameStore } from '../../game/store';
import { measureText } from '../../game/utils';
import { Button } from './Button';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 20;
const boxHeight = 200;
const boxWidth = 260;
const buttonWidth = 80;
const buttonHeight = 40;
const buttonOffset = 20;
const buttonY = boxHeight - buttonHeight - 15;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const SellCow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();
  const { addMooney, removeCow } = useGameStore();

  const [mooneyImage, setMooneyImage] = useState<Texture | null>(null);

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

  function handleClick(isSell: boolean = false, amount: number) {
    if (isSell && selectedCow) {
      audioMap.coin.play();
      const cowId = selectedCow.id;
      addMooney(amount);
      setSelectedCow(null);
      removeCow(cowId);
    } else {
      audioMap.type.play();
    }
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  if (!mooneyImage || !selectedCow) return null;

  const base = cowXpPerLevel[selectedCow.level - 1] ?? 0;
  let value: number;
  if (selectedCow.level == 10)
    value = Math.round(
      base * selectedCow.stats.valueMultiplier * (1 + selectedCow.hearts / 10),
    );
  else
    value = Math.round(
      (base + selectedCow.xp) *
        selectedCow.stats.valueMultiplier *
        (1 + selectedCow.hearts / 10),
    );

  const iconWidth = mooneyImage.width;
  const textWidth = measureText(value.toLocaleString('en-US'), {
    fontSize: baseFontSize,
    fontFamily: 'pixelFont',
  });
  const totalWidthDynamic = iconWidth + textWidth;
  const startX = (boxWidth - totalWidthDynamic) / 2;

  return (
    <>
      {selectedMenu == 'sellCow' && (
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
              text={'Sell Cow?'}
              anchor={0.5}
              style={{ fill: 'red', fontSize: 28, fontFamily: 'pixelFont' }}
            />
            <pixiText
              x={boxWidth / 2}
              y={boxHeight / 2 - 26}
              text={`Do you want to sell ${selectedCow.name} for:`}
              anchor={0.5}
              style={{
                fontSize: baseFontSize,
                fontFamily: 'pixelFont',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: boxWidth - 30,
              }}
            />
            <pixiContainer x={-3} y={101}>
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
              buttonText={'No'}
              fontsize={28}
              buttonColor={'#E28C80'}
              onClick={() => handleClick(false, 0)}
            />
            <Button
              x={buttonOffset}
              y={buttonY}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Yes'}
              fontsize={28}
              buttonColor={'#80E28C'}
              onClick={() => handleClick(true, value)}
            />
          </pixiContainer>
        </>
      )}
    </>
  );
};
