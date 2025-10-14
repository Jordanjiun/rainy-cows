import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { SceneProvider } from './context/SceneProvider';
import { TestScene } from './scenes/TestScene';
import { useScene } from './context/useScene';
import type { SceneKey } from './context/SceneTypes';
import './App.css';
import { useRef, useEffect, useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';

extend({ Container, Graphics });

export const App = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { currentScene } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);

  const renderScene = (scene: SceneKey) => {
    switch (scene) {
      case 'TestScene':
        return <TestScene />;
      default:
        return null;
    }
  };

  const toggleFullscreen = () => {
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <SceneProvider>
      <div ref={containerRef} className="app-container">
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        <Application width={800} height={600} className="responsive-canvas">
          {renderScene(currentScene)}
        </Application>
      </div>
    </SceneProvider>
  );
};
