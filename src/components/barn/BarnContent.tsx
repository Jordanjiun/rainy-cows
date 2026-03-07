import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/store';
import { CowCard } from './CowCard';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Text });

const offset = 15;
const cardStartY = 55;
const scrollBarWidth = 5;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

export const BarnContent = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { cows, upgrades } = useGameStore();

  const [scrollY, setScrollY] = useState(0);

  const scrollContainerRef = useRef<Container>(null);
  const dragging = useRef(false);
  const lastY = useRef(0);

  let cardHeight = 150;
  if (appWidth > 450) cardHeight = 110;

  const maskHeight = appHeight - footerHeight * 2;
  const contentHeight = cardStartY * 2 + (cardHeight + offset) * cows.length;
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

  useEffect(() => {
    setScrollY((prev) => Math.min(prev, maxScroll));
  }, [maxScroll]);

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
    [scrollY, maskHeight, contentHeight],
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
        <pixiText
          x={offset}
          y={footerHeight + 10}
          text={`Active Cows (${cows.length}/${upgrades.farmLevel * 2})`}
          style={{ fontSize: 28, fontFamily: 'pixelFont' }}
        />
        {cows.map((cow, i) => {
          const y = footerHeight + cardStartY + i * (cardHeight + offset);
          return (
            <CowCard
              key={cow.id}
              x={offset}
              y={y}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              cow={cow}
            />
          );
        })}
        <pixiText
          x={offset}
          y={footerHeight + cardStartY + cows.length * (cardHeight + offset)}
          text={'Stored Cows'}
          style={{ fontSize: 28, fontFamily: 'pixelFont' }}
        />
      </pixiContainer>
    </>
  );
};
