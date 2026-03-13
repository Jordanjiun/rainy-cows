import { extend, useTick } from '@pixi/react';
import { Container, Sprite, TilingSprite } from 'pixi.js';
import { useEffect, useMemo, useRef } from 'react';
import { useMenu } from '../../context/hooks';
import { useGrassFrame } from '../../game/grass';

extend({ Container, Sprite, TilingSprite });

const indexes = [24, 32, 42];
const frameSize = 16;
const scale = 3;

type Stub = { x: number; y: number };

export const Ground = ({
  appWidth,
  appHeight,
  grassY,
  speed,
}: {
  appWidth: number;
  appHeight: number;
  grassY: number;
  speed: number;
}) => {
  const { selectedMenu } = useMenu();
  const frames = useGrassFrame(indexes);

  const baseRef = useRef<any>(null);
  const topRef = useRef<any>(null);
  const stubs = useRef<Stub[]>([]);

  const tileSize = frameSize * scale;
  const grassHeight = appHeight / 2;
  const stubCount = Math.ceil(appWidth / tileSize) * 2;

  useEffect(() => {
    stubs.current = Array.from({ length: stubCount }).map(() => ({
      x: Math.random() * appWidth,
      y: Math.random() * (grassHeight - tileSize),
    }));
  }, [appWidth, grassHeight, stubCount, tileSize]);

  if (!frames.every((f) => f)) return null;

  const baseTexture = useMemo(() => frames[0], [frames]);
  const stubTexture = useMemo(() => frames[1], [frames]);
  const topTexture = useMemo(() => frames[2], [frames]);

  useTick((ticker) => {
    if (selectedMenu == 'exitEarly') return;

    const move = speed * ticker.deltaTime;

    if (baseRef.current) baseRef.current.tilePosition.x -= move;
    if (topRef.current) topRef.current.tilePosition.x -= move;

    stubs.current.forEach((s) => {
      s.x -= move;

      if (s.x < -tileSize) {
        s.x = appWidth + Math.random() * tileSize * 2;
        s.y = Math.random() * (grassHeight - tileSize);
      }
    });
  });

  return (
    <pixiContainer y={grassY}>
      <pixiTilingSprite
        ref={baseRef}
        texture={baseTexture}
        width={appWidth}
        height={grassHeight}
        tileScale={{ x: scale, y: scale }}
      />

      {stubs.current.map((s, i) => (
        <pixiSprite
          key={i}
          texture={stubTexture}
          scale={scale}
          x={s.x}
          y={s.y}
        />
      ))}

      <pixiTilingSprite
        ref={topRef}
        texture={topTexture}
        width={appWidth}
        height={tileSize}
        y={-tileSize / 2}
        tileScale={{ x: scale, y: scale }}
      />
    </pixiContainer>
  );
};
