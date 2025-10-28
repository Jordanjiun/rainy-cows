import { extend, useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useScene } from '../context/useScene';
import { LoadingBar } from '../components/LoadingBar';

extend({ Container });

export const LoadScreen = () => {
  const [progress, setProgress] = useState(0);
  const { switchScene } = useScene();
  const { app } = useApplication();
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!app) return;

    const updateSize = () => {
      if (!app.renderer) return;
      setSize({ width: app.renderer.width, height: app.renderer.height });
    };

    if (app.renderer) {
      app.renderer.on('resize', updateSize);
      updateSize();
    }

    const interval = setInterval(() => {
      if (app.renderer) {
        app.renderer.on('resize', updateSize);
        updateSize();
        clearInterval(interval);
      }
    }, 50);

    return () => {
      if (app.renderer) app.renderer.off('resize', updateSize);
      clearInterval(interval);
    };
  }, [app]);

  // Simulate loading progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => switchScene('MainScene'), 100);
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [switchScene]);

  if (!app) return null;

  return (
    <pixiContainer>
      <LoadingBar
        appWidth={size.width}
        appHeight={size.height}
        progress={progress}
      />
    </pixiContainer>
  );
};
