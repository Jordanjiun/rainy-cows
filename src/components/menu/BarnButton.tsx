import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useEffect, useMemo, useState } from 'react';
import { useAudio } from '../../context/hooks';

extend({ Container, Graphics, Sprite, Text });

export const BarnButton = ({
  buttonX,
  buttonY,
  buttonSize,
}: {
  buttonX: number;
  buttonY: number;
  buttonSize: number;
}) => {
  const { audioMap } = useAudio();
  const [isHovered, setIsHovered] = useState(false);
  const [barnImage, setBarnImage] = useState<Texture | null>(null);

  const iconColor = isHovered ? 'white' : 'black';

  useEffect(() => {
    let mounted = true;
    async function loadBarnImage() {
      const loaded = await Assets.load<Texture>('barn');
      loaded.source.scaleMode = 'linear';
      if (mounted) setBarnImage(loaded);
    }
    loadBarnImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick() {
    audioMap.click.play();
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

  if (!barnImage) return null;

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
          texture={barnImage}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>
    </>
  );
};
