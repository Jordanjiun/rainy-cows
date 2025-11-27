import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useState } from 'react';

extend({ Container, Graphics, Text });

interface ButtonProps {
  x: number;
  y: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonText: string;
  buttonColor: string;
  onClick: () => void;
}

export const Button = ({
  x,
  y,
  buttonWidth,
  buttonHeight,
  buttonText,
  buttonColor,
  onClick,
}: ButtonProps) => {
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
          g.fill({ color: isHovered ? 'yellow' : buttonColor });
          g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
          g.stroke({ width: 3, color: 'black' });
        }}
      />
      <pixiText
        x={buttonWidth / 2}
        y={buttonHeight / 2 - 1}
        text={buttonText}
        anchor={0.5}
        style={{ fontSize: 22 }}
      />
    </pixiContainer>
  );
};
