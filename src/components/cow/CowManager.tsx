import { extend } from '@pixi/react';
import { AnimatedSprite, Container, Graphics } from 'pixi.js';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { CowComponent } from './CowComponent';
import { CowInfoBox } from './CowInfoBox';
import { FloatingArrow } from '../others/FloatingArrow';
import { FloatingHearts } from './FloatingHeart';
import { useAudio, useCow, useMenu } from '../../context/hooks';
import { cowConfig } from '../../data/cowData';
import { useGameStore } from '../../game/store';
import { getCowScale } from '../../game/utils';
import { Cow } from '../../game/cowModel';

extend({ AnimatedSprite, Container, Graphics });

const pointerMoveThreshold = 5;
const holdThreshold = 200;

export const CowManager = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { selectedMenu } = useMenu();
  const { cows, isHarvest, tutorial, setTutorial } = useGameStore();
  const { selectedCow, setSelectedCow } = useCow();
  const cowScale = getCowScale(appWidth * appHeight);

  const [cowPositions, setCowPositions] = useState<Record<string, number>>({});
  const [cowXY, setCowXY] = useState<Record<string, { x: number; y: number }>>(
    {},
  );
  const [_, setCowHearts] = useState<Record<string, number>>({});
  const [heartEvents, setHeartEvents] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  const cowXYRef = useRef(cowXY);
  const cowRefs = useRef<Record<string, AnimatedSprite | null>>({});
  const petAnimMap = useRef(new WeakMap<AnimatedSprite, () => void>()).current;
  const cleanupPointerHandlers = useRef<Record<string, () => void>>({});
  const lastCowIdRef = useRef<string | null>(null);

  const handleSetCow = useCallback(
    (cow: Cow) => {
      if (lastCowIdRef.current === cow.id) {
        return;
      }
      lastCowIdRef.current = cow.id;
      if (selectedCow?.id !== cow.id) {
        audioMap.click.play();
        setSelectedCow(cow);
      }
    },
    [selectedCow],
  );

  useEffect(() => {
    lastCowIdRef.current = null;
  }, [isHarvest, selectedMenu]);

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

    setCowHearts(initialHearts);
  }, [cows, appWidth, appHeight]);

  const clearHeartEvents = useCallback(() => {
    setHeartEvents([]);
  }, []);

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
      let tapHandled = false;
      let isPressActive = false;

      const handlePointerDown = (e: PointerEvent) => {
        if (isHarvest) return;
        if (e.button !== 0 && e.pointerType !== 'touch') return;

        pointerDownTime = performance.now();
        startX = e.clientX;
        startY = e.clientY;
        tapHandled = false;
        isPressActive = true;

        longPressTimeout = window.setTimeout(() => {
          if (!tapHandled) {
            handleSetCow(cow);
            tapHandled = true;
          }
          longPressTimeout = null;
        }, holdThreshold);
      };

      const processPointerUp = (e: PointerEvent) => {
        if (!isPressActive) return;
        isPressActive = false;

        if (longPressTimeout) {
          clearTimeout(longPressTimeout);
          longPressTimeout = null;
        }

        if (tapHandled) return;
        tapHandled = true;

        const moved =
          Math.abs(e.clientX - startX) > pointerMoveThreshold ||
          Math.abs(e.clientY - startY) > pointerMoveThreshold;
        if (moved) return;

        const duration = performance.now() - pointerDownTime;
        if (duration < holdThreshold) {
          handlePetAnimation();
          handleHeartChange(cow.id, cow.pet());
          if (tutorial == 4 && useGameStore.getState().tutorial == 4) {
            setSelectedCow(null);
            setTutorial(5);
          }
        }
      };

      const handlePointerUp = (e: PointerEvent) => processPointerUp(e);
      const handlePointerUpOutside = (e: PointerEvent) => processPointerUp(e);
      const handlePointerCancelOrLeave = () => {
        if (longPressTimeout) clearTimeout(longPressTimeout);
        longPressTimeout = null;
        isPressActive = false;
      };

      sprite.eventMode = isHarvest ? 'none' : 'static';
      sprite.on('pointerdown', handlePointerDown);
      sprite.on('pointerup', handlePointerUp);
      sprite.on('pointerupoutside', handlePointerUpOutside);
      sprite.on('pointercancel', handlePointerCancelOrLeave);
      sprite.on('pointerleave', handlePointerCancelOrLeave);

      return () => {
        sprite.off('pointerdown', handlePointerDown);
        sprite.off('pointerup', handlePointerUp);
        sprite.off('pointerupoutside', handlePointerUpOutside);
        sprite.off('pointercancel', handlePointerCancelOrLeave);
        sprite.off('pointerleave', handlePointerCancelOrLeave);
      };
    },
    [isHarvest, selectedCow, handleHeartChange],
  );

  const sortedCows = [...cows].sort(
    (a, b) => (cowPositions[a.id] ?? 0) - (cowPositions[b.id] ?? 0),
  );

  useEffect(() => {
    const handleRightClick = (e: PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleRightClick);
    return () => document.removeEventListener('contextmenu', handleRightClick);
  }, []);

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

  const drawFloatingArrow = useMemo(() => {
    if (tutorial != 4) return;
    const pos = cowXY[useGameStore.getState().cows[0].id];
    if (!pos) return null;
    const { x, y } = pos;
    return <FloatingArrow x={x} y={y - 45} rotation={Math.PI} />;
  }, [appWidth, appHeight, selectedCow, cowXY]);

  return (
    <>
      {sortedCows.map((cow) => (
        <CowComponent
          key={cow.id}
          cow={cow}
          appWidth={appWidth}
          appHeight={appHeight}
          onPositionUpdate={handlePositionUpdate}
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

      {selectedCow && (
        <CowInfoBox
          appWidth={appWidth}
          appHeight={appHeight}
          cow={selectedCow}
          onClose={() => {
            lastCowIdRef.current = null;
            audioMap.click.play();
            const canvas = document.querySelector(
              'canvas',
            ) as HTMLCanvasElement;
            if (canvas) {
              canvas.style.cursor = 'default';
            }
            setSelectedCow(null);
          }}
        />
      )}

      {tutorial == 4 && drawFloatingArrow}
    </>
  );
};
