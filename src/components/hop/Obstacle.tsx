import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '../../game/store';

extend({ Graphics, Sprite });

const assetNames = ['fence', 'plant', 'totem'];

export type Object = {
  name: string;
  width: number;
  height: number;
};

interface ObstacleProps {
  x: number;
  y: number;
  object: Object;
}

export const Obstacle = ({ x, y, object }: ObstacleProps) => {
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
    const tex = textures[object.name];
    if (tex) {
      setImage(tex);
    }
  }, [object, textures]);

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, object.width, object.height);
      g.stroke({
        width: 2,
        color: 'red',
      });
    },
    [object],
  );

  return (
    <>
      {image && <pixiSprite texture={image} x={x} y={y} />}
      {isHitbox && <pixiGraphics draw={draw} x={x} y={y} />}
    </>
  );
};
