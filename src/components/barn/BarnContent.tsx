import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAudio, useMenu } from '../../context/hooks';
import { cowXpPerLevel } from '../../data/cowData';
import { AutoPet } from './AutoPet';
import { CowCard } from './CowCard';
import { FloatingHearts } from '../cow/FloatingHeart';
import { Button } from '../menu/Button';
import { useGameStore, type SortTypes } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';
import type { Cow } from '../../game/cowModel';

extend({ Container, Graphics, Text });

const offset = 15;
const titleOffsetY = 30;
const cardOffsetY = 45;
const scrollBarWidth = 5;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const rarityOrder: Record<string, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
};

function getCowValue(cow: Cow) {
  const base = cowXpPerLevel[cow.level - 1] ?? 0;
  let value: number;
  if (cow.level == 10)
    value = Math.round(
      base * cow.stats.valueMultiplier * (1 + cow.hearts / 10),
    );
  else
    value = Math.round(
      (base + cow.xp) * cow.stats.valueMultiplier * (1 + cow.hearts / 10),
    );
  return value;
}

function sortCows(cows: Cow[], sortType: SortTypes) {
  const sorted = [...cows];
  switch (sortType) {
    case 'Inactive':
      return sorted;
    case 'Name (A-Z)':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'Name (Z-A)':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'XP (Low-High)':
      return sorted.sort(
        (a, b) =>
          (cowXpPerLevel[a.level - 1] ?? 0) +
          a.xp -
          ((cowXpPerLevel[b.level - 1] ?? 0) + b.xp),
      );
    case 'XP (High-Low)':
      return sorted.sort(
        (a, b) =>
          (cowXpPerLevel[b.level - 1] ?? 0) +
          b.xp -
          ((cowXpPerLevel[a.level - 1] ?? 0) + a.xp),
      );
    case 'Value (Low-High)':
      return sorted.sort((a, b) => getCowValue(a) - getCowValue(b));
    case 'Value (High-Low)':
      return sorted.sort((a, b) => getCowValue(b) - getCowValue(a));
    case 'Rarity (Low-High)':
      return sorted.sort((a, b) => {
        return rarityOrder[a.stats.rarity] - rarityOrder[b.stats.rarity];
      });
    case 'Rarity (High-Low)':
      return sorted.sort((a, b) => {
        return rarityOrder[b.stats.rarity] - rarityOrder[a.stats.rarity];
      });
    case 'Hearts (Low-High)':
      return sorted.sort((a, b) => a.hearts - b.hearts);
    case 'Hearts (High-Low)':
      return sorted.sort((a, b) => b.hearts - a.hearts);
    default:
      return sorted;
  }
}

