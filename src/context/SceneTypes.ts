import { createContext } from 'react';

export type SceneKey = 'LoadScreen' | 'TestScene';

export interface SceneContextType {
  currentScene: SceneKey;
  switchScene: (scene: SceneKey) => void;
}

export const SceneContext = createContext<SceneContextType | undefined>(
  undefined,
);
