import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { useMemo, useState, useEffect } from 'react';

extend({ Graphics, Sprite });

const buttonSize = 50;

export const MainMenu = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuImage, setMenuImage] = useState<Texture | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadMenuImage() {
      const loaded = await Assets.load<Texture>('menu');
      loaded.source.scaleMode = 'linear';
      if (mounted) setMenuImage(loaded);
    }
    loadMenuImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick() {
    setIsHovered(false);
  }

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 2, color: isHovered ? 'yellow' : 'white' });
    };
  }, [isHovered]);

  if (!menuImage) return null;

  return (
    <pixiContainer
      x={appWidth - buttonSize - 10}
      y={appHeight - buttonSize - 10}
      interactive={true}
      cursor="pointer"
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onPointerTap={handleClick}
    >
      <pixiGraphics draw={drawButtonBase} />
      <pixiSprite
        texture={menuImage}
        anchor={0.5}
        x={buttonSize / 2}
        y={buttonSize / 2}
      />
    </pixiContainer>
  );
};
