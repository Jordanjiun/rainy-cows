import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useGameStore } from '../../game/store';
import { BarnCow } from './BarnCow';
import { FloatingHearts } from '../cow/FloatingHeart';
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
  const [heartEvents, setHeartEvents] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  const cowHeartsRef = useRef<Record<string, number>>({});
  const isPeekingRef = useRef(false);

  const handleHeartChange = useCallback(
    (id: string, hearts: number, x: number, y: number) => {
      const oldHearts = cowHeartsRef.current[id] ?? 0;
      if (hearts > oldHearts) {
        setHeartEvents((prev) => [...prev, { id, x, y }]);
      }
      cowHeartsRef.current[id] = hearts;
    },
    [],
  );

  const clearHeartEvents = useCallback(() => {
    setHeartEvents([]);
  }, []);

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
    cowHeartsRef.current = Object.fromEntries(
      cows.map((c) => [c.id, c.hearts ?? 0]),
    );
  }, [cows]);

  useEffect(() => {
    if (barnedCows.length == 0) return;
    let cancelled = false;
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));
    async function runLoop() {
      while (!cancelled) {
        await delay(5000);
        if (isPeekingRef.current) continue;
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
    isPeekingRef.current = true;
    setPeekingCow(barnedCows[Math.floor(Math.random() * barnedCows.length)]);
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
          onPet={handleHeartChange}
          onExitComplete={() => {
            setPeekingCow(null);
            isPeekingRef.current = false;
          }}
        />
      )}
      <pixiSprite texture={barnImage} />
      <FloatingHearts heartEvents={heartEvents} onConsumed={clearHeartEvents} />
    </pixiContainer>
  );
};
