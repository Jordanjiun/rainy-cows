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

const spotLayers = ['spotsBlack', 'spotsPink'];
const hueRange = [0, 360];
const saturateRange = [0.5, 1.5];
const contrastRange = [0, 0.5];
const brightnessRange = [0.6, 1.5];
const baseColors = {
  Black: 0.1,
  Brown: 0.1,
  Grey: 0.6,
  White: 0.1,
  Yellow: 0.1,
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

  if (rng() < cowHornChance) spriteInfo.layers.push('horns');
  if (rng() < cowSpotChance)
    spriteInfo.layers.push(spotLayers[Math.floor(rng() * spotLayers.length)]);

  const randomFilter = (): FilterSettings => ({
    hue: hueRange[0] + rng() * (hueRange[1] - hueRange[0]),
    saturate: saturateRange[0] + rng() * (saturateRange[1] - saturateRange[0]),
    contrast: contrastRange[0] + rng() * (contrastRange[1] - contrastRange[0]),
    brightness:
      brightnessRange[0] + rng() * (brightnessRange[1] - brightnessRange[0]),
  });

  if (spriteInfo.layers.includes('baseGrey') && rng() < cowColorMutateChance) {
    spriteInfo.filters.baseGrey = randomFilter();
  }

  for (const layer of spotLayers) {
    if (spriteInfo.layers.includes(layer)) {
      spriteInfo.filters[layer] = randomFilter();
    }
  }

  return spriteInfo;
}

function createName(rng: Function): string {
  const names = [
    'Apollo',
    'Biggie',
    'Bruno',
    'Bubba',
    'Bullseye',
    'Bully',
    'Clover',
    'Diesel',
    'Duke',
    'Earl',
    'Ferdinand',
    'Frank',
    'Herbie',
    'Hercules',
    'James',
    'Jimmy',
    'Kenny',
    'Maverick',
    'Mercury',
    'Neptune',
    'Norman',
    'Ollie',
    'Orson',
    'Pluto',
    'Rex',
    'Samson',
    'Toby',
    'Zeus',
    'Amy',
    'Arabella',
    'Bertha',
    'Bubbles',
    'Buttercup',
    'Chloe',
    'Cinnamon',
    'Ella',
    'Elsie',
    'Emma',
    'Hope',
    'Lulu',
    'Maggie',
    'Melody',
    'Millie',
    'Minnie',
    'Moolinda',
    'Moolise',
    'Moolissa',
    'Muffin',
    'Nellie',
    'Penelope',
    'Phoebe',
    'Princess',
    'Sadie',
    'Sweetie',
    'Annabelle',
    'Bella',
    'Bessie',
    'Betty',
    'Betsie',
    'Bossy',
    'Clarabelle',
    'Daisy',
    'Flossie',
    'Gertie',
    'Henrietta',
    'Rosie',
    'Magic',
  ];

  return names[Math.floor(rng() * names.length)];
}

export class Cow {
  id: string;
  seed: number;
  rng: Function;
  sprite: SpriteInfo;
  name: string;

  constructor() {
    this.id = crypto.randomUUID();
    this.seed = Date.now();
    this.rng = createSeededRNG(this.seed);
    this.sprite = createSpriteInfo(this.rng);
    this.name = createName(this.rng);
  }

  get displayName(): string {
    return `${this.name}`;
  }
}
