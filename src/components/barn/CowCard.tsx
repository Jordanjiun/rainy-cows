import { extend } from '@pixi/react';
import { AnimatedSprite, Assets, Container, Graphics } from 'pixi.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCowAnimations, useCowFilter } from '../../game/cowBuilder';
import type { Cow } from '../../game/cowModel';
import type { Texture } from 'pixi.js';

extend({ AnimatedSprite, Container, Graphics });

const heartMaxNum = 10;
const heartScale = 0.07;
const heartSpacing = 1.6;
const assetNames = ['heart', 'noHeart'];

interface CowCardProps {
  x: number;
  y: number;
  cardWidth: number;
  cardHeight: number;
  cow: Cow;
}

export const CowCard = ({ x, y, cardWidth, cardHeight, cow }: CowCardProps) => {
  const animations = useCowAnimations(cow.sprite.layers);
  const layerFilters = useCowFilter(cow.sprite);

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const containerRef = useRef<Container>(null);

  useEffect(() => {
    let mounted = true;
    async function loadTextures() {
      const loaded: Record<string, Texture> = await Assets.load(assetNames);
      if (mounted) setTextures(loaded);
    }
    loadTextures();
    return () => {
      mounted = false;
    };
  }, []);

  const drawBox = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(x, y, cardWidth, cardHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    };
  }, [x, y, cardWidth, cardHeight]);

  const drawHearts = useMemo(() => {
    if (!textures.noHeart || !textures.heart) return null;
    return (
      <>
        {textures.noHeart &&
          Array.from({ length: heartMaxNum }).map((_, i) => (
            <pixiSprite
              key={i}
              texture={textures.noHeart}
              scale={heartScale}
              x={
                x +
                110 +
                i * (textures.noHeart.width * heartScale + heartSpacing)
              }
              y={y + 35}
            />
          ))}

        {textures.heart &&
          Array.from({ length: cow.hearts }).map((_, i) => (
            <pixiSprite
              key={i}
              texture={textures.heart}
              scale={heartScale}
              x={
                x + 110 + i * (textures.heart.width * heartScale + heartSpacing)
              }
              y={y + 35}
            />
          ))}
      </>
    );
  }, [x, y, textures.noHeart, textures.heart, cow.hearts]);

  if (!animations) return null;

  return (
    <>
      <pixiGraphics draw={drawBox} />
      <pixiContainer ref={containerRef} x={x + 55} y={y + 40} scale={2.5}>
        {Object.entries(animations).map(([layerName, animMap]) => (
          <pixiAnimatedSprite
            key={layerName}
            textures={animMap['idle']}
            anchor={0.5}
            filters={[layerFilters[layerName]]}
          />
        ))}
      </pixiContainer>
      <pixiText
        x={x + 110}
        y={y + 5}
        text={`${cow.name}`}
        style={{ fontSize: 24, fontFamily: 'pixelFont' }}
      />
      {drawHearts}
    </>
  );
};
