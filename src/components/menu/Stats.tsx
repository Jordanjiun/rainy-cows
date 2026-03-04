import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from './Button';
import { useAudio, useMenu } from '../../context/hooks';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent, Texture } from 'pixi.js';

extend({ Container, Graphics, Text });

const boxHeight = 290;
const boxWidth = 320;
const buttonWidth = 80;
const buttonHeight = 40;
const crossSize = 20;
const crossThickness = 4;
const offset = 20;
const padding = 25;
const boxColor = '#ebd9c0ff';

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const Stats = ({
  appWidth,
  appHeight,
  buttonX,
  buttonY,
  buttonSize,
}: {
  appWidth: number;
  appHeight: number;
  buttonX: number;
  buttonY: number;
  buttonSize: number;
}) => {
  const { audioMap } = useAudio();
  const { stats } = useGameStore();
  const { selectedMenu, setSelectedMenu } = useMenu();

  const [isHovered, setIsHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);
  const [statImage, setStatImage] = useState<Texture | null>(null);

  const iconColor = isHovered ? 'white' : 'black';

  const statsRows = [
    { label: 'Clicks', value: stats.clicks },
    { label: 'Moonies Earned', value: stats.mooneyEarned },
    { label: 'Upgrades Bought', value: stats.upgradesBought },
    { label: 'Cows Bought', value: stats.cowsBought },
    { label: 'Cows Sold', value: stats.cowsSold },
    { label: 'Cows Renamed', value: stats.cowsRenamed },
    { label: 'Cows Pet', value: stats.cowsPet },
  ];

  useEffect(() => {
    let mounted = true;
    async function loadStatImage() {
      const loaded = await Assets.load<Texture>('stats');
      loaded.source.scaleMode = 'linear';
      if (mounted) setStatImage(loaded);
    }
    loadStatImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick() {
    audioMap.click.play();
    if (selectedMenu == 'stats') setSelectedMenu('menu');
    else setSelectedMenu('stats');
  }

  function closeMenu() {
    audioMap.click.play();
    setCloseHovered(false);
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 3, color: isHovered ? 'white' : 'black' });
    };
  }, [isHovered]);

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

  const drawCloseButton = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.rect(-3, -3, crossSize + 6, crossSize + 6);
      g.fill({ alpha: 0 });
      const stroke = closeHovered ? 'red' : 'black';
      g.setStrokeStyle({ width: crossThickness, color: stroke });
      g.moveTo(0, 0);
      g.lineTo(crossSize, crossSize);
      g.moveTo(crossSize, 0);
      g.lineTo(0, crossSize);
      g.stroke();
    };
  }, [closeHovered]);

  if (!statImage) return null;

  return (
    <>
      <pixiContainer
        x={buttonX}
        y={buttonY}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={handleClick}
      >
        <pixiGraphics draw={drawButtonBase} />
        <pixiSprite
          texture={statImage}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>

      {selectedMenu == 'stats' && (
        <>
          <pixiGraphics
            interactive={true}
            onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
            onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
            draw={(g) => {
              g.clear();
              g.rect(0, 0, appWidth, appHeight - footerHeight);
              g.fill({ alpha: 0 });
            }}
          />

          <pixiContainer
            x={(appWidth - boxWidth) / 2}
            y={(appHeight - boxHeight - footerHeight) / 2}
          >
            <pixiGraphics draw={drawBase} />

            <pixiContainer
              x={offset}
              y={offset}
              interactive={true}
              cursor="pointer"
              onPointerOver={() => setCloseHovered(true)}
              onPointerOut={() => setCloseHovered(false)}
              onPointerTap={closeMenu}
            >
              <pixiGraphics draw={drawCloseButton} />
            </pixiContainer>

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
      )}
    </>
  );
};
