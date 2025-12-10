import { extend, useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { useEffect, useMemo, useState } from 'react';
import { CowManager } from '../components/cow/CowManager';
import { Farm } from '../components/farm/Farm';
import { FarmHud } from '../components/farm/FarmHud';
import { FloatingMooney } from '../components/farm/FloatingMooney';
import { HarvestButton } from '../components/farm/HarvestButton';
import { MainMenu } from '../components/menu/MainMenu';
import { SellCow } from '../components/menu/SellCow';
import { Shop } from '../components/menu/Shop';
import { Tutorial } from '../components/others/Tutorial';
import { useGameStore } from '../game/store';
import {
  CowProvider,
  MenuProvider,
  MooneyProvider,
  ToastProvider,
} from '../context/Providers';

extend({ Container });

export const MainScene = () => {
  const { app } = useApplication();
  const { tutorial } = useGameStore();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const isTutorial = useMemo(() => {
    return tutorial > 0;
  }, [tutorial]);

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
      <ToastProvider>
        <MenuProvider>
          <MooneyProvider>
            <CowProvider>
              <Farm appWidth={size.width} appHeight={size.height} />
              <FarmHud />
              <CowManager appWidth={size.width} appHeight={size.height} />
              <HarvestButton appHeight={size.height} />
              <FloatingMooney appWidth={size.width} appHeight={size.height} />
              <Shop appWidth={size.width} appHeight={size.height} />
              <MainMenu appWidth={size.width} appHeight={size.height} />
              <SellCow appWidth={size.width} appHeight={size.height} />
              {isTutorial && (
                <Tutorial appWidth={size.width} appHeight={size.height} />
              )}
            </CowProvider>
          </MooneyProvider>
        </MenuProvider>
      </ToastProvider>
    </pixiContainer>
  );
};
