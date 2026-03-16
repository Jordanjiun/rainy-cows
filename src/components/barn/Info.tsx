import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { useCallback, useMemo } from 'react';
import { useAudio, useCow, useMenu } from '../../context/hooks';
import { Button } from '../menu/Button';
import { measureText } from '../../game/utils';
import type { FederatedPointerEvent } from 'pixi.js';
import type { CowStat } from '../../game/cowModel';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 20;
const boxHeight = 180;
const boxWidth = 260;
const buttonWidth = 110;
const buttonHeight = 35;
const buttonY = boxHeight - buttonHeight - 15;
const infoY = 50;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const infoRows: { label: string; value: CowStat }[] = [
  { label: 'Eat Chance', value: 'eatChance' },
  { label: 'Bonus Mooney', value: 'extraMooney' },
  { label: 'Value Multiplier', value: 'valueMultiplier' },
];

export const InfoCow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();

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

  function handleClick() {
    audioMap.type.play();
    setSelectedCow(null);
    setSelectedMenu(null);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  const drawInfo = useMemo(() => {
    if (!selectedCow) return null;
    const lines = [
      `Rarity: ${selectedCow.stats.rarity.charAt(0).toUpperCase() + selectedCow.stats.rarity.slice(1)}`,
      ...infoRows.map((row) => `${row.label}: ${selectedCow.stats[row.value]}`),
    ];
    const maxWidth = Math.max(
      ...lines.map((line) =>
        measureText(line, { fontSize: 16, fontFamily: 'pixelFont' }),
      ),
    );
    return (
      <pixiContainer x={(boxWidth - maxWidth) / 2}>
        <pixiText
          y={infoY}
          text={`Rarity: ${selectedCow.stats.rarity.charAt(0).toUpperCase() + selectedCow.stats.rarity.slice(1)}`}
          style={{ fontSize: 16, fontFamily: 'pixelFont' }}
        />
        {infoRows.map((row, i) => {
          const y = infoY + (i + 1) * 16;
          return (
            <pixiContainer key={row.label}>
              <pixiText
                y={y}
                text={`${row.label}: ${selectedCow.stats[row.value]}`}
                style={{ fontSize: 16, fontFamily: 'pixelFont' }}
              />
            </pixiContainer>
          );
        })}
      </pixiContainer>
    );
  }, [selectedCow]);

  if (!selectedCow) return null;

  return (
    <>
      {selectedMenu == 'infoCow' && (
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
              y={boxHeight / 2 - 60}
              text={`${selectedCow.name} (Lvl. ${selectedCow.level}):`}
              anchor={0.5}
              style={{
                fontSize: baseFontSize,
                fontFamily: 'pixelFont',
                align: 'center',
                wordWrap: true,
                wordWrapWidth: boxWidth - 30,
              }}
            />
            {drawInfo}
            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={buttonY}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Close'}
              fontsize={24}
              buttonColor={'white'}
              onClick={handleClick}
            />
          </pixiContainer>
        </>
      )}
    </>
  );
};
