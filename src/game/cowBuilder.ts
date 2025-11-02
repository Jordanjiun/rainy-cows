import { Assets, Rectangle, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';

const cowSheetCols = Number(import.meta.env.VITE_COW_SHEET_COLS);
const frameSize = Number(import.meta.env.VITE_COW_FRAME_SIZE);

export const animationsDef: Record<string, number[]> = {
  eat: [5, 6, 7, 7, 7, 6, 5],
  idle: [0],
  idleToWalk: [0, 1, 2],
  pet: [9, 10, 11, 10, 9],
  walk: [12, 13, 14, 15],
  walkToIdle: [2, 1, 0],
};

export function useCowAnimations() {
  const [animations, setAnimations] = useState<Record<
    string,
    Texture[]
  > | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const baseTexture = await Assets.load('cowbase');
      const anims: Record<string, Texture[]> = {};

      for (const [name, indices] of Object.entries(animationsDef)) {
        const textures: Texture[] = [];

        for (const index of indices) {
          const row = Math.floor(index / cowSheetCols);
          const col = index % cowSheetCols;

          const frame = new Rectangle(
            col * frameSize,
            row * frameSize,
            frameSize,
            frameSize,
          );

          const cropped = new Texture({
            source: baseTexture.source,
            frame,
          });

          cropped.source.scaleMode = 'nearest';
          textures.push(cropped);
        }

        anims[name] = textures;
      }

      if (isMounted) setAnimations(anims);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return animations;
}
