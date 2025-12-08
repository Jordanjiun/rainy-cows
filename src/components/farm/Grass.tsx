import { extend } from '@pixi/react';
import { ColorMatrixFilter, Container, Sprite, TilingSprite } from 'pixi.js';
import { useMemo } from 'react';
import { useGrassFrame } from '../../game/grass';
import { brightnessByTime } from '../../game/utils';

extend({ Container, Sprite, TilingSprite });

const indexes = [24, 32, 40, 42];
const frameSize = 16;
const scale = 3;
const jitter = 5;

const landRatio = Number(import.meta.env.VITE_LAND_RATIO);
const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const Grass = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const frames = useGrassFrame(indexes);

  if (!frames.every((f) => f)) return null;

  const filter = useMemo(() => {
    const f = new ColorMatrixFilter();
    f.brightness(brightnessByTime(), true);
    return f;
  }, []);

  const tileSize = frameSize * scale;
  const grassTop = appHeight - appHeight * landRatio;
  const grassHeight = appHeight * landRatio - footerHeight;
  const cols = Math.ceil(appWidth / tileSize) + 1;
  const rows = Math.ceil(grassHeight / tileSize) + 1;

  const randomLayers = useMemo(() => {
    return {
      stub: Array.from({ length: rows }).map(() =>
        Array.from({ length: cols }).map(() => Math.random() < 0.4),
      ),
      grass: Array.from({ length: rows }).map(() =>
        Array.from({ length: cols }).map(() => Math.random() < 0.1),
      ),
    };
  }, [rows, cols]);

  const topRowOffsets = useMemo(() => {
    return Array.from({ length: cols }).map(() => -Math.random() * jitter);
  }, [cols]);

  const cellOffsets = useMemo(() => {
    return {
      stub: Array.from({ length: rows }).map(() =>
        Array.from({ length: cols }).map(() => ({
          x: (Math.random() - 0.5) * jitter,
          y: (Math.random() - 0.5) * jitter,
        })),
      ),
      grass: Array.from({ length: rows }).map(() =>
        Array.from({ length: cols }).map(() => ({
          x: (Math.random() - 0.5) * jitter,
          y: (Math.random() - 0.5) * jitter,
        })),
      ),
    };
  }, [rows, cols]);

  return (
    <pixiContainer y={grassTop} filters={[filter]}>
      {Array.from({ length: cols }).map((_, col) => (
        <pixiSprite
          key={`top-${col}`}
          texture={frames[3]}
          scale={scale}
          x={col * tileSize}
          y={-tileSize / 2 - 10 + topRowOffsets[col]}
        />
      ))}

      {Array.from({ length: rows * cols }).map((_, i) => {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const x = col * tileSize;
        const y = row * tileSize;
        return (
          <pixiContainer key={`cell-${i}`}>
            <pixiSprite texture={frames[0]} scale={scale} x={x} y={y} />
            {randomLayers.stub[row][col] && (
              <pixiSprite
                key={`stub-${i}`}
                texture={frames[1]}
                scale={scale}
                x={x + cellOffsets.stub[row][col].x}
                y={y + cellOffsets.stub[row][col].y}
              />
            )}
            {randomLayers.grass[row][col] && (
              <pixiSprite
                key={`grass-${i}`}
                texture={frames[2]}
                scale={scale}
                x={x + cellOffsets.grass[row][col].x}
                y={y + cellOffsets.grass[row][col].y}
              />
            )}
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
};
