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
  const { pos, cowScale, animation, direction } = useCowKeyboardMovement(
    appWidth,
    appHeight,
  );
  const animations = useCowAnimations();
  const spriteRef = useRef<AnimatedSprite>(null);

  const [currentAnim, setCurrentAnim] = useState('idle');
  const [queuedAnim, setQueuedAnim] = useState<string | null>(null);

  useEffect(() => {
    if (!animations) return;

    const nextAnimCapitalized =
      animation.charAt(0).toUpperCase() + animation.slice(1);
    const transitionKey = `${currentAnim}To${nextAnimCapitalized}`;

    if (animations[transitionKey]) {
      setQueuedAnim(animation);
      setCurrentAnim(transitionKey);
    } else {
      setCurrentAnim(animation);
      setQueuedAnim(null);
    }
  }, [animation, animations]);

  useEffect(() => {
    const sprite = spriteRef.current;
    if (!sprite || !animations) return;

    sprite.textures = animations[currentAnim];
    sprite.animationSpeed = cowAnimSpeed;
    sprite.loop = !currentAnim.includes('To');
    sprite.play();

    sprite.onComplete = () => {
      if (queuedAnim) {
        setCurrentAnim(queuedAnim);
        setQueuedAnim(null);
      }
    };
  }, [currentAnim, animations]);

  if (!animations) return null;

  const textures = animations[currentAnim];

  return (
    <pixiAnimatedSprite
      ref={spriteRef}
      textures={textures}
      x={pos.x}
      y={pos.y}
      scale={{ x: cowScale * direction, y: cowScale }}
      anchor={0.5}
    />
  );
};
