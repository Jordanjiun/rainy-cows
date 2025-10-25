import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useScene } from './context/useScene';
import type { SceneKey } from './context/SceneTypes';
import { TestScene } from './scenes/TestScene';
import { LoadScreen } from './scenes/LoadScene';
import { Maximize, Minimize } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import './App.css';

extend({ Container, Graphics });

export const AppContent = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { currentScene } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);

  const renderScene = (scene: SceneKey) => {
    switch (scene) {
      case 'LoadScreen':
        return <LoadScreen />;
      case 'TestScene':
        return <TestScene />;
      default:
        return null;
    }
  };

  const toggleFullscreen = (e: MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem
        .requestFullscreen?.()
        .catch((err) =>
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`,
          ),
        );
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
    <div className="banner-container">
      <div className="banner">Rainy Cows</div>

      <div ref={containerRef} className="app-container">
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>

        <Application width={800} height={600} className="responsive-canvas">
          {renderScene(currentScene)}
        </Application>
      </div>
    </div>
  );
};
