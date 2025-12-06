import { Text, TextStyle } from 'pixi.js';
import { cowConfig } from '../data/cowData';

export function createSeededRNG(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function formatTimerText(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  return `${formattedMinutes}:${formattedSeconds}`;
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

export const measureText = (text: string, style: any = {}) => {
  const obj = new Text({
    text,
    style: new TextStyle(style),
  });

  return obj.width;
};
