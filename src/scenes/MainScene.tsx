import { extend, useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { useEffect, useState } from 'react';
import { CowManager } from '../components/CowManager';
import { Farm } from '../components/Farm';
import { FarmHud } from '../components/FarmHud';
import { FloatingMooney } from '../components/FloatingMooney';
import { HarvestButton } from '../components/HarvestButton';
import { MainMenu } from '../components/menu/MainMenu';
import { CowProvider } from '../context/CowProvider';

extend({ Container });

export const MainScene = () => {
  const { app } = useApplication();
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!app) return;

    const updateSize = () => {
      setSize({ width: app.renderer.width, height: app.renderer.height });
    };

    updateSize();
    app.renderer.on('resize', updateSize);

    return () => {
      app.renderer.off('resize', updateSize);
    };
  }, [app]);

  if (!app || size.width === 0 || size.height === 0) return null;

  return (
    <pixiContainer>
      <CowProvider>
        <Farm appWidth={size.width} appHeight={size.height} />
        <FarmHud />
        <CowManager appWidth={size.width} appHeight={size.height} />
        <HarvestButton appHeight={size.height} />
        <FloatingMooney appWidth={size.width} appHeight={size.height} />
        <MainMenu appWidth={size.width} appHeight={size.height} />
      </CowProvider>
    </pixiContainer>
  );
};
