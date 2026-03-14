import { extend } from '@pixi/react';
import { AnimatedSprite, Container, Graphics, Texture } from 'pixi.js';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useCow } from '../../context/hooks';
import { cowConfig } from '../../data/cowData';
import { useGameStore } from '../../game/store';
import { useCowAnimations, useCowFilter } from '../../game/cowBuilder';

extend({ Container, Graphics });

export const Player = ({
  x,
  y,
  size,
  cowScale,
  animation,
  gameOver,
}: {
  x: number;
  y: number;
  size: number;
  cowScale: number;
  animation: string;
  gameOver: boolean;
}) => {
  const { selectedCow } = useCow();
  const { isHitbox } = useGameStore();

  if (!selectedCow) return;

  const animations = useCowAnimations(selectedCow.sprite.layers);
  const layerFilters = useCowFilter(selectedCow.sprite);

  const [currentAnim, setCurrentAnim] = useState(animation);
  const [queuedAnim, setQueuedAnim] = useState<string | null>(null);

  const layerRefs = useRef<Record<string, AnimatedSprite | null>>({});
  const containerRef = useRef<Container>(null);

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
    if (!animations) return;
    handleAnimationChange(animation);
  }, [animation, animations]);

  useEffect(() => {
    if (!animations) return;
    if (gameOver) {
      Object.entries(animations).forEach(([layerName]) => {
        layerRefs.current[layerName]?.stop();
      });
    } else {
      Object.entries(animations).forEach(([layerName]) => {
        layerRefs.current[layerName]?.play();
      });
    }
  }, [gameOver]);

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
    sprite.animationSpeed = cowConfig.animSpeed;
    sprite.loop = !currentAnim.includes('To');
    sprite.play();

    sprite.onComplete = () => {
      if (queuedAnim) {
        setCurrentAnim(queuedAnim);
        setQueuedAnim(null);
      }
    };
  };

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(0, 0, size, size);
      g.stroke({
        width: 2,
        color: 'yellow',
      });
    },
    [size],
  );

  if (!animations) return null;

  return (
    <>
      <pixiContainer
        ref={containerRef}
        x={x + size / 2}
        y={y + size / 2 - 5}
        scale={cowScale + 0.7}
      >
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
      {isHitbox && <pixiGraphics draw={draw} x={x} y={y} />}
    </>
  );
};
