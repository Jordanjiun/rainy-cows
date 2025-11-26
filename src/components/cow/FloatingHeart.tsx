import { extend } from '@pixi/react';
import { Assets, Sprite, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';

extend({ Sprite });

const animationDuration = 1000;
const fadeInDuration = 200;
const fadeOutDuration = 300;

type HeartEffect = {
  id: string;
  x: number;
  y: number;
  alpha: number;
  vy: number;
  start: number;
};

interface FloatingHeartsProps {
  heartEvents: { id: string; x: number; y: number }[];
  onConsumed?: () => void;
  duration?: number;
}

export const FloatingHearts = ({
  heartEvents,
  onConsumed,
  duration = animationDuration,
}: FloatingHeartsProps) => {
  const [hearts, setHearts] = useState<HeartEffect[]>([]);
  const [heartImage, setHeartImage] = useState<Texture | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadHeartImage() {
      const loaded = await Assets.load<Texture>('heart');
      if (mounted) setHeartImage(loaded);
    }
    loadHeartImage();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (heartEvents.length === 0) return;

    setHearts((prev) => [
      ...prev,
      ...heartEvents.map((e) => ({
        id: `${e.id}-${Date.now()}-${Math.random()}`,
        x: e.x,
        y: e.y - 30,
        alpha: 0,
        vy: -0.4,
        start: performance.now(),
      })),
    ]);

    onConsumed?.();
  }, [heartEvents, onConsumed]);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      setHearts((prev) =>
        prev
          .map((h) => {
            const elapsed = performance.now() - h.start;

            let alpha = 1;
            if (elapsed < fadeInDuration) alpha = elapsed / fadeInDuration;
            else if (elapsed > duration - fadeOutDuration)
              alpha = (duration - elapsed) / fadeOutDuration;

            return {
              ...h,
              y: h.y + h.vy,
              alpha: Math.max(0, Math.min(1, alpha)),
            };
          })
          .filter((h) => performance.now() - h.start < duration),
      );

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  if (!heartImage) return null;

  return (
    <>
      {hearts.map((h) => (
        <pixiSprite
          key={h.id}
          texture={heartImage}
          x={h.x}
          y={h.y}
          alpha={h.alpha}
          anchor={0.5}
          scale={0.1}
        />
      ))}
    </>
  );
};
