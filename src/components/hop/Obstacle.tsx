import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../game/store';

extend({ Graphics, Sprite });

const assetNames = ['fence', 'plant', 'totem'];

interface ObstacleProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const Obstacle = ({ x, y, width, height }: ObstacleProps) => {
  const { isHitbox } = useGameStore();

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [image, setImage] = useState<Texture>();

  useEffect(() => {
    let mounted = true;
    async function loadTextures() {
      const loaded: Record<string, Texture> = await Assets.load(assetNames);
      Object.values(loaded).forEach((tex) => {
        tex.source.scaleMode = 'nearest';
      });
      if (mounted) setTextures(loaded);
    }
    loadTextures();
    return () => {
      mounted = false;
    };
  }, []);

  if (!textures) return;

  useEffect(() => {
    if (height === 130 && textures.totem) setImage(textures.totem);
    if (height === 55 && textures.fence) setImage(textures.fence);
    if (height === 25 && textures.plant) setImage(textures.plant);
  }, [height, textures]);

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, width, height);
      g.stroke({
        width: 2,
        color: 'red',
      });
    },
    [width, height],
  );

  return (
    <>
      {image && <pixiSprite texture={image} x={x} y={y} />}
      {isHitbox && <pixiGraphics draw={draw} x={x} y={y} />}
    </>
  );
};
