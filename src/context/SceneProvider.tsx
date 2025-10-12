import { useState, type ReactNode } from 'react';
import { SceneContext } from './SceneTypes';
import type { SceneKey } from './SceneTypes';

export const SceneProvider = ({ children }: { children: ReactNode }) => {
  const [currentScene, setCurrentScene] = useState<SceneKey>('TestScene');

  const switchScene = (scene: SceneKey) => setCurrentScene(scene);

  return (
    <SceneContext.Provider value={{ currentScene, switchScene }}>
      {children}
    </SceneContext.Provider>
  );
};
