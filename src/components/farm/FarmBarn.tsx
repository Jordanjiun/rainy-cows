import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../game/store';
import { BarnCow } from './BarnCow';
import type { Cow } from '../../game/cowModel';

extend({ Container, Graphics, Sprite, Text });

const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

export const FarmBarn = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { cows } = useGameStore();
  const [peekingCow, setPeekingCow] = useState<Cow | null>(null);
  const [barnImage, setBarnImage] = useState<Texture | null>(null);

  const barnedCows = useMemo(() => {
    return cows.filter((cow) => cow.barned);
  }, [cows]);

  useEffect(() => {
    let mounted = true;
    async function loadBarnImage() {
      const loaded = await Assets.load<Texture>('farmbarn');
      loaded.source.scaleMode = 'linear';
      if (mounted) setBarnImage(loaded);
    }
    loadBarnImage();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (barnedCows.length == 0) return;
    setPeekingCow(barnedCows[1]);
    let cancelled = false;
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    async function runLoop() {
      while (!cancelled) {
        await delay(5000);
        await showCow();
      }
    }

    runLoop();
    return () => {
      cancelled = true;
    };
  }, [barnedCows.length]);

  async function showCow() {
    if (Math.random() < 0.5) return;
  }

  const drawBack = useCallback(
    (g: Graphics) => {
      if (!barnImage) return;
      g.clear();
      g.rect(50, 50, barnImage.width - 80, barnImage.height - 50);
      g.fill({ color: 'black' });
    },
    [barnImage],
  );

  if (!barnImage) return null;

  return (
    <pixiContainer
      x={appWidth - barnImage.width}
      y={appHeight * (1 - landRatio) - barnImage.height + 10}
    >
      <pixiGraphics draw={drawBack} />
      {peekingCow && (
        <BarnCow
          barnWidth={barnImage.width}
          barnHeight={barnImage.height}
          cow={peekingCow}
        />
      )}
      <pixiSprite texture={barnImage} />
    </pixiContainer>
  );
};
