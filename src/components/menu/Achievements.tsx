import { extend } from '@pixi/react';
import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AchieveItem } from './AchieveItem';
import { useAudio, useCow, useMenu, useToast } from '../../context/hooks';
import { achievementItemData } from '../../data/gameData';
import { useGameStore } from '../../game/store';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics, Sprite, Text });

const boxHeight = 400;
const boxWidth = 325;
const buttonSize = 50;
const crossSize = 20;
const crossThickness = 4;
const offset = 20;
const achieveItemHeight = 60;
const maskHeight = boxHeight - 80;
const scrollBarWidth = 5;
const scrollBarHeight = boxHeight - 2 * offset;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const boxColor = '#ebd9c0ff';

export const Achievements = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { audioMap } = useAudio();
  const { achievements } = useGameStore();
  const { showToast } = useToast();
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();

  const [isHovered, setIsHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);
  const [trophyImage, setTrophyImage] = useState<Texture | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [seenAchievements, setSeenAchievements] = useState<Set<string>>(() => {
    const saved = Object.keys(achievements).filter(
      (label) => achievements[label],
    );
    return new Set(saved);
  });

  const maskRef = useRef<Graphics>(null);
  const scrollContainerRef = useRef<Container>(null);
  const dragging = useRef(false);
  const lastY = useRef(0);

  const iconColor = isHovered ? 'yellow' : 'white';
  const contentHeight = achievementItemData.length * achieveItemHeight;
  const maxScroll = Math.max(0, contentHeight - maskHeight);
  const trackHeight = scrollBarHeight;
  const thumbHeight = Math.max(
    20,
    (maskHeight / contentHeight) * trackHeight * 0.6,
  );
  const thumbY = offset + (scrollY / maxScroll) * (trackHeight - thumbHeight);

  useEffect(() => {
    let mounted = true;
    async function loadTrophyImage() {
      const loaded = await Assets.load<Texture>('trophy');
      loaded.source.scaleMode = 'linear';
      if (mounted) setTrophyImage(loaded);
    }
    loadTrophyImage();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const newlyUnlocked = Object.keys(achievements).filter(
      (label) => achievements[label] && !seenAchievements.has(label),
    );
    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach((label) => {
        audioMap.powerup.play();
        showToast(`Achievement unlocked: ${label}`);
      });
      setSeenAchievements((prev) => {
        const updated = new Set(prev);
        newlyUnlocked.forEach((label) => updated.add(label));
        return updated;
      });
    }
  }, [achievements, seenAchievements]);

  function handleClick() {
    audioMap.click.play();
    if (selectedCow) setSelectedCow(null);
    if (selectedMenu != 'achievements') setSelectedMenu('achievements');
    else {
      setSelectedMenu(null);
      setScrollY(0);
    }
  }

  function handleScroll(delta: number) {
    setScrollY((prev) => Math.min(maxScroll, Math.max(0, prev + delta)));
  }

  function closeMenu() {
    audioMap.click.play();
    setCloseHovered(false);
    setSelectedMenu(null);
    setScrollY(0);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  const drawButtonBase = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.fill({ alpha: 0 });
      g.roundRect(0, 0, buttonSize, buttonSize, 10);
      g.stroke({ width: 2, color: isHovered ? 'yellow' : 'white' });
    };
  }, [isHovered]);

  const drawBase = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.fill({ color: boxColor });
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    },
    [boxWidth, boxHeight, boxColor],
  );

  const drawScrollbar = useCallback(
    (g: Graphics) => {
      g.clear();
      g.rect(
        boxWidth - scrollBarWidth - 2,
        offset,
        scrollBarWidth,
        trackHeight,
      );
      g.fill({ color: 'grey', alpha: 0.5 });
      if (maxScroll > 0) {
        g.rect(
          boxWidth - scrollBarWidth - 2,
          thumbY,
          scrollBarWidth,
          thumbHeight,
        );
        g.fill({ color: 'grey' });
      }
    },
    [scrollY, maskHeight, contentHeight],
  );

  const drawCloseButton = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.rect(-3, -3, crossSize + 6, crossSize + 6);
      g.fill({ alpha: 0 });
      const stroke = closeHovered ? 'red' : 'black';
      g.setStrokeStyle({ width: crossThickness, color: stroke });
      g.moveTo(0, 0);
      g.lineTo(crossSize, crossSize);
      g.moveTo(crossSize, 0);
      g.lineTo(0, crossSize);
      g.stroke();
    };
  }, [closeHovered]);

  const drawMask = useCallback((g: Graphics) => {
    g.clear();
    g.rect(-5, -5, boxWidth - offset, maskHeight);
    g.fill({ alpha: 0 });
  }, []);

  if (!trophyImage) return null;

  return (
    <>
      <pixiContainer
        x={appWidth - (buttonSize + 10) * 2}
        y={appHeight - buttonSize - 10}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={handleClick}
      >
        <pixiGraphics draw={drawButtonBase} />
        <pixiSprite
          texture={trophyImage}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>

      {selectedMenu == 'achievements' && (
        <>
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
              g.rect(0, 0, appWidth, appHeight - footerHeight);
              g.fill({ alpha: 0 });
            }}
          />

          <pixiContainer
            x={(appWidth - boxWidth) / 2}
            y={(appHeight - boxHeight - footerHeight) / 2}
          >
            <pixiGraphics draw={drawBase} />
            <pixiGraphics draw={drawScrollbar} />

            <pixiContainer
              x={offset}
              y={offset}
              interactive={true}
              cursor="pointer"
              onPointerOver={() => setCloseHovered(true)}
              onPointerOut={() => setCloseHovered(false)}
              onPointerTap={closeMenu}
            >
              <pixiGraphics draw={drawCloseButton} />
            </pixiContainer>

            <pixiText
              x={boxWidth / 2}
              y={29}
              text={'Achievements'}
              anchor={0.5}
              style={{ fontSize: 28, fontFamily: 'pixelFont' }}
            />

            <pixiContainer x={offset} y={60}>
              <pixiGraphics
                draw={drawMask}
                ref={(g) => {
                  maskRef.current = g;
                  if (g && scrollContainerRef.current) {
                    scrollContainerRef.current.mask = g;
                  }
                }}
              />
              <pixiContainer
                ref={(c) => {
                  scrollContainerRef.current = c;
                  if (c && maskRef.current) {
                    c.mask = maskRef.current;
                  }
                }}
                y={-scrollY}
              >
                {achievementItemData.map((item, i) => {
                  const y = i * achieveItemHeight;
                  return (
                    <AchieveItem
                      key={item.label}
                      y={y}
                      maxWidth={boxWidth}
                      label={item.label}
                      statName={item.statName}
                      target={item.target}
                    />
                  );
                })}
              </pixiContainer>
            </pixiContainer>
          </pixiContainer>
        </>
      )}
    </>
  );
};
