import { Application } from '@pixi/react';
import { useScene } from './context/useScene';
import type { SceneKey } from './context/SceneTypes';
import { LoadScreen } from './scenes/LoadScene';
import { MainScene } from './scenes/MainScene';
import { useGamePersistence } from './game/store';
import { Maximize, Minimize } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import './App.css';

const fullscreenSvgSize = Number(import.meta.env.VITE_FULLSCREEN_SVG_SIZE);

export const AppContent = () => {
  useGamePersistence();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentScene } = useScene();

  const renderScene = (scene: SceneKey) => {
    switch (scene) {
      case 'LoadScreen':
        return <LoadScreen />;
      case 'MainScene':
        return <MainScene />;
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
    <>
      <div className="banner-container">
        <div className="banner">Rainy Cows</div>
      </div>

      <div ref={containerRef} className="app-container">
        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <Minimize size={fullscreenSvgSize} />
          ) : (
            <Maximize size={fullscreenSvgSize} />
          )}
        </button>

        <Application
          antialias={false}
          className="canvas"
          resizeTo={window}
          roundPixels={true}
        >
          {renderScene(currentScene)}
        </Application>
      </div>
    </>
  );
};
