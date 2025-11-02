const cowMaxArea = Number(import.meta.env.VITE_COW_MAX_AREA);
const cowMaxScale = Number(import.meta.env.VITE_COW_MAX_SCALE);
const cowMinArea = Number(import.meta.env.VITE_COW_MIN_AREA);
const cowMinScale = Number(import.meta.env.VITE_COW_MIN_SCALE);

export function createSeededRNG(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function getCowScale(input: number) {
  if (input <= cowMinArea) return cowMinScale;
  if (input >= cowMaxArea) return cowMaxScale;
  return (
    cowMinScale +
    ((input - cowMinArea) * (cowMaxScale - cowMinScale)) /
      (cowMaxArea - cowMinArea)
  );
}
