import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback } from 'react';
import { Button } from './Button';
import { HyperlinkText } from '../others/HyperlinkText';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Text });

const boxHeight = 300;
const boxWidth = 300;
const buttonWidth = 80;
const buttonHeight = 40;
const padding = 30;
const boxColor = '#ebd9c0ff';

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const infoRows = [
  { label: 'Developer:', value: 'Jordan Tay', url: '' },
  {
    label: 'Pixel Cows:',
    value: 'Pop Shop Packs',
    url: 'https://sites.google.com/view/popshoppacks/home',
  },
  {
    label: 'Pixel Grass:',
    value: 'Bonsaiheldin',
    url: 'https://opengameart.org/users/bonsaiheldin',
  },
  {
    label: 'Pixel Clouds:',
    value: 'Kass',
    url: 'https://kassjak.itch.io/',
  },
  { label: 'Audio:', value: 'Pixabay', url: '' },
];

export const Credits = ({
  appWidth,
  appHeight,
  onClick,
}: {
  appWidth: number;
  appHeight: number;
  onClick: () => void;
}) => {
  function handleClick() {
    onClick();
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

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
      const lineY = 112.5;
      g.clear();
      g.moveTo(padding - 5, lineY);
      g.lineTo(boxWidth - padding + 5, lineY);
      g.stroke({ width: 3, color: 'black' });
    },
    [boxWidth],
  );

  return (
    <>
      <pixiGraphics
        interactive={true}
        onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
        onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
        draw={(g) => {
          g.clear();
          g.rect(0, 0, appWidth, appHeight);
          g.fill({ alpha: 0 });
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
          text={'Credits'}
          anchor={0.5}
          style={{ fontSize: 28, fontFamily: 'pixelFont' }}
        />
        <pixiText
          x={boxWidth / 2}
          y={55}
          text={'This game is dedicated to the love of my life, RainyBearry❤️'}
          anchor={{ x: 0.5, y: 0 }}
          style={{
            fontSize: 16,
            fontFamily: 'pixelFont',
            align: 'center',
            wordWrap: true,
            wordWrapWidth: boxWidth - padding,
          }}
        />
        <pixiGraphics draw={drawLine} />
        {infoRows.map((row, i) => {
          const y = 130 + i * 20;
          return (
            <pixiContainer key={row.label}>
              <pixiText
                x={padding}
                y={y}
                text={row.label}
                style={{ fontSize: 16, fontFamily: 'pixelFont' }}
              />
              {!row.url ? (
                <pixiText
                  x={boxWidth - padding}
                  y={y}
                  text={row.value}
                  anchor={{ x: 1, y: 0 }}
                  style={{ fontSize: 16, fontFamily: 'pixelFont' }}
                />
              ) : (
                <HyperlinkText
                  x={boxWidth - padding}
                  y={y}
                  text={row.value}
                  url={row.url}
                />
              )}
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
  );
};
