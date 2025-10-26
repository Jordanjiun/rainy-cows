import { extend, useApplication } from '@pixi/react';
import { Container } from 'pixi.js';
import { Farm } from '../components/Farm';

extend({ Container });

export const MainScene = () => {
  const { app } = useApplication();

  if (!app) return null;
  const appWidth = app.renderer?.width ?? 0;
  const appHeight = app.renderer?.height ?? 0;

  return (
    <pixiContainer>
      <Farm appWidth={appWidth} appHeight={appHeight} />
    </pixiContainer>
  );
};
