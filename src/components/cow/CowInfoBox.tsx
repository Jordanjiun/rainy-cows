import { extend } from '@pixi/react';
import {
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cowXpPerLevel } from '../../data/cowData';
import type { Cow } from '../../models/cowModel';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 20;
const boxWidth = 200;
const crossSize = 15;
const crossThickness = 4;
const heartMaxNum = 10;
const heartScale = 0.07;
const heartSpacing = 0.7;
const heartY = 55;
const offset = 10;
const titleWidth = 160;
const titleY = 18;
const xpBarY = 35;

const assetNames = ['heart', 'noHeart'];
const boxColor = '#ebd9c0ff';

interface CowInfoBoxProps {
  appWidth: number;
  appHeight: number;
  cow: Cow;
  xp: number;
  hearts: number;
  onClose: () => void;
}

export const CowInfoBox = ({
  appWidth,
  appHeight,
  cow,
  xp,
  hearts,
  onClose,
}: CowInfoBoxProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [scale, setScale] = useState(1);
  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const textRef = useRef<any>(null);

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

  const drawBox = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, appHeight * 0.27, 10);
      g.fill({ color: boxColor });
      g.roundRect(0, 0, boxWidth, appHeight * 0.27, 10);
      g.stroke({ width: 3, color: 'black' });
    },
    [appHeight],
  );

  const drawXpBar = useCallback(
    (g: Graphics) => {
      const percentage = xp / cowXpPerLevel[cow.level];
      const barWidth = boxWidth - 2 * offset;
      g.clear();
      g.rect(offset, xpBarY, barWidth, 15);
      g.fill({ color: 'black' });
      g.rect(offset, xpBarY, barWidth * percentage, 15);
      g.fill({ color: 'green' });
    },
    [xp],
  );

  const drawCloseButton = useMemo(
    () => (
      <pixiContainer
        x={offset}
        y={offset}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={onClose}
      >
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(0, 0, crossSize, crossSize);
            g.fill({ color: boxColor });

            const stroke = isHovered ? 'red' : 'black';
            g.setStrokeStyle({ width: crossThickness, color: stroke });
            g.moveTo(0, 0);
            g.lineTo(crossSize, crossSize);
            g.moveTo(crossSize, 0);
            g.lineTo(0, crossSize);
            g.stroke();
          }}
        />
      </pixiContainer>
    ),
    [isHovered, onClose],
  );

  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style = new TextStyle({ fontSize: baseFontSize });
    const bounds = textRef.current.getLocalBounds();
    const textWidth = bounds.width;
    const newScale = textWidth > titleWidth ? titleWidth / textWidth : 1;
    setScale(newScale);
  }, [cow, titleWidth]);

  const drawNameAndLevel = useMemo(
    () => (
      <pixiText
        ref={textRef}
        x={(boxWidth + crossSize + offset) / 2}
        y={titleY}
        text={`${cow.name} (Lvl. ${cow.level})`}
        anchor={0.5}
        scale={{ x: scale, y: scale }}
        style={{ fontSize: baseFontSize }}
      />
    ),
    [cow, cow.level, scale],
  );

  const drawXp = useMemo(() => {
    const cowLevel = cow.level;
    var xpText;
    if (cowLevel == 10) {
      xpText = 'Maxed';
    } else {
      xpText =
        xp.toLocaleString('en-US') +
        ` / ${cowXpPerLevel[cowLevel].toLocaleString('en-US')}`;
    }

    return (
      <>
        <pixiGraphics draw={drawXpBar} />
        <pixiText
          x={boxWidth / 2}
          y={xpBarY + 7}
          text={`${xpText}`}
          anchor={0.5}
          style={{ fontSize: 14, fill: 'white' }}
        />
      </>
    );
  }, [cow, xp]);

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
                i * (textures.noHeart.width * heartScale + heartSpacing) +
                offset
              }
              y={heartY}
            />
          ))}

        {textures.heart &&
          Array.from({ length: hearts }).map((_, i) => (
            <pixiSprite
              key={i}
              texture={textures.heart}
              scale={heartScale}
              x={
                i * (textures.heart.width * heartScale + heartSpacing) + offset
              }
              y={heartY}
            />
          ))}
      </>
    );
  }, [textures.noHeart, textures.heart, hearts]);

  return (
    <pixiContainer x={appWidth - boxWidth - offset} y={offset}>
      <pixiGraphics draw={drawBox} />
      {drawCloseButton}
      {drawNameAndLevel}
      {drawXp}
      {drawHearts}
    </pixiContainer>
  );
};
