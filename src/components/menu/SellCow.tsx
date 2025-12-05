import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import { useCow, useMenu } from '../../context/hooks';
import { cowXpPerLevel } from '../../data/cowData';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

const boxHeight = 200;
const boxWidth = 250;
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
  const { selectedMenu, setSelectedMenu } = useMenu();
  const { selectedCow, setSelectedCow } = useCow();
  const { addMooney, removeCow } = useGameStore();

  const [noHovered, setNoHovered] = useState(false);
  const [yesHovered, setYesHovered] = useState(false);
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

  function handleClick(isSell: boolean = false, amount?: number) {
    if (isSell && amount && selectedCow) {
      const cowId = selectedCow.id;
      addMooney(amount);
      setSelectedCow(null);
      removeCow(cowId);
    }
    setNoHovered(false);
    setYesHovered(false);
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  if (!mooneyImage || !selectedCow) return null;

  const base = cowXpPerLevel[selectedCow.level - 1] ?? 0;
  var value: number;
  if (selectedCow.level == 10) value = base;
  else value = base + selectedCow.xp;

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
              style={{ fontWeight: 'bold', fill: 'red' }}
            />
            <pixiText
              x={boxWidth / 2}
              y={boxHeight / 2 - 8}
              text={`Do you want to sell ${selectedCow.name} for: ${value.toLocaleString('en-US')}?`}
              anchor={0.5}
              style={{
                fontSize: 18,
                align: 'center',
                wordWrap: true,
                wordWrapWidth: boxWidth - 40,
              }}
            />

            <pixiContainer
              x={boxWidth - buttonWidth - buttonOffset}
              y={buttonY}
              interactive={true}
              cursor="pointer"
              onPointerOver={() => setNoHovered(true)}
              onPointerOut={() => setNoHovered(false)}
              onPointerTap={() => handleClick(false)}
            >
              <pixiGraphics
                draw={(g) => {
                  g.clear();
                  g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
                  g.fill({ color: noHovered ? 'yellow' : '#E28C80' });
                  g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
                  g.stroke({ width: 2, color: 'black' });
                }}
              />
              <pixiText
                x={buttonWidth / 2}
                y={buttonHeight / 2 - 1}
                text={'No'}
                anchor={0.5}
                style={{ fontSize: 22 }}
              />
            </pixiContainer>

            <pixiContainer
              x={buttonOffset}
              y={buttonY}
              interactive={true}
              cursor="pointer"
              onPointerOver={() => setYesHovered(true)}
              onPointerOut={() => setYesHovered(false)}
              onPointerTap={() => handleClick(true, value)}
            >
              <pixiGraphics
                draw={(g) => {
                  g.clear();
                  g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
                  g.fill({ color: yesHovered ? 'yellow' : '#80E28C' });
                  g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
                  g.stroke({ width: 2, color: 'black' });
                }}
              />
              <pixiText
                x={buttonWidth / 2}
                y={buttonHeight / 2 - 1}
                text={'Yes'}
                anchor={0.5}
                style={{ fontSize: 22 }}
              />
            </pixiContainer>
          </pixiContainer>
        </>
      )}
    </>
  );
};
