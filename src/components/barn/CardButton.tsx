import { extend } from '@pixi/react';
import { Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useMemo, useState } from 'react';
import { useAudio } from '../../context/hooks';

extend({ Container, Graphics, Sprite, Text });

interface CardButtonProps {
  buttonX: number;
  buttonY: number;
  buttonSize: number;
  image: Texture;
  onClick: () => void;
}

export const CardButton = ({
  buttonX,
  buttonY,
  buttonSize,
  image,
  onClick,
}: CardButtonProps) => {
  const { audioMap } = useAudio();
  const [isHovered, setIsHovered] = useState(false);

  const iconColor = isHovered ? 'white' : 'black';

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 3, color: isHovered ? 'white' : 'black' });
    };
  }, [isHovered, buttonSize]);

  return (
    <pixiContainer
      x={buttonX}
      y={buttonY}
      interactive={true}
      cursor="pointer"
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onPointerTap={() => {
        audioMap.type.play();
        onClick();
      }}
    >
      <pixiGraphics draw={drawButtonBase} />
      <pixiSprite
        texture={image}
        anchor={0.5}
        scale={buttonSize / 36 - 0.2}
        x={buttonSize / 2}
        y={buttonSize / 2}
        tint={iconColor}
      />
    </pixiContainer>
  );
};
