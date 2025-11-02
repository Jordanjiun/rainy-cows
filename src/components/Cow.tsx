import { extend } from '@pixi/react';
import { AnimatedSprite } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useCowActions } from '../game/cowLogic';
import { useCowAnimations } from '../game/cowBuilder';

extend({ AnimatedSprite });

const cowAnimSpeed = Number(import.meta.env.VITE_COW_ANIM_SPEED);
const pointerHoldThreshold = Number(
  import.meta.env.VITE_POINTER_HOLD_THRESHOLD_MS,
);

const seed = Date.now(); // replace once cows have data

function handleClicks(
  spriteRef: RefObject<AnimatedSprite | null>,
  petCow: () => void,
) {
  const sprite = spriteRef.current;
  if (!sprite) return;

  sprite.eventMode = 'static';
  let pointerDownTime = 0;

  const handlePointerDown = () => {
    pointerDownTime = performance.now();
  };

  const handlePointerUp = () => {
    const duration = performance.now() - pointerDownTime;
    if (duration < pointerHoldThreshold) {
      petCow();
    }
  };

  sprite.on('pointerdown', handlePointerDown);
  sprite.on('pointerup', handlePointerUp);
  sprite.on('pointerupoutside', handlePointerUp);

  return () => {
    sprite.off('pointerdown', handlePointerDown);
    sprite.off('pointerup', handlePointerUp);
    sprite.off('pointerupoutside', handlePointerUp);
  };
}

export const Cow = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { pos, cowScale, animation, direction, petCow } = useCowActions(
    appWidth,
    appHeight,
    seed,
  );
  const animations = useCowAnimations();
  const spriteRef = useRef<AnimatedSprite>(null);

  const [currentAnim, setCurrentAnim] = useState('idle');
  const [queuedAnim, setQueuedAnim] = useState<string | null>(null);

  const handleAnimationChange = (animation: string) => {
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
  };

  const handleAnimation = () => {
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
  };

  useEffect(() => {
    handleAnimationChange(animation);
  }, [animation, animations]);

  useEffect(() => {
    handleAnimation();
  }, [currentAnim, animations]);

  useEffect(() => {
    handleClicks(spriteRef, petCow);
  }, [petCow]);

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
