import { extend } from '@pixi/react';
import { AnimatedSprite, Container, Graphics } from 'pixi.js';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { CowComponent } from './CowComponent';
import { CowInfoBox } from './CowInfoBox';
import { FloatingHearts } from './FloatingHeart';
import { getCowScale } from '../game/utils';
import { Cow } from '../models/cowModel';

extend({ AnimatedSprite, Container, Graphics });

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
  const [cowXps, setCowXps] = useState<Record<string, number>>({});
  const [cowHearts, setCowHearts] = useState<Record<string, number>>({});
  const [heartEvents, setHeartEvents] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  const cowRefs = useRef<Record<string, AnimatedSprite | null>>({});
  const cowListenersAttached = useRef<Record<string, boolean>>({});
  const cowXYRef = useRef(cowXY);

  const cowScale = getCowScale(appWidth * appHeight);

  useEffect(() => {
    cowXYRef.current = cowXY;
  }, [cowXY]);

  const addCow = useCallback(() => {
    setCows((prev) => [...prev, new Cow(cows)]);
  }, [cows]);

  const clearHeartEvents = useCallback(() => {
    setHeartEvents([]);
  }, []);

  const handlePositionUpdate = useCallback(
    (id: string, x: number, y: number) => {
      setCowPositions((prev) => ({ ...prev, [id]: y }));
      if (x !== undefined) {
        setCowXY((prev) => {
          const updated = { ...prev, [id]: { x, y } };
          cowXYRef.current = updated;
          return updated;
        });
      }
    },
    [],
  );

  const handleXpChange = useCallback((id: string, xp: number) => {
    setCowXps((prev) => ({ ...prev, [id]: xp }));
  }, []);

  const handleHeartChange = useCallback((id: string, hearts: number) => {
    setCowHearts((prev) => {
      const oldHearts = prev[id] ?? 0;
      const newHearts = hearts;
      if (newHearts > oldHearts) {
        const cowPos = cowXYRef.current[id];
        if (cowPos) {
          setHeartEvents((prev) => [...prev, { id, x: cowPos.x, y: cowPos.y }]);
        }
      }
      return { ...prev, [id]: newHearts };
    });
  }, []);

  const handleClick = useCallback(
    (
      cow: Cow,
      sprite: AnimatedSprite | null,
      handlePetAnimation: () => void,
    ) => {
      if (!sprite) return;

      sprite.eventMode = 'static';
      let pointerDownTime = 0;
      let startX = 0;
      let startY = 0;
      let longPressTimeout: number | null = null;

      const pointerMoveThreshold = 5;
      const holdThreshold = Number(
        import.meta.env.VITE_POINTER_HOLD_THRESHOLD_MS,
      );

      const handlePointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();

        pointerDownTime = performance.now();
        startX = e.clientX;
        startY = e.clientY;

        longPressTimeout = setTimeout(() => {
          if (selectedCow?.id !== cow.id) {
            setSelectedCow(cow);
          }
          longPressTimeout = null;
        }, holdThreshold);
      };

      const handlePointerUp = (e: PointerEvent) => {
        if (e.button !== 0) return;
        e.preventDefault();

        if (longPressTimeout) {
          clearTimeout(longPressTimeout);
          longPressTimeout = null;
        }

        const moved =
          Math.abs(e.clientX - startX) > pointerMoveThreshold ||
          Math.abs(e.clientY - startY) > pointerMoveThreshold;

        if (moved) return;

        const duration = performance.now() - pointerDownTime;
        if (duration < holdThreshold) {
          handlePetAnimation();
          handleHeartChange(cow.id, cow.pet());
        }
      };

      const handlePointerCancelOrLeave = () => {
        if (longPressTimeout) {
          clearTimeout(longPressTimeout);
          longPressTimeout = null;
        }
      };

      sprite.on('pointerdown', handlePointerDown);
      sprite.on('pointerup', handlePointerUp);
      sprite.on('pointerupoutside', handlePointerUp);
      sprite.on('pointercancel', handlePointerCancelOrLeave);
      sprite.on('pointerleave', handlePointerCancelOrLeave);

      return () => {
        sprite.off('pointerdown', handlePointerDown);
        sprite.off('pointerup', handlePointerUp);
        sprite.off('pointerupoutside', handlePointerUp);
        sprite.off('pointercancel', handlePointerCancelOrLeave);
        sprite.off('pointerleave', handlePointerCancelOrLeave);
      };
    },
    [selectedCow],
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
    const rectSize = Number(import.meta.env.VITE_COW_FRAME_SIZE) * cowScale;

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
  }, [appWidth, appHeight, selectedCow, cowXY]);

  return (
    <>
      {selectedCow && (
        <CowInfoBox
          appWidth={appWidth}
          appHeight={appHeight}
          cow={selectedCow}
          xp={cowXps[selectedCow.id] ?? selectedCow.xp}
          hearts={cowHearts[selectedCow.id] ?? selectedCow.hearts}
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
          onXpUpdate={handleXpChange}
          registerRef={(layerRefs, handlePetAnimation) => {
            const baseLayer = Object.values(layerRefs)[0];
            if (!baseLayer) return;

            cowRefs.current[cow.id] = baseLayer;
            if (!cowListenersAttached.current[cow.id]) {
              const cleanup = handleClick(cow, baseLayer, handlePetAnimation);
              cowListenersAttached.current[cow.id] = true;
              baseLayer.on('removed', () => {
                cleanup?.();
                cowListenersAttached.current[cow.id] = false;
              });
            }
          }}
        />
      ))}

      {drawSelectedCowIndicator}

      <FloatingHearts heartEvents={heartEvents} onConsumed={clearHeartEvents} />
    </>
  );
};
