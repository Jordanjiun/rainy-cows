import { extend, useTick } from '@pixi/react';
import { AnimatedSprite, Container, Graphics, Ticker } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';
import { cowConfig } from '../../data/cowData';
import { useAudio } from '../../context/hooks';
import {
  animationsDef,
  useCowAnimations,
  useCowFilter,
} from '../../game/cowBuilder';
import type { Cow } from '../../game/cowModel';
import type { Texture } from 'pixi.js';

extend({ AnimatedSprite, Container, Graphics });

const cowScale = 2.25;
const startX = -20;
const targetX = 45;

interface BarnCowProps {
  barnWidth: number;
  barnHeight: number;
  cow: Cow;
}

export const BarnCow = ({ barnWidth, barnHeight, cow }: BarnCowProps) => {
  const { audioMap } = useAudio();

  const animations = useCowAnimations(cow.sprite.layers);
  const layerFilters = useCowFilter(cow.sprite);

  const [currentAnim, setCurrentAnim] = useState('walk');
  const [queuedAnim, setQueuedAnim] = useState<string | null>(null);

  const currentAnimRef = useRef('walk');
  const layerRefs = useRef<Record<string, AnimatedSprite | null>>({});

  const containerRef = useRef<Container>(null);
  const cowXOffset = useRef<number>(startX);
  const direction = useRef<number>(-1);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rectSize = cowConfig.frameSize * cowScale;

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
    currentAnimRef.current = currentAnim;
  }, [currentAnim]);

  useEffect(() => {
    if (currentAnim !== 'idle') return;

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    idleTimeoutRef.current = setTimeout(() => {
      direction.current = 1;
      handleAnimationChange('walk');
    }, 3000);

    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [currentAnim]);

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

  const handleAnimationChange = (animation: string) => {
    if (!animations) return;

    const nextAnimCapitalized =
      animation.charAt(0).toUpperCase() + animation.slice(1);
    const transitionKey = `${currentAnimRef.current}To${nextAnimCapitalized}`;
    const baseLayer = Object.keys(animations)[0];

    if (animations[baseLayer]?.[transitionKey]) {
      setQueuedAnim(animation);
      setCurrentAnim(transitionKey);
    } else {
      setCurrentAnim(animation);
      setQueuedAnim(null);
    }
  };

  const handlePet = () => {
    if (currentAnim != 'idle') return;
    var soundId = audioMap.moo.play();
    audioMap.moo.rate(cow.pitch ?? 1, soundId);

    setTimeout(() => {
      setCurrentAnim('idle');
    }, animationsDef['pet'].length * cowConfig.msPerFrame);
    setCurrentAnim('pet');

    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
  };

  const moveTowards = (current: number, target: number, step: number) => {
    const diff = target - current;
    if (Math.abs(diff) <= step) {
      return target;
    }
    return current + Math.sign(diff) * step;
  };

  const updateCow = (ticker: Ticker) => {
    const delta = ticker.deltaTime;
    const step = (cowConfig.speed / 2) * delta;
    const current = cowXOffset.current;
    const isGoingToTarget = direction.current === -1;
    const destination = isGoingToTarget ? targetX : startX;

    if (currentAnim != 'walk') return;
    if (current === targetX && isGoingToTarget) return;

    const next = moveTowards(current, destination, step);
    cowXOffset.current = next;

    if (isGoingToTarget && next === targetX) handleAnimationChange('idle');

    if (containerRef.current) {
      containerRef.current.x = barnWidth / 2 - next;
    }
  };

  useTick((ticker) => {
    updateCow(ticker);
  });

  if (!animations) return null;

  return (
    <>
      <pixiContainer
        ref={containerRef}
        y={barnHeight / 2 + rectSize / 2 + 8}
        scale={{ x: cowScale * direction.current, y: cowScale }}
      >
        {Object.entries(animations).map(([layerName, animMap]) => (
          <pixiAnimatedSprite
            key={layerName}
            ref={(el) => void (layerRefs.current[layerName] = el)}
            textures={animMap[currentAnim]}
            anchor={0.5}
            filters={[layerFilters[layerName]]}
            eventMode="static"
            onPointerTap={handlePet}
          />
        ))}
      </pixiContainer>
    </>
  );
};
