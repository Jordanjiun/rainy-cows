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

  const { currentScene } = useScene();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

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

    const doc: any = document;
    const isInFullscreen =
      !!document.fullscreenElement ||
      !!doc.webkitFullscreenElement ||
      !!doc.mozFullScreenElement ||
      !!doc.msFullscreenElement;

    if (!isInFullscreen) {
      const requestFullScreen =
        elem.requestFullscreen?.bind(elem) ||
        (elem as any).webkitRequestFullscreen?.bind(elem) ||
        (elem as any).mozRequestFullScreen?.bind(elem) ||
        (elem as any).msRequestFullscreen?.bind(elem);

      requestFullScreen?.().catch((err: any) =>
        console.error(`Error attempting to enable fullscreen: ${err.message}`),
      );
      setIsFullscreen(true);
    } else {
      const exitFullScreen =
        document.exitFullscreen?.bind(document) ||
        doc.webkitExitFullscreen?.bind(doc) ||
        doc.mozCancelFullScreen?.bind(doc) ||
        doc.msExitFullscreen?.bind(doc);
      exitFullScreen?.();
      setIsFullscreen(false);
    }
  };

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
      <div className="banner">
        <span>Rainy Cows</span>
      </div>

      <div ref={containerRef} className="app-container">
        {!isIOS && (
          <button className="fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize size={fullscreenSvgSize} />
            ) : (
              <Maximize size={fullscreenSvgSize} />
            )}
          </button>
        )}

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
