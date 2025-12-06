import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Graphics, Sprite });

const animationDuration = 1000;
const fadeInDuration = 200;
const fadeOutDuration = 300;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

type MooneyEffect = {
  x: number;
  y: number;
  alpha: number;
  vy: number;
  start: number;
};

export const FloatingMooney = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { isHarvest, upgrades, addMooney } = useGameStore();
  const [moonies, setMoonies] = useState<MooneyEffect[]>([]);
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

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setMoonies((prev) =>
        prev
          .map((h) => {
            const elapsed = performance.now() - h.start;

            let alpha = 1;
            if (elapsed < fadeInDuration) alpha = elapsed / fadeInDuration;
            else if (elapsed > animationDuration - fadeOutDuration)
              alpha = (animationDuration - elapsed) / fadeOutDuration;

            return {
              ...h,
              y: h.y + h.vy,
              alpha: Math.max(0, Math.min(1, alpha)),
            };
          })
          .filter((h) => performance.now() - h.start < animationDuration),
      );

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [animationDuration]);

  function handleClick(event: any) {
    const { x, y } = event.data.global;
    addMooney(upgrades.clickLevel);
    setMoonies((prev) => [
      ...prev,
      {
        x,
        y,
        alpha: 0,
        vy: -1,
        start: performance.now(),
      },
    ]);
  }

  if (!mooneyImage) return null;

  return (
    <>
      {moonies.map((h) => (
        <pixiSprite
          key={`${h.start}-${h.x}-${h.y}`}
          texture={mooneyImage}
          x={h.x}
          y={h.y}
          alpha={h.alpha}
          anchor={0.5}
          scale={1}
        />
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
