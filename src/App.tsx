import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { SceneProvider } from './context/SceneProvider';
import { TestScene } from './scenes/TestScene';
import { useScene } from './context/useScene';
import type { SceneKey } from './context/SceneTypes';
import './App.css';

extend({ Container, Graphics });

export const App = () => {
  const { currentScene } = useScene();

  const renderScene = (scene: SceneKey) => {
    switch (scene) {
      case 'TestScene':
        return <TestScene />;
      default:
        return null;
    }
  };

  return (
    <SceneProvider>
      <div className="app-container">
        <Application width={800} height={600} className="responsive-canvas">
          {renderScene(currentScene)}
        </Application>
      </div>
    </SceneProvider>
  );
};
