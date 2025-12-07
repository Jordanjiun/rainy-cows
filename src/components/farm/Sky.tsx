import { extend, useTick } from '@pixi/react';
import {
  Assets,
  ColorMatrixFilter,
  Container,
  Graphics,
  Sprite,
  Texture,
  Ticker,
} from 'pixi.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { brightnessByTime } from '../../game/utils';

extend({ Container, Graphics, Sprite });

const numOfCloudTypes = 20;
const landRatio = Number(import.meta.env.VITE_LAND_RATIO);

type Cloud = {
  id: number;
  texture: Texture;
  x: number;
  y: number;
  speed: number;
  scale: number;
};

function adjustSkyColor(baseHex: string, brightness: number) {
  const base = baseHex.replace('#', '');
  const r = parseInt(base.substring(0, 2), 16);
  const g = parseInt(base.substring(2, 4), 16);
  const b = parseInt(base.substring(4, 6), 16);
  const scale = (v: number) =>
    Math.min(255, Math.max(0, Math.round(v * brightness)));
  const r2 = scale(r);
  const g2 = scale(g);
  const b2 = scale(b);
  return `#${r2.toString(16).padStart(2, '0')}${g2
    .toString(16)
    .padStart(2, '0')}${b2.toString(16).padStart(2, '0')}`;
}

export const Sky = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [clouds, setClouds] = useState<Cloud[]>([]);

  useEffect(() => {
    let mounted = true;
    const assetNames = Array.from(
      { length: numOfCloudTypes },
      (_, i) => `cloud${i + 1}`,
    );

    async function loadTextures() {
      const loaded: Record<string, Texture> = await Assets.load(assetNames);
      Object.values(loaded).forEach((tex) => {
        tex.source.scaleMode = 'nearest';
      });
      if (mounted) {
        setTextures(loaded);
        const initial = Array.from({ length: 10 }, () => {
          const cloud = spawnCloud(loaded);
          cloud.x = -200 + Math.random() * (appWidth + 200);
          return cloud;
        });
        setClouds(initial);
      }
    }

    loadTextures();
    return () => {
      mounted = false;
    };
  }, []);

  if (!Object.values(textures).every((t) => t)) return null;

  const sky = useCallback(
    (g: Graphics) => {
      const baseSky = '#87CEEB';
      const currentBrightness = brightnessByTime();
      const skyColor = adjustSkyColor(baseSky, currentBrightness);
      g.clear();
      g.rect(0, 0, appWidth, appHeight * (1 - landRatio));
      g.fill({ color: skyColor });
    },
    [appWidth, appHeight],
  );

  const filter = useMemo(() => {
    const f = new ColorMatrixFilter();
    f.brightness(brightnessByTime(), true);
    return f;
  }, []);

  const spawnCloud = (t = textures) => {
    const texKeys = Object.keys(t);
    const tex = t[texKeys[Math.floor(Math.random() * texKeys.length)]];
    const maxHeight = appHeight * (1 - landRatio) - 100;
    const y = Math.random() * maxHeight;
    const baseSpeed = 0.2 + 0.6 * (y / maxHeight);
    const variation = baseSpeed * (Math.random() * 0.4 - 0.2);
    const speed = baseSpeed + variation;
    const scale = 1 + 0.5 * (y / maxHeight);
    return {
      id: Math.random(),
      texture: tex,
      x: -tex.width * scale * 2,
      y,
      speed,
      scale,
    } satisfies Cloud;
  };

  useEffect(() => {
    const interval = setInterval(
      () => {
        setClouds((c) => [...c, spawnCloud()]);
      },
      2000 + Math.random() * 2000,
    );
    return () => clearInterval(interval);
  }, [textures]);

  const updateClouds = (ticker: Ticker) => {
    const delta = ticker.deltaTime;
    setClouds((c) =>
      c
        .map((cloud) => ({ ...cloud, x: cloud.x + cloud.speed * delta }))
        .filter((cloud) => cloud.x < appWidth + 200),
    );
  };

  useTick((ticker) => {
    updateClouds(ticker);
  });

  return (
    <pixiContainer filters={[filter]}>
      <pixiGraphics draw={sky} />
      {clouds
        .slice()
        .sort((a, b) => a.y - b.y)
        .map((cloud) => (
          <pixiSprite
            key={cloud.id}
            texture={cloud.texture}
            x={cloud.x}
            y={cloud.y}
            scale={cloud.scale}
          />
        ))}
    </pixiContainer>
  );
};
