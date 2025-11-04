import { Assets, ColorMatrixFilter, Rectangle, Texture } from 'pixi.js';
import { useEffect, useState } from 'react';
import { createSeededRNG } from './utils';
import { Cow } from '../models/cowModel';

const frameSize = Number(import.meta.env.VITE_COW_FRAME_SIZE);

const cowSheetCols = 4;
const hueRange = [0, 360];
const saturateRange = [0.5, 1.5];
const contrastRange = [0, 0.5];
const brightnessRange = [0.6, 1.5];

export const animationsDef: Record<string, number[]> = {
  eat: [5, 6, 7, 7, 7, 6, 5],
  idle: [0],
  idleToWalk: [0, 1, 2],
  pet: [9, 10, 11, 10, 9],
  walk: [12, 13, 14, 15],
  walkToIdle: [2, 1, 0],
};

export function createNewCow() {
  return new Cow({});
}

export function useCowFilter(cowLayers: string[], seed: number) {
  const rng = createSeededRNG(seed);
  const layerFilters: Record<string, ColorMatrixFilter> = {};

  cowLayers.forEach((layer) => {
    const filter = new ColorMatrixFilter();

    if (layer === 'cowbase' || layer === 'cowspots') {
      const randomHue = hueRange[0] + rng() * (hueRange[1] - hueRange[0]);
      const randomSaturate =
        saturateRange[0] + rng() * (saturateRange[1] - saturateRange[0]);
      const randomContrast =
        contrastRange[0] + rng() * (contrastRange[1] - contrastRange[0]);
      const randomBrightness =
        brightnessRange[0] + rng() * (brightnessRange[1] - brightnessRange[0]);

      filter.hue(randomHue, true);
      filter.saturate(randomSaturate, true);
      filter.contrast(randomContrast, true);
      filter.brightness(randomBrightness, true);
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
