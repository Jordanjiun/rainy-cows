import { extend } from '@pixi/react';
import { AnimatedSprite, Container, Texture } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useCowActions } from '../game/cowLogic';
import { useCowAnimations, useCowFilter } from '../game/cowBuilder';
import type { Cow } from '../models/cowModel';

extend({ AnimatedSprite, Container });

const cowAnimSpeed = Number(import.meta.env.VITE_COW_ANIM_SPEED);
const pointerHoldThreshold = Number(
  import.meta.env.VITE_POINTER_HOLD_THRESHOLD_MS,
);

function handleClicks(
  spriteRef: RefObject<AnimatedSprite | null>,
  petCow: () => void,
) {
  const sprite = spriteRef.current;
  if (!sprite) return;

  sprite.eventMode = 'static';
  let pointerDownTime = 0;

  const handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pointerDownTime = performance.now();
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    if (performance.now() - pointerDownTime < pointerHoldThreshold) {
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

export const CowComponent = ({
  appWidth,
  appHeight,
  cow,
}: {
  appWidth: number;
  appHeight: number;
  cow: Cow;
}) => {
  const { pos, cowScale, animation, direction, petCow } = useCowActions(
    appWidth,
    appHeight,
    cow.seed,
  );
  const animations = useCowAnimations(cow.sprite.layers);
  const layerFilters = useCowFilter(cow.sprite);
  const scale = { x: cowScale * direction, y: cowScale };

  const [currentAnim, setCurrentAnim] = useState('idle');
  const [queuedAnim, setQueuedAnim] = useState<string | null>(null);

  const layerRefs = useRef<Record<string, AnimatedSprite | null>>({});
  const containerRef = useRef<Container>(null);

  const handleAnimationChange = (animation: string) => {
    if (!animations) return;

    const nextAnimCapitalized =
      animation.charAt(0).toUpperCase() + animation.slice(1);
    const transitionKey = `${currentAnim}To${nextAnimCapitalized}`;
    const baseLayer = Object.keys(animations)[0];

    if (animations[baseLayer]?.[transitionKey]) {
      setQueuedAnim(animation);
      setCurrentAnim(transitionKey);
    } else {
      setCurrentAnim(animation);
      setQueuedAnim(null);
    }
  };

  const playAnim = (
    sprite: AnimatedSprite | null,
    textures: Texture[] | undefined,
  ) => {
    if (!sprite || !textures) return;
    sprite.textures = textures;
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
    if (!animations) return;
    Object.entries(animations).forEach(([layerName, animMap]) => {
      const sprite = layerRefs.current[layerName];
      playAnim(sprite, animMap[currentAnim]);
      if (sprite) {
        sprite.filters = [layerFilters[layerName]];
      }
    });
  }, [currentAnim, animations]);

  useEffect(() => {
    const baseLayer = layerRefs.current[Object.keys(layerRefs.current)[0]];
    handleClicks({ current: baseLayer }, petCow);
  }, [petCow]);

  if (!animations) return null;

  return (
    <pixiContainer ref={containerRef} x={pos.x} y={pos.y} scale={scale}>
      {Object.entries(animations).map(([layerName, animMap]) => (
        <pixiAnimatedSprite
          key={layerName}
          ref={(el) => void (layerRefs.current[layerName] = el)}
          textures={animMap[currentAnim]}
          anchor={0.5}
          filters={[layerFilters[layerName]]}
        />
      ))}
    </pixiContainer>
  );
};
