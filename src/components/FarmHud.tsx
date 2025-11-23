import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../game/store';

extend({ Graphics, Sprite, Text });

const offset = 10;

export const FarmHud = () => {
  const { mooney } = useGameStore();
  const [mooneyImage, setMooneyImage] = useState<Texture | null>(null);

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

  const drawMooney = useMemo(() => {
    const amount = mooney.toLocaleString('en-US');

    return (
      <>
        <pixiText
          x={32 + 1.5 * offset}
          y={offset}
          text={amount}
          style={{ fill: 'black' }}
        />
      </>
    );
  }, [mooney]);

  if (!mooneyImage) return null;

  return (
    <>
      <pixiSprite texture={mooneyImage} x={offset} y={offset} scale={1} />
      {drawMooney}
    </>
  );
};
