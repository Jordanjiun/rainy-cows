import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useState } from 'react';

extend({ Container, Graphics, Text });

const boxWidth = 200;
const crossSize = 20;
const offset = 10;
const boxColor = '#ebd9c0ff';

export const CowInfoBox = ({
  appWidth,
  appHeight,
  onClose,
}: {
  appWidth: number;
  appHeight: number;
  onClose: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const drawBox = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, appHeight * 0.2, 10);
      g.fill({ color: boxColor });
    },
    [appHeight],
  );

  const drawCloseButton = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, crossSize, crossSize);
      g.fill({ color: boxColor });

      const stroke = isHovered ? 'red' : 'black';
      g.setStrokeStyle({ width: 5, color: stroke });
      g.moveTo(0, 0);
      g.lineTo(crossSize, crossSize);
      g.moveTo(crossSize, 0);
      g.lineTo(0, crossSize);
      g.stroke();
    },
    [isHovered],
  );

  return (
    <pixiContainer x={appWidth - boxWidth - offset} y={offset}>
      <pixiGraphics draw={drawBox} />
      <pixiContainer
        x={offset}
        y={offset}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={onClose}
      >
        <pixiGraphics draw={drawCloseButton} />
      </pixiContainer>
    </pixiContainer>
  );
};
