import { Application } from '@pixi/react';
import { AudioProvider, FileInputProvider } from './context/Providers';
import { useScene } from './context/hooks';
import type { SceneKey } from './context/Contexts';
import { LoadScreen } from './scenes/LoadScene';
import { MainScene } from './scenes/MainScene';
import { useGamePersistence } from './game/store';
import { Maximize, Minimize } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import './App.css';

const fullscreenSvgSize = 25;

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

  useEffect(() => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const preventDefault = (e: Event) => e.preventDefault();
    canvas.addEventListener('contextmenu', preventDefault);
    canvas.addEventListener('touchstart', preventDefault, { passive: false });
    canvas.style.touchAction = 'none';
    return () => {
      canvas.removeEventListener('contextmenu', preventDefault);
      canvas.removeEventListener('touchstart', preventDefault);
    };
  }, [containerRef]);

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

        <FileInputProvider>
          <AudioProvider>
            <Application
              antialias={true}
              className="canvas"
              resizeTo={window}
              roundPixels={false}
            >
              {renderScene(currentScene)}
            </Application>
          </AudioProvider>
        </FileInputProvider>
      </div>
    </>
  );
};
