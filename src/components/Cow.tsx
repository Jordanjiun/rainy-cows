import { extend } from '@pixi/react';
import { AnimatedSprite } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { useCowAnimations, useCowKeyboardMovement } from '../game/cowLogic';

extend({ AnimatedSprite });

const cowAnimSpeed = Number(import.meta.env.VITE_COW_ANIM_SPEED);

export const Cow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { pos, cowScale } = useCowKeyboardMovement(appWidth, appHeight);
  const animations = useCowAnimations();
  const [currentAnim, setCurrentAnim] = useState('idle');
  const spriteRef = useRef<AnimatedSprite>(null);
  const animation = 'look';

  useEffect(() => {
    if (animations && animations[animation]) {
      setCurrentAnim(animation);
    }
  }, [animation, animations]);

  useEffect(() => {
    const sprite = spriteRef.current;
    if (!sprite) return;

    sprite.animationSpeed = cowAnimSpeed;
    sprite.loop = true;
    sprite.play();
  }, [animations, currentAnim]);

  if (!animations) return null;

  const textures = animations[currentAnim];

  return (
    <pixiAnimatedSprite
      ref={spriteRef}
      textures={textures}
      x={pos.x}
      y={pos.y}
      scale={cowScale}
      anchor={0.5}
    />
  );
};
