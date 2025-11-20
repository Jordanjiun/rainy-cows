import { cowConfig } from '../data/cowData';

export function createSeededRNG(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function getCowScale(input: number) {
  if (input <= cowConfig.minArea) return cowConfig.minScale;
  if (input >= cowConfig.maxArea) return cowConfig.maxScale;
  return (
    cowConfig.minScale +
    ((input - cowConfig.minArea) * (cowConfig.maxScale - cowConfig.minScale)) /
      (cowConfig.maxArea - cowConfig.minArea)
  );
}
