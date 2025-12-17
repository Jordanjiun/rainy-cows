import { extend, useApplication } from '@pixi/react';
import { Assets, Container } from 'pixi.js';
import { useEffect, useState } from 'react';
import { useAudio, useScene } from '../context/hooks';
import { LoadingBar } from '../components/others/LoadingBar';

extend({ Container });

const audioManifest = [
  { alias: 'coin', src: '/assets/audio/coin.mp3', volume: 1 },
  { alias: 'click', src: '/assets/audio/click.mp3', volume: 1 },
  { alias: 'moo', src: '/assets/audio/moo.mp3', volume: 0.3 },
  { alias: 'type', src: '/assets/audio/type.mp3', volume: 0.5 },
  { alias: 'powerup', src: '/assets/audio/powerup.mp3', volume: 0.3 },
  { alias: 'whoosh', src: '/assets/audio/whoosh.mp3', volume: 0.5 },
  { alias: 'wrong', src: '/assets/audio/wrong.mp3', volume: 0.5 },
];

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
      name: 'clouds',
      assets: [
        { alias: 'cloud1', src: '/assets/clouds/cloud-1.png' },
        { alias: 'cloud2', src: '/assets/clouds/cloud-2.png' },
        { alias: 'cloud3', src: '/assets/clouds/cloud-3.png' },
        { alias: 'cloud4', src: '/assets/clouds/cloud-4.png' },
        { alias: 'cloud5', src: '/assets/clouds/cloud-5.png' },
        { alias: 'cloud6', src: '/assets/clouds/cloud-6.png' },
        { alias: 'cloud7', src: '/assets/clouds/cloud-7.png' },
        { alias: 'cloud8', src: '/assets/clouds/cloud-8.png' },
        { alias: 'cloud9', src: '/assets/clouds/cloud-9.png' },
        { alias: 'cloud10', src: '/assets/clouds/cloud-10.png' },
        { alias: 'cloud11', src: '/assets/clouds/cloud-11.png' },
        { alias: 'cloud12', src: '/assets/clouds/cloud-12.png' },
        { alias: 'cloud13', src: '/assets/clouds/cloud-13.png' },
        { alias: 'cloud14', src: '/assets/clouds/cloud-14.png' },
        { alias: 'cloud15', src: '/assets/clouds/cloud-15.png' },
        { alias: 'cloud16', src: '/assets/clouds/cloud-16.png' },
        { alias: 'cloud17', src: '/assets/clouds/cloud-17.png' },
        { alias: 'cloud18', src: '/assets/clouds/cloud-18.png' },
        { alias: 'cloud19', src: '/assets/clouds/cloud-19.png' },
        { alias: 'cloud20', src: '/assets/clouds/cloud-20.png' },
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
        { alias: 'trophy', src: '/assets/icons/trophy.png' },
        { alias: 'pen', src: '/assets/icons/square-pen.png' },
        { alias: 'x', src: '/assets/icons/x.png' },
      ],
    },
    {
      name: 'others',
      assets: [
        { alias: 'heart', src: '/assets/others/heart.png' },
        { alias: 'noHeart', src: '/assets/others/noHeart.png' },
        { alias: 'logo', src: '/assets/others/logo.png' },
        { alias: 'mooney', src: '/assets/others/mooney.png' },
        { alias: 'grass', src: '/assets/others/grassTile.png' },
      ],
    },
  ],
};

const fonts = [{ name: 'pixelFont', url: '/assets/fonts/04B_03__.TTF' }];

await Assets.init({ manifest });

export const LoadScreen = () => {
  const { app } = useApplication();
  const { loadAudio } = useAudio();
  const { switchScene } = useScene();

  const [progress, setProgress] = useState(0);
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

  useEffect(() => {
    let isCancelled = false;
    const loadAssets = async () => {
      if (!app) return;

      const totalAssets =
        manifest.bundles.reduce(
          (sum, bundle) => sum + bundle.assets.length,
          0,
        ) +
        fonts.length +
        audioManifest.length;
      let loadedCount = 0;

      for (const bundle of manifest.bundles) {
        for (const asset of bundle.assets) {
          await Assets.load(asset.src);
          if (isCancelled) return;
          loadedCount += 1;
          setProgress(Math.floor((loadedCount / totalAssets) * 100));
        }
      }

      for (const font of fonts) {
        const fontFace = new FontFace(font.name, `url(${font.url})`);
        await fontFace.load();
        document.fonts.add(fontFace);
        if (isCancelled) return;
        loadedCount += 1;
        setProgress(Math.floor((loadedCount / totalAssets) * 100));
      }

      await loadAudio(audioManifest);
      if (isCancelled) return;
      loadedCount += audioManifest.length;
      setProgress(Math.floor((loadedCount / totalAssets) * 100));

      if (!isCancelled) switchScene('MainScene');
    };

    loadAssets();

    return () => {
      isCancelled = true;
    };
  }, [app, switchScene, useAudio]);

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
