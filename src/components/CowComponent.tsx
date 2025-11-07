import { extend } from '@pixi/react';
import { AnimatedSprite, Container, Texture } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { useCowActions } from '../game/cowLogic';
import { useCowAnimations, useCowFilter } from '../game/cowBuilder';
import type { Cow } from '../models/cowModel';

extend({ AnimatedSprite, Container });

export const CowComponent = ({
  appWidth,
  appHeight,
  cow,
  onPositionUpdate,
  registerRef,
}: {
  appWidth: number;
  appHeight: number;
  cow: Cow;
  onPositionUpdate?: (id: string, x: number, y: number) => void;
  registerRef?: (
    layerRefs: Record<string, AnimatedSprite | null>,
    petCow: () => void,
  ) => void;
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
    sprite.animationSpeed = Number(import.meta.env.VITE_COW_ANIM_SPEED);
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
    onPositionUpdate?.(cow.id, pos.x, pos.y);
  }, [pos.y]);

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
    registerRef?.(layerRefs.current, petCow);
  }, [layerRefs.current, registerRef, petCow]);

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
