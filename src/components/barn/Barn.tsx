import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAudio, useScene } from '../../context/hooks';
import { useGameStore } from '../../game/store';
import { BarnContent } from './BarnContent';
import type { Texture } from 'pixi.js';

extend({ Container, Graphics, Text });

const buttonSize = 50;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const Barn = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { switchScene } = useScene();

  const [backImage, setBackImage] = useState<Texture | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const iconColor = isHovered ? 'yellow' : 'white';

  useEffect(() => {
    let mounted = true;
    async function loadBackImage() {
      const loaded = await Assets.load<Texture>('undo');
      loaded.source.scaleMode = 'linear';
      if (mounted) setBackImage(loaded);
    }
    loadBackImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick() {
    audioMap.click.play();
    useGameStore.getState().reloadCows();
    switchScene('MainScene');
  }

  const drawDefaultBackground = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, appWidth, appHeight);
      g.fill({ color: '#ebd9c0ff' });
    },
    [appWidth, appHeight],
  );

  const drawTitle = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, appWidth, footerHeight);
      g.fill({ color: '#8A2F2B' });
      g.rect(0, footerHeight - 5, appWidth, 5);
      g.fill({ color: 'black' });
    },
    [appWidth, appHeight],
  );

  const drawFooter = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, appHeight - footerHeight, appWidth, footerHeight);
      g.fill({ color: '#A0522D' });
    },
    [appWidth, appHeight],
  );

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 3, color: isHovered ? 'yellow' : 'white' });
    };
  }, [isHovered]);

  if (!backImage) return null;

  return (
    <>
      <pixiGraphics draw={drawDefaultBackground} />
      <BarnContent appWidth={appWidth} appHeight={appHeight} />
      <pixiGraphics draw={drawTitle} />
      <pixiGraphics draw={drawFooter} />
      <pixiText
        x={appWidth / 2}
        y={footerHeight / 2 - 2}
        text={'Barn'}
        anchor={0.5}
        style={{ fontSize: 32, fontFamily: 'pixelFont', fill: 'white' }}
      />
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
          texture={backImage}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>
    </>
  );
};
