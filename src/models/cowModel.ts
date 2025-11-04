import { createSeededRNG } from '../game/utils';

interface FilterSettings {
  hue: number;
  saturate: number;
  contrast: number;
  brightness: number;
}

export interface SpriteInfo {
  layers: string[];
  filters: Record<string, FilterSettings>;
}

const cowColorMutateChance = Number(
  import.meta.env.VITE_COW_COLOR_MUTATE_CHANCE,
);
const cowHornChance = Number(import.meta.env.VITE_COW_HORN_CHANCE);
const cowSpotChance = Number(import.meta.env.VITE_COW_SPOT_CHANCE);

const hueRange = [0, 360];
const saturateRange = [0.5, 1.5];
const contrastRange = [0, 0.5];
const brightnessRange = [0.6, 1.5];
const baseColors = {
  Black: 0.15,
  Brown: 0.2,
  Grey: 0.3,
  White: 0.15,
  Yellow: 0.2,
};

function createSpriteInfo(rng: Function): SpriteInfo {
  const spriteInfo: SpriteInfo = {
    layers: [],
    filters: {},
  };

  const entries = Object.entries(baseColors);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

  let cumulative = 0;
  for (const [color, weight] of entries) {
    cumulative += weight / totalWeight;
    if (rng() <= cumulative) {
      spriteInfo.layers.push(`base${color}`);
      break;
    }
  }

  spriteInfo.layers.push('tongue');

  if (rng() > cowHornChance) spriteInfo.layers.push('horns');
  if (rng() > cowSpotChance) spriteInfo.layers.push('spots');

  const randomFilter = (): FilterSettings => ({
    hue: hueRange[0] + rng() * (hueRange[1] - hueRange[0]),
    saturate: saturateRange[0] + rng() * (saturateRange[1] - saturateRange[0]),
    contrast: contrastRange[0] + rng() * (contrastRange[1] - contrastRange[0]),
    brightness:
      brightnessRange[0] + rng() * (brightnessRange[1] - brightnessRange[0]),
  });

  if (spriteInfo.layers.includes('baseGrey') && rng() > cowColorMutateChance) {
    spriteInfo.filters.baseGrey = randomFilter();
  }

  if (spriteInfo.layers.includes('spots')) {
    spriteInfo.filters.spots = randomFilter();
  }
  console.log(spriteInfo)
  return spriteInfo;
}

export class Cow {
  seed: number;
  rng: Function;
  sprite: SpriteInfo;
  name: string;

  constructor(data: Partial<Cow>) {
    this.seed = Date.now();
    this.rng = createSeededRNG(this.seed);
    this.sprite = createSpriteInfo(this.rng);
    this.name = data.name ?? 'Cow';
  }

  get displayName(): string {
    return `${this.name}`;
  }
}
