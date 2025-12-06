import { Assets, ColorMatrixFilter, Rectangle, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { cowConfig } from '../data/cowData';
import type { SpriteInfo } from './cowModel';

const frameSize = cowConfig.frameSize;
const cowSheetCols = cowConfig.numberOfSheetCols;

export const animationsDef: Record<string, number[]> = {
  eat: [5, 6, 7, 7, 7, 6, 5],
  idle: [0],
  idleToWalk: [0, 1, 2],
  pet: [9, 10, 11, 10, 9],
  walk: [12, 13, 14, 15],
  walkToIdle: [2, 1, 0],
};

export function useCowFilter(spriteInfo: SpriteInfo) {
  const layerFilters: Record<string, ColorMatrixFilter> = {};

  spriteInfo.layers.forEach((layer: string) => {
    const filter = new ColorMatrixFilter();
    const layerFilter = spriteInfo.filters[layer];

    if (layerFilter) {
      filter.hue(layerFilter.hue, true);
      filter.saturate(layerFilter.saturate, true);
      filter.contrast(layerFilter.contrast, true);
      filter.brightness(layerFilter.brightness, true);
    }

    layerFilters[layer] = filter;
  });

  return layerFilters;
}

export function useCowAnimations(cowLayers: string[]) {
  // structure: { cowbase: { walk: Texture[], idle: Texture[] }, cowlayer: { … } }
  const [animations, setAnimations] = useState<Record<
    string,
    Record<string, Texture[]>
  > | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const loadedTextures = await Promise.all(
        cowLayers.map((key) => Assets.load(key)),
      );

      const layerAnims: Record<string, Record<string, Texture[]>> = {};

      loadedTextures.forEach((baseTexture, i) => {
        const layerName = cowLayers[i];
        const anims: Record<string, Texture[]> = {};

        for (const [name, indices] of Object.entries(animationsDef)) {
          anims[name] = indices.map((index) => {
            const row = Math.floor(index / cowSheetCols);
            const col = index % cowSheetCols;
            const frame = new Rectangle(
              col * frameSize,
              row * frameSize,
              frameSize,
              frameSize,
            );
            const cropped = new Texture({ source: baseTexture.source, frame });
            cropped.source.scaleMode = 'nearest';
            return cropped;
          });
        }

        layerAnims[layerName] = anims;
      });

      if (isMounted) setAnimations(layerAnims);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [cowLayers]);

  return animations;
}
