import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { CowComponent } from './CowComponent';
import { CowInfoBox } from './CowInfoBox';
import { getCowScale } from '../game/utils';
import { Cow } from '../models/cowModel';

extend({ Container, Graphics });

const frameSize = Number(import.meta.env.VITE_COW_FRAME_SIZE);

export const CowManager = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const [cowPositions, setCowPositions] = useState<Record<string, number>>({});
  const [cows, setCows] = useState(() =>
    Array.from({ length: 1 }, () => new Cow()),
  );
  const [selectedCow, setSelectedCow] = useState<Cow | null>(null);
  const [cowXY, setCowXY] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const cowScale = getCowScale(appWidth * appHeight);

  const addCow = useCallback(() => {
    setCows((prev) => [...prev, new Cow(cows)]);
  }, [cows]);

  const handlePositionUpdate = useCallback(
    (id: string, x: number, y: number) => {
      setCowPositions((prev) => ({ ...prev, [id]: y }));
      if (x !== undefined) setCowXY((prev) => ({ ...prev, [id]: { x, y } }));
    },
    [],
  );

  const sortedCows = [...cows].sort(
    (a, b) => (cowPositions[a.id] ?? 0) - (cowPositions[b.id] ?? 0),
  );

  useEffect(() => {
    const handleRightClick = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        addCow();
      }
    };

    document.addEventListener('contextmenu', handleRightClick);
    return () => document.removeEventListener('contextmenu', handleRightClick);
  }, [addCow]);

  const drawSelectedCowIndicator = useMemo(() => {
    if (!selectedCow) return null;
    const pos = cowXY[selectedCow.id];
    if (!pos) return null;
    const { x, y } = pos;
    const rectSize = frameSize * cowScale;

    return (
      <pixiContainer x={x - rectSize / 2} y={y - rectSize / 2}>
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, rectSize, rectSize);
            g.stroke({
              width: 2,
              color: 'yellow',
            });
          }}
        />
      </pixiContainer>
    );
  }, [selectedCow, cowXY, appWidth, appHeight]);

  return (
    <>
      {selectedCow && (
        <CowInfoBox
          appWidth={appWidth}
          appHeight={appHeight}
          cow={selectedCow}
          onClose={() => setSelectedCow(null)}
        />
      )}

      {sortedCows.map((cow) => (
        <CowComponent
          key={cow.id}
          cow={cow}
          appWidth={appWidth}
          appHeight={appHeight}
          onPositionUpdate={handlePositionUpdate}
          onLongPress={(c) => setSelectedCow(c)}
        />
      ))}

      {drawSelectedCowIndicator}
    </>
  );
};
