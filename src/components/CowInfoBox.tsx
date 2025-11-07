import { extend } from '@pixi/react';
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Cow } from '../models/cowModel';

extend({ Container, Graphics, Text });

const baseFontSize = 24;
const boxWidth = 200;
const crossSize = 18;
const crossThickness = 5;
const offset = 10;
const titleWidth = 120;

const boxColor = '#ebd9c0ff';

export const CowInfoBox = ({
  appWidth,
  appHeight,
  cow,
  onClose,
}: {
  appWidth: number;
  appHeight: number;
  cow: Cow;
  onClose: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [scale, setScale] = useState(1);
  const textRef = useRef<any>(null);

  const drawBox = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, appHeight * 0.27, 10);
      g.fill({ color: boxColor });
    },
    [appHeight],
  );

  const drawCloseButton = useMemo(
    () => (
      <pixiContainer
        x={offset}
        y={offset}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={onClose}
      >
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, crossSize, crossSize);
            g.fill({ color: boxColor });

            const stroke = isHovered ? 'red' : 'black';
            g.setStrokeStyle({ width: crossThickness, color: stroke });
            g.moveTo(0, 0);
            g.lineTo(crossSize, crossSize);
            g.moveTo(crossSize, 0);
            g.lineTo(0, crossSize);
            g.stroke();
          }}
        />
      </pixiContainer>
    ),
    [isHovered, onClose],
  );

  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style = new TextStyle({ fontSize: baseFontSize });
    const bounds = textRef.current.getLocalBounds();
    const textWidth = bounds.width;
    const newScale = textWidth > titleWidth ? titleWidth / textWidth : 1;
    setScale(newScale);
  }, [cow, titleWidth]);

  const drawText = useMemo(
    () => (
      <pixiText
        ref={textRef}
        x={boxWidth / 2}
        y={20}
        text={cow.name}
        anchor={0.5}
        scale={{ x: scale, y: scale }}
        style={{ fontSize: baseFontSize }}
      />
    ),
    [cow, scale],
  );

  return (
    <pixiContainer x={appWidth - boxWidth - offset} y={offset}>
      <pixiGraphics draw={drawBox} />
      {drawCloseButton}
      {drawText}
    </pixiContainer>
  );
};
