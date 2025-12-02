import { extend } from '@pixi/react';
import { Assets, Sprite, Text, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useGameStore } from '../game/store';

extend({ Sprite, Text });

const offset = 10;

export const FarmHud = () => {
  const { cows, mooney, upgrades } = useGameStore();
  const [mooneyImage, setMooneyImage] = useState<Texture | null>(null);

  const amount = mooney.toLocaleString('en-US');
  const ratio = `${cows.length}/${upgrades.farmLevel * 2}`;

  useEffect(() => {
    let mounted = true;
    async function loadMooneyImage() {
      const loaded = await Assets.load<Texture>('mooney');
      loaded.source.scaleMode = 'nearest';
      if (mounted) setMooneyImage(loaded);
    }
    loadMooneyImage();
    return () => {
      mounted = false;
    };
  }, []);

  if (!mooneyImage) return null;

  return (
    <>
      <pixiSprite texture={mooneyImage} x={offset} y={offset} scale={1} />
      <pixiText
        x={32 + 1.5 * offset}
        y={offset}
        text={amount}
        style={{ fill: 'black' }}
      />
      <pixiText
        x={32 + 1.5 * offset}
        y={offset * 5}
        text={ratio}
        style={{ fill: 'black' }}
      />
    </>
  );
};
