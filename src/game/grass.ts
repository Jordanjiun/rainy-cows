import { Assets, Rectangle, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';

const frameSize = 16;
const numOfCols = 8;

export function useGrassFrame(indexes: number[]) {
  const [frames, setFrames] = useState<Texture[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const baseTexture = await Assets.load<Texture>('grass');
      const newFrames: Texture[] = [];
      for (const index of indexes) {
        const row = Math.floor(index / numOfCols);
        const col = index % numOfCols;
        const frame = new Rectangle(
          col * frameSize,
          row * frameSize,
          frameSize,
          frameSize,
        );
        const texture = new Texture({ source: baseTexture.source, frame });
        texture.source.scaleMode = 'nearest';
        newFrames.push(texture);
      }
      if (mounted) setFrames(newFrames);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [indexes]);

  return frames;
}
