import { extend, useApplication } from '@pixi/react';
import { Assets, Container } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useScene } from '../context/useScene';
import { LoadingBar } from '../components/LoadingBar';

extend({ Container });

const manifest = {
  bundles: [
    {
      name: 'cows',
      assets: [
        { alias: 'cowblack0', src: '/assets/cows/cows_spritesheet_black0.png' },
        { alias: 'cowblack1', src: '/assets/cows/cows_spritesheet_black1.png' },
        { alias: 'cowbrown', src: '/assets/cows/cows_spritesheet_brown.png' },
        {
          alias: 'cowwhitedarkspots',
          src: '/assets/cows/cows_spritesheet_white_darkspots.png',
        },
        {
          alias: 'cowwhitepinkspots',
          src: '/assets/cows/cows_spritesheet_white_pinkspots.png',
        },
        { alias: 'cowwhite0', src: '/assets/cows/cows_spritesheet_white0.png' },
        { alias: 'cowwhite1', src: '/assets/cows/cows_spritesheet_white1.png' },
      ],
    },
  ],
};

await Assets.init({ manifest });

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
    }, 50);

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
