import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useAudio, useMooney } from '../../context/hooks';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const FloatingMooney = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { isHarvest, upgrades, addMooney } = useGameStore();
  const { moonies, addMooneyEffect } = useMooney();
  const { audioMap } = useAudio();

  const [mooneyImage, setMooneyImage] = useState<Texture | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadCoinImage() {
      const loaded = await Assets.load<Texture>('mooney');
      if (mounted) setMooneyImage(loaded);
    }
    loadCoinImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick(event: any) {
    const { x, y } = event.data.global;
    addMooney(upgrades.clickLevel);
    addMooneyEffect(x, y, upgrades.clickLevel);
    audioMap.coin.play();
  }

  if (!mooneyImage) return null;

  return (
    <>
      {moonies.map((h) => (
        <pixiContainer key={`${h.start}-${h.x}-${h.y}`}>
          <pixiSprite
            texture={mooneyImage}
            x={h.x}
            y={h.y}
            alpha={h.alpha}
            anchor={0.5}
            scale={1}
          />
          <pixiText
            x={h.x - 4}
            y={h.y - 2}
            alpha={h.alpha}
            text={`+${h.amount}`}
            style={{ fontSize: 26, fontFamily: 'pixelFont' }}
          />
        </pixiContainer>
      ))}
      {isHarvest && (
        <>
          <pixiGraphics
            interactive={true}
            onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
            onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
            draw={(g) => {
              g.clear();
              g.rect(0, 0, appWidth, appHeight - footerHeight);
              g.fill({ alpha: 0 });
            }}
          />
          <pixiGraphics
            interactive={true}
            onPointerTap={handleClick}
            draw={(g) => {
              g.clear();
              g.rect(
                0,
                0,
                appWidth,
                appHeight - Number(import.meta.env.VITE_FOOTER_HEIGHT_PX),
              );
              g.fill({ alpha: 0 });
            }}
          />
        </>
      )}
    </>
  );
};
