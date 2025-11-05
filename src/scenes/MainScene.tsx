import { extend, useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { CowManager } from '../components/CowManager';
import { Farm } from '../components/Farm';
import { useEffect, useState } from 'react';

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
      <Farm appWidth={size.width} appHeight={size.height} />
      <CowManager appWidth={size.width} appHeight={size.height} />
    </pixiContainer>
  );
};
