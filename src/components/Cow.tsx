import { extend } from '@pixi/react';
import { Sprite } from 'pixi.js';
import { useCowMovement, useCowTexture } from '../game/cowLogic';

extend({ Sprite });

export const Cow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { pos, cowScale } = useCowMovement(appWidth, appHeight);
  const cowTexture = useCowTexture();

  if (!cowTexture) return null;
  cowTexture.source.scaleMode = 'nearest';

  return (
    <pixiSprite
      texture={cowTexture}
      x={pos.x}
      y={pos.y}
      scale={cowScale}
      anchor={0.5}
    />
  );
};
