import { extend, useApplication } from '@pixi/react';
import { Assets, Container } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useScene } from '../context/hooks';
import { LoadingBar } from '../components/LoadingBar';

extend({ Container });

const manifest = {
  bundles: [
    {
      name: 'cows',
      assets: [
        { alias: 'baseBlack', src: '/assets/cows/baseBlack.png' },
        { alias: 'baseBrown', src: '/assets/cows/baseBrown.png' },
        { alias: 'baseGrey', src: '/assets/cows/baseGrey.png' },
        { alias: 'baseWhite', src: '/assets/cows/baseWhite.png' },
        { alias: 'baseYellow', src: '/assets/cows/baseYellow.png' },
        { alias: 'horns', src: '/assets/cows/horns.png' },
        { alias: 'spotsBlack', src: '/assets/cows/spotsBlack.png' },
        { alias: 'spotsPink', src: '/assets/cows/spotsPink.png' },
        { alias: 'tongue', src: '/assets/cows/tongue.png' },
      ],
    },
    {
      name: 'icons',
      assets: [
        { alias: 'cowIcon', src: '/assets/icons/cow-head.png' },
        { alias: 'click', src: '/assets/icons/mouse-pointer-click.png' },
        { alias: 'clockDown', src: '/assets/icons/clock-arrow-down.png' },
        { alias: 'clockPlus', src: '/assets/icons/clock-plus.png' },
        { alias: 'housePlus', src: '/assets/icons/house-plus.png' },
        { alias: 'upgradeClick', src: '/assets/icons/mouse-pointer-2.png' },
        { alias: 'menu', src: '/assets/icons/settings.png' },
        { alias: 'store', src: '/assets/icons/store.png' },
      ],
    },
    {
      name: 'others',
      assets: [
        { alias: 'heart', src: '/assets/others/heart.png' },
        { alias: 'noHeart', src: '/assets/others/noHeart.png' },
        { alias: 'mooney', src: '/assets/others/mooney.png' },
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
    }, 10);

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
