import { extend, useTick } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWeather } from '../../context/hooks';
import type { Splash } from './Splashes';

extend({ Container, Graphics });

type Raindrop = {
  id: number;
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  targetY: number;
};

interface RainProps {
  appWidth: number;
  appHeight: number;
  intensity?: number;
  onSplash?: (splashes: Splash[]) => void;
}

const maxDrops = 300;
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

export const Rain = ({
  appWidth,
  appHeight,
  intensity = 1,
  onSplash,
}: RainProps) => {
  const { isRaining } = useWeather();

  const [drops, setDrops] = useState<Raindrop[]>([]);
  const splashBuffer = useRef<Splash[]>([]);

  const spawnDrop = useCallback((): Raindrop => {
    const splashMinY = appHeight * (1 - landRatio) + 10;
    const splashMaxY = appHeight;
    const targetY = splashMinY + Math.random() * (splashMaxY - splashMinY);

    return {
      id: Math.random(),
      x: Math.random() * appWidth,
      y: -20 - Math.random() * appHeight * 0.5,
      length: 10 + Math.random() * 18,
      speed: 8 + Math.random() * 12 * intensity,
      alpha: 0.7 + Math.random() * 0.3,
      targetY,
    };
  }, [appWidth, appHeight, intensity]);

  const spawnSplash = useCallback((x: number, y: number): Splash => {
    return {
      id: Math.random(),
      x,
      y,
      radius: 1 + Math.random() * 2,
      alpha: 0.6,
      life: 1,
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRaining) return;
      setDrops((prev) => {
        if (prev.length >= maxDrops * intensity) return prev;
        return [...prev, spawnDrop()];
      });
    }, 40);
    return () => clearInterval(interval);
  }, [spawnDrop, intensity, isRaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (splashBuffer.current.length && onSplash) {
        onSplash(splashBuffer.current);
        splashBuffer.current = [];
      }
    }, 100);
    return () => clearInterval(interval);
  }, [onSplash]);

  const draw = useCallback(
    (g: any) => {
      g.clear();
      g.setStrokeStyle({
        width: 1.2,
        color: 0x2b3a67,
        alpha: 1,
      });
      for (const d of drops) {
        g.moveTo(d.x, d.y);
        g.lineTo(d.x, d.y + d.length);
        g.stroke();
      }
    },
    [drops],
  );

  useTick((ticker) => {
    const delta = ticker.deltaTime;

    setDrops((prev) => {
      const newSplashes: Splash[] = [];
      const updated = prev
        .map((d) => {
          const newY = d.y + d.speed * delta;

          if (newY >= d.targetY) {
            newSplashes.push(
              spawnSplash(d.x + (Math.random() - 0.5) * 6, d.targetY),
            );
            return null;
          }

          return {
            ...d,
            y: newY,
            x: d.x + 0.4 * delta,
          };
        })
        .filter(Boolean) as Raindrop[];

      if (newSplashes.length) {
        splashBuffer.current.push(...newSplashes);
      }

      return updated;
    });
  });

  return (
    <pixiContainer>
      <pixiGraphics draw={draw} />
    </pixiContainer>
  );
};