export const BarnContent = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { cows, upgrades, sortType } = useGameStore();
  const { setSelectedMenu } = useMenu();

  const [scrollY, setScrollY] = useState(0);
  const [_, setCowHearts] = useState<Record<string, number>>({});
  const [heartEvents, setHeartEvents] = useState<
    { id: string; x: number; y: number }[]
  >([]);

  const scrollContainerRef = useRef<Container>(null);
  const dragging = useRef(false);
  const lastY = useRef(0);

  const handleHeartChange = useCallback(
    (id: string, hearts: number, x: number, y: number) => {
      setCowHearts((prev) => {
        const oldHearts = prev[id] ?? 0;
        const newHearts = hearts;
        if (newHearts > oldHearts) {
          setHeartEvents((prev) => [...prev, { id, x: x, y: y }]);
        }
        return { ...prev, [id]: newHearts };
      });
    },
    [],
  );

  const clearHeartEvents = useCallback(() => {
    setHeartEvents([]);
  }, []);

  const unPetCows = useMemo(() => {
    const now = new Date();
    return cows.filter((cow) => {
      const lastPetDate = new Date(cow.lastPet);
      return (
        now.getFullYear() !== lastPetDate.getFullYear() ||
        now.getMonth() !== lastPetDate.getMonth() ||
        now.getDate() !== lastPetDate.getDate()
      );
    });
  }, [cows]);

  const startY = unPetCows.length > 0 ? 195 : 95;

  let cardHeight = 150;
  if (appWidth > 550) cardHeight = 110;

  const maskHeight = appHeight - footerHeight * 2;
  const contentHeight =
    startY +
    titleOffsetY +
    cardOffsetY * 2 +
    (cardHeight + offset) * cows.length;
  const cardWidth = appWidth - offset * 2;
  const scrollBarHeight = appHeight - (footerHeight + offset) * 2;
  const maxScroll = Math.max(0, contentHeight - maskHeight);
  const trackHeight = scrollBarHeight;
  const thumbHeight = Math.max(
    20,
    (maskHeight / contentHeight) * trackHeight * 0.6,
  );
  const thumbY =
    footerHeight + offset + (scrollY / maxScroll) * (trackHeight - thumbHeight);

  const notBarnedCows = useMemo(() => {
    const filtered = cows.filter((cow) => !cow.barned);
    return sortCows(filtered, sortType);
  }, [cows, sortType]);

  const barnedCows = useMemo(() => {
    const filtered = cows.filter((cow) => cow.barned);
    return sortCows(filtered, sortType);
  }, [cows, sortType]);

  useEffect(() => {
    setScrollY((prev) => Math.min(prev, maxScroll));
  }, [maxScroll]);

  useEffect(() => {
    const initialHearts: Record<string, number> = {};
    cows.forEach((cow) => {
      initialHearts[cow.id] = cow.hearts;
    });
    setCowHearts(initialHearts);
  }, [cows, appWidth, appHeight]);

  function handleScroll(delta: number) {
    setScrollY((prev) => Math.min(maxScroll, Math.max(0, prev + delta)));
  }

  const drawScrollbar = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(
        appWidth - scrollBarWidth,
        footerHeight + offset,
        scrollBarWidth,
        trackHeight,
      );
      g.fill({ color: 'grey', alpha: 0.5 });
      if (maxScroll > 0) {
        g.rect(appWidth - scrollBarWidth, thumbY, scrollBarWidth, thumbHeight);
        g.fill({ color: 'grey' });
      }
    },
    [scrollY, maskHeight, contentHeight, appWidth, appHeight],
  );

  return (
    <>
      {maxScroll > 0 && <pixiGraphics draw={drawScrollbar} />}
      <pixiGraphics
        interactive={true}
        onPointerDown={(e: FederatedPointerEvent) => {
          e.stopPropagation();
          dragging.current = true;
          lastY.current = e.global.y;
        }}
        onPointerMove={(e: FederatedPointerEvent) => {
          if (!dragging.current) return;
          e.stopPropagation();
          const delta = e.global.y - lastY.current;
          lastY.current = e.global.y;
          handleScroll(-delta * 1.5);
        }}
        onPointerUp={(e: FederatedPointerEvent) => {
          e.stopPropagation();
          dragging.current = false;
        }}
        onPointerUpOutside={(e: FederatedPointerEvent) => {
          e.stopPropagation();
          dragging.current = false;
        }}
        onWheel={(e: WheelEvent) => {
          e.stopPropagation();
          handleScroll(e.deltaY * 0.6);
        }}
        draw={(g) => {
          g.clear();
          g.rect(0, footerHeight, appWidth, appHeight - footerHeight * 2);
          g.fill({ alpha: 0 });
        }}
      />
      <pixiContainer
        ref={(c) => {
          scrollContainerRef.current = c;
        }}
        y={-scrollY}
      >
        {unPetCows.length > 0 && (
          <AutoPet x={offset} y={footerHeight + 10} unPetCows={unPetCows} />
        )}

        <pixiText
          x={15}
          y={startY - 10}
          text={`Sort: ${sortType}`}
          style={{ fontSize: 28, fontFamily: 'pixelFont' }}
        />
        <Button
          x={15}
          y={startY - 10 + 45}
          buttonWidth={205}
          buttonHeight={45}
          buttonText={'Change sort'}
          buttonColor={'white'}
          fontsize={28}
          onClick={() => {
            audioMap.type.play();
            setSelectedMenu('sortCow');
          }}
        />

        <FloatingHearts
          heartEvents={heartEvents}
          onConsumed={clearHeartEvents}
        />

        <pixiText
          x={offset}
          y={footerHeight + startY + titleOffsetY}
          text={`Active Cows (${notBarnedCows.length}/${upgrades.farmLevel * 2})`}
          style={{ fontSize: 28, fontFamily: 'pixelFont' }}
        />
        {notBarnedCows.map((cow, i) => {
          const y =
            footerHeight +
            startY +
            titleOffsetY +
            cardOffsetY +
            i * (cardHeight + offset);
          return (
            <CowCard
              key={cow.id}
              x={offset}
              y={y}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              cow={cow}
              onPet={handleHeartChange}
            />
          );
        })}
        {barnedCows.map((cow, i) => {
          const y =
            footerHeight +
            startY +
            titleOffsetY +
            cardOffsetY * 2 +
            notBarnedCows.length * (cardHeight + offset) +
            i * (cardHeight + offset);
          return (
            <CowCard
              key={cow.id}
              x={offset}
              y={y}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              cow={cow}
              onPet={handleHeartChange}
            />
          );
        })}
        <pixiText
          x={offset}
          y={
            footerHeight +
            startY +
            titleOffsetY +
            cardOffsetY +
            notBarnedCows.length * (cardHeight + offset)
          }
          text={`Stored Cows (${barnedCows.length})`}
          style={{ fontSize: 28, fontFamily: 'pixelFont' }}
        />
      </pixiContainer>
    </>
  );
};
