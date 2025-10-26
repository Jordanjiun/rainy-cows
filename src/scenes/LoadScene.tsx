import { extend, useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useScene } from '../context/useScene';
import { LoadingBar } from '../components/LoadingBar';

extend({ Container });

const loadingBarWidth = 500;
const loadingBarHeight = 30;

export const LoadScreen = () => {
  const [progress, setProgress] = useState(0);
  const { switchScene } = useScene();
  const { app } = useApplication();

  if (!app) return null;
  const appWidth = app.renderer?.width ?? 0;
  const appHeight = app.renderer?.height ?? 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            switchScene('MainScene');
          }, 100);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [switchScene]);

  return (
    <pixiContainer
      x={appWidth / 2 - loadingBarWidth / 2}
      y={appHeight / 2 - loadingBarHeight / 2}
    >
      <LoadingBar
        width={loadingBarWidth}
        height={loadingBarHeight}
        progress={progress}
      />
    </pixiContainer>
  );
};
