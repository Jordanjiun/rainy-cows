import { createSeededRNG } from './utils';
import {
  cowBaseColors,
  cowBrightnessRange,
  cowConfig,
  cowContrastRange,
  cowDateTimeOptions,
  cowHueRange,
  cowNames,
  cowRarities,
  cowSaturateRange,
  cowStatRanges,
  cowSpotLayers,
  cowXpPerLevel,
} from '../data/cowData';

interface FilterSettings {
  hue: number;
  saturate: number;
  contrast: number;
  brightness: number;
}

interface CowStats {
  rarity: CowRarity;
  eatChance: number;
  extraMooney: number;
  valueMultiplier: number;
}

export interface SpriteInfo {
  layers: string[];
  filters: Record<string, FilterSettings>;
}

function createSpriteInfo(rng: Function): SpriteInfo {
  const spriteInfo: SpriteInfo = {
    layers: [],
    filters: {},
  };

  const entries = Object.entries(cowBaseColors);
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

  if (rng() < cowConfig.hornChance) spriteInfo.layers.push('horns');

  if (rng() < cowConfig.spotChance)
    spriteInfo.layers.push(
      cowSpotLayers[Math.floor(rng() * cowSpotLayers.length)],
    );

  const randomFilter = (): FilterSettings => ({
    hue: cowHueRange[0] + rng() * (cowHueRange[1] - cowHueRange[0]),
    saturate:
      cowSaturateRange[0] + rng() * (cowSaturateRange[1] - cowSaturateRange[0]),
    contrast:
      cowContrastRange[0] + rng() * (cowContrastRange[1] - cowContrastRange[0]),
    brightness:
      cowBrightnessRange[0] +
      rng() * (cowBrightnessRange[1] - cowBrightnessRange[0]),
  });

  if (
    spriteInfo.layers.includes('baseGrey') &&
    rng() < cowConfig.colourMutateChance
  ) {
    spriteInfo.filters.baseGrey = randomFilter();
  }

  for (const layer of cowSpotLayers) {
    if (spriteInfo.layers.includes(layer)) {
      spriteInfo.filters[layer] = randomFilter();
    }
  }

  return spriteInfo;
}

function createName(rng: Function, cows?: Cow[] | null): string {
  if (!cows || cows.length === 0) {
    return cowNames[Math.floor(rng() * cowNames.length)];
  }

  const existingNames = new Set(cows.map((c) => c.name));
  const availableNames = cowNames.filter((name) => !existingNames.has(name));

  if (availableNames.length > 0) {
    return availableNames[Math.floor(rng() * availableNames.length)];
  }

  const base = cowNames[Math.floor(rng() * cowNames.length)];
  let newName = base;
  let counter = 2;

  while (existingNames.has(newName)) {
    newName = `${base} ${counter++}`;
  }

  return newName;
}

export type CowRarity = keyof typeof cowRarities;
export type CowStat = keyof (typeof cowStatRanges)[CowRarity];

function getRandomStat(
  rng: Function,
  rarity: CowRarity,
  stat: CowStat,
  getInt: boolean = false,
) {
  const [low, high] = cowStatRanges[rarity][stat];
  const value = low + (high - low) * rng();
  if (getInt) return Math.round(value);
  return Math.round(value * 100) / 100;
}

function createStats(rng: Function, sprite: SpriteInfo): CowStats {
  let stats: CowStats = {
    rarity: 'common',
    eatChance: 1,
    extraMooney: 0,
    valueMultiplier: 1,
  };

  if (Object.keys(sprite.filters).length == 0) return stats;

  const entries = Object.entries(cowRarities) as [CowRarity, number][];
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

  let cumulative = 0;
  for (const [type, weight] of entries) {
    cumulative += weight / totalWeight;
    if (rng() <= cumulative) {
      stats.rarity = type;
      break;
    }
  }

  stats.eatChance = getRandomStat(rng, stats.rarity, 'eatChance');
  stats.extraMooney = getRandomStat(rng, stats.rarity, 'extraMooney', true);
  stats.valueMultiplier = getRandomStat(rng, stats.rarity, 'valueMultiplier');
  return stats;
}

export class Cow {
  id: string;
  seed: number;
  sprite: SpriteInfo;
  name: string;
  level: number;
  xp: number;
  hearts: number;
  pitch: number;
  lastPet: string;
  lastDecayCheck: string;
  stats: CowStats;

  constructor(cows?: Cow[]) {
    this.id = crypto.randomUUID();
    this.seed = Date.now();

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const rng = createSeededRNG(this.seed);

    this.sprite = createSpriteInfo(rng);
    this.name = createName(rng, cows);
    this.stats = createStats(rng, this.sprite);
    this.level = 1;
    this.xp = 0;
    this.hearts = 0;
    this.pitch = Math.round((0.8 + 0.8 * rng()) * 100) / 100;
    this.lastPet = yesterday.toLocaleString(undefined, cowDateTimeOptions);
    this.lastDecayCheck = yesterday.toLocaleString(
      undefined,
      cowDateTimeOptions,
    );
  }

  eat() {
    const mooneyGained = this.level + this.hearts;
    if (!cowXpPerLevel[this.level]) return mooneyGained;

    this.xp += mooneyGained;
    if (this.xp >= cowXpPerLevel[this.level]) {
      const excess = this.xp - cowXpPerLevel[this.level];
      this.xp = excess;
      this.level++;
    }

    return mooneyGained;
  }

  pet() {
    const now = new Date();
    const lastPetDate = new Date(this.lastPet);
    const isNewDay =
      now.getFullYear() !== lastPetDate.getFullYear() ||
      now.getMonth() !== lastPetDate.getMonth() ||
      now.getDate() !== lastPetDate.getDate();

    if (!isNewDay) {
      return this.hearts;
    }

    if (this.hearts < 10) {
      this.hearts++;
    }

    this.lastPet = now.toLocaleString(undefined, cowDateTimeOptions);
    return this.hearts;
  }
}
