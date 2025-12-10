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

    const doc: any = document;
    if (
      !document.fullscreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.msFullscreenElement
    ) {
      if (elem.requestFullscreen) {
        elem
          .requestFullscreen()
          .catch((err) =>
            console.error(
              `Error attempting to enable fullscreen: ${err.message}`,
            ),
          );
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handler = () => {
      const doc: any = document;
      setIsFullscreen(
        !!document.fullscreenElement ||
          !!doc.webkitFullscreenElement ||
          !!doc.mozFullScreenElement ||
          !!doc.msFullscreenElement,
      );
    };

    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    document.addEventListener('mozfullscreenchange', handler);
    document.addEventListener('MSFullscreenChange', handler);

    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
      document.removeEventListener('mozfullscreenchange', handler);
      document.removeEventListener('MSFullscreenChange', handler);
    };
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
