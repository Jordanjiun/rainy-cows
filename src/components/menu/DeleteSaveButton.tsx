import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useState } from 'react';

extend({ Container, Graphics, Text });

interface DeleteSaveButtonProps {
  x: number;
  y: number;
  buttonWidth: number;
  buttonHeight: number;
  onClick: () => void;
}

export const DeleteSaveButton = ({
  x,
  y,
  buttonWidth,
  buttonHeight,
  onClick,
}: DeleteSaveButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  function handleClick() {
    setIsHovered(false);
    onClick();
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  return (
    <pixiContainer
      x={x}
      y={y}
      interactive={true}
      cursor="pointer"
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onPointerTap={handleClick}
    >
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
          g.fill({ color: isHovered ? 'yellow' : '#E28C80' });
          g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
          g.stroke({ width: 3, color: 'black' });
        }}
      />
      <pixiText
        x={buttonWidth / 2}
        y={buttonHeight / 2 - 1}
        text={'Delete Save'}
        anchor={0.5}
        style={{ fontSize: 22 }}
      />
    </pixiContainer>
  );
};
