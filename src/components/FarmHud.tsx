import { extend } from '@pixi/react';
import { Assets, Sprite, Text, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useGameStore } from '../game/store';

extend({ Sprite, Text });

const offset = 10;
const assetNames = ['mooney', 'logo'];

export const FarmHud = () => {
  const { cows, mooney, upgrades } = useGameStore();
  const [textures, setTextures] = useState<Record<string, Texture>>({});

  const amount = mooney.toLocaleString('en-US');
  const ratio = `${cows.length}/${upgrades.farmLevel * 2}`;

  useEffect(() => {
    let mounted = true;
    async function loadTextures() {
      const loaded: Record<string, Texture> = await Assets.load(assetNames);
      if (mounted) setTextures(loaded);
    }
    loadTextures();
    return () => {
      mounted = false;
    };
  }, []);

  if (!textures.mooney || !textures.logo) return null;

  return (
    <>
      <pixiSprite texture={textures.mooney} x={offset} y={offset} scale={1} />
      <pixiText
        x={32 + 1.5 * offset}
        y={offset}
        text={amount}
        style={{ fill: 'black' }}
      />
      <pixiSprite texture={textures.logo} x={offset} y={offset * 5} scale={1} />
      <pixiText
        x={32 + 1.5 * offset}
        y={offset * 5}
        text={ratio}
        style={{ fill: 'black' }}
      />
    </>
  );
};
