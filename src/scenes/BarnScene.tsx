import { extend, useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { useEffect, useState } from 'react';
import { CowProvider, MenuProvider, ToastProvider } from '../context/Providers';
import { Barn } from '../components/barn/Barn';
import { RenameCow } from '../components/barn/RenameCow';
import { SellCow } from '../components/menu/SellCow';

extend({ Container });

export const BarnScene = () => {
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
      <ToastProvider>
        <MenuProvider>
          <CowProvider>
            <Barn appWidth={size.width} appHeight={size.height} />
            <SellCow appWidth={size.width} appHeight={size.height} />
            <RenameCow appWidth={size.width} appHeight={size.height} />
          </CowProvider>
        </MenuProvider>
      </ToastProvider>
    </pixiContainer>
  );
};
