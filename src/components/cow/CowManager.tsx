import { extend } from '@pixi/react';
import { AnimatedSprite, Container, Graphics } from 'pixi.js';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { CowComponent } from './CowComponent';
import { CowInfoBox } from './CowInfoBox';
import { FloatingHearts } from './FloatingHeart';
import { useCow } from '../../context/hooks';
import { cowConfig } from '../../data/cowData';
import { useGameStore } from '../../game/store';
import { getCowScale } from '../../game/utils';
import { Cow } from '../../models/cowModel';

extend({ AnimatedSprite, Container, Graphics });

export const CowManager = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { cows, isHarvest, addCow } = useGameStore();
  const { selectedCow, setSelectedCow } = useCow();
  const cowScale = getCowScale(appWidth * appHeight);

  const [cowPositions, setCowPositions] = useState<Record<string, number>>({});
  const [cowXY, setCowXY] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const [cowXps, setCowXps] = useState<Record<string, number>>({});
  const [cowHearts, setCowHearts] = useState<Record<string, number>>({});
  const [heartEvents, setHeartEvents] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  const cowXYRef = useRef(cowXY);
  const cowRefs = useRef<Record<string, AnimatedSprite | null>>({});
  const petAnimMap = useRef(new WeakMap<AnimatedSprite, () => void>()).current;
  const cleanupPointerHandlers = useRef<Record<string, () => void>>({});

  useEffect(() => {
    cowXYRef.current = cowXY;
  }, [cowXY]);

  useEffect(() => {
    const initialXps: Record<string, number> = {};
    const initialHearts: Record<string, number> = {};

    cows.forEach((cow) => {
      initialXps[cow.id] = cow.xp;
      initialHearts[cow.id] = cow.hearts;
    });

    setCowXps(initialXps);
    setCowHearts(initialHearts);
  }, [cows, appWidth, appHeight]);

  const clearHeartEvents = useCallback(() => {
    setHeartEvents([]);
  }, []);

  const handleAddCow = useCallback(() => {
    addCow(new Cow(cows));
  }, [addCow, cows]);

  const handlePositionUpdate = useCallback(
    (id: string, x: number, y: number) => {
      setCowPositions((prev) => ({ ...prev, [id]: y }));
      setCowXY((prev) => {
        const updated = { ...prev, [id]: { x, y } };
        cowXYRef.current = updated;
        return updated;
      });
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

      let pointerDownTime = 0;
      let startX = 0;
      let startY = 0;
      let longPressTimeout: number | null = null;

      const pointerMoveThreshold = 5;
      const holdThreshold = Number(
        import.meta.env.VITE_POINTER_HOLD_THRESHOLD_MS,
      );

      const handlePointerDown = (e: PointerEvent) => {
        if (isHarvest) return;
        if (e.button !== 0) return;
        e.preventDefault();

        pointerDownTime = performance.now();
        startX = e.clientX;
        startY = e.clientY;

        longPressTimeout = window.setTimeout(() => {
          if (!isHarvest && selectedCow?.id !== cow.id) {
            setSelectedCow(cow);
          }
          longPressTimeout = null;
        }, holdThreshold);
      };

      const handlePointerUp = (e: PointerEvent) => {
        if (isHarvest) return;
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

      sprite.eventMode = isHarvest ? 'none' : 'static';
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
    [isHarvest, selectedCow, handleHeartChange],
  );

  useEffect(() => {
    if (isHarvest) {
      if (selectedCow) {
        setSelectedCow(null);
      }

      Object.entries(cowRefs.current).forEach(([cowId, sprite]) => {
        if (!sprite) return;
        sprite.eventMode = 'none';

        const cleanup = cleanupPointerHandlers.current[cowId];
        cleanup?.();

        cleanupPointerHandlers.current[cowId] = () => {};
      });
    } else {
      cows.forEach((cow) => {
        const sprite = cowRefs.current[cow.id];
        if (!sprite) return;

        sprite.eventMode = 'static';

        const handlePetAnimation = petAnimMap.get(sprite);
        if (!handlePetAnimation) return;

        const cleanup = handleClick(cow, sprite, handlePetAnimation);
        cleanupPointerHandlers.current[cow.id] = cleanup || (() => {});
      });
    }
  }, [isHarvest, cows, handleClick]);

  const sortedCows = [...cows].sort(
    (a, b) => (cowPositions[a.id] ?? 0) - (cowPositions[b.id] ?? 0),
  );

  useEffect(() => {
    const handleRightClick = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        handleAddCow();
      }
    };

    document.addEventListener('contextmenu', handleRightClick);
    return () => document.removeEventListener('contextmenu', handleRightClick);
  }, [handleAddCow]);

  const drawSelectedCowIndicator = useMemo(() => {
    if (!selectedCow) return null;
    const pos = cowXY[selectedCow.id];
    if (!pos) return null;
    const { x, y } = pos;
    const rectSize = cowConfig.frameSize * cowScale;

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
            petAnimMap.set(baseLayer, handlePetAnimation);
            const cleanup = handleClick(cow, baseLayer, handlePetAnimation);
            cleanupPointerHandlers.current[cow.id] = cleanup || (() => {});
          }}
        />
      ))}

      {drawSelectedCowIndicator}

      <FloatingHearts heartEvents={heartEvents} onConsumed={clearHeartEvents} />
    </>
  );
};
