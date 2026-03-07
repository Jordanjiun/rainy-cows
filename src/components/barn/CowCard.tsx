import { extend } from '@pixi/react';
import { AnimatedSprite, Assets, Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cowXpPerLevel, cowConfig } from '../../data/cowData';
import { useCow, useMenu } from '../../context/hooks';
import { useCowAnimations, useCowFilter } from '../../game/cowBuilder';
import { measureText } from '../../game/utils';
import { CardButton } from './CardButton';
import type { Cow } from '../../game/cowModel';
import type { Texture } from 'pixi.js';

extend({ AnimatedSprite, Container, Graphics });

let animY, cowX, buttonX, buttonY, buttonSize;
let infoX = 0;

const barWidth = 190;
const cowScale = 2.5;
const cowNameFontSize = 24;
const heartMaxNum = 10;
const heartScale = 0.07;
const heartSpacing = 1.6;
const heartY = 65;
const xpBarY = 85;
const assetNames = ['dollar', 'mooney', 'heart', 'noHeart', 'pen'];

type ButtonKey = 'SellCow' | 'RenameCow';

interface CowCardProps {
  x: number;
  y: number;
  cardWidth: number;
  cardHeight: number;
  cow: Cow;
}

export const CowCard = ({ x, y, cardWidth, cardHeight, cow }: CowCardProps) => {
  const { setSelectedCow } = useCow();
  const { setSelectedMenu } = useMenu();
  const animations = useCowAnimations(cow.sprite.layers);
  const layerFilters = useCowFilter(cow.sprite);

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const containerRef = useRef<Container>(null);

  const rectSize = cowConfig.frameSize * cowScale;
  const gap = (cardWidth - barWidth - rectSize) / 3;
  const cowName = `${cow.name} (Lvl. ${cow.level})`;
  const textWidth = measureText(cowName || ' ', {
    fontSize: cowNameFontSize,
    fontFamily: 'pixelFont',
  });
  const textScale = textWidth > barWidth ? barWidth / textWidth : 1;

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

  if (cardHeight > 120) {
    animY = 63;
    cowX = x + gap + rectSize / 2;
    infoX = x + gap * 2 + rectSize;
    buttonSize = 35;
    buttonX = infoX;
    buttonY = y + 107;
  } else {
    animY = 45;
    cowX = x + 55;
    infoX = x + 110;
    buttonSize = 50;
    buttonX = infoX + barWidth + 20;
    buttonY = y + (cardHeight - buttonSize) / 2;
  }

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

  const handleButton = (button: ButtonKey) => {
    switch (button) {
      case 'SellCow':
        setSelectedCow(cow);
        setSelectedMenu('sellCow');
        return;
      case 'RenameCow':
        setSelectedCow(cow);
        setSelectedMenu('renameCow');
        return;
      default:
        return null;
    }
  };

  const drawBox = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(x, y, cardWidth, cardHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    };
  }, [x, y, cardWidth, cardHeight]);

  const drawXpBar = useCallback(
    (g: Graphics) => {
      let percentage;
      if (cowXpPerLevel[cow.level])
        percentage = cow.xp / cowXpPerLevel[cow.level];
      else percentage = 1;
      g.clear();
      g.rect(infoX, y + xpBarY, barWidth, 15);
      g.fill({ color: 'black' });
      g.rect(infoX, y + xpBarY, barWidth * percentage, 15);
      g.fill({ color: 'green' });
    },
    [x, y, cow.level, cow.xp, cardWidth, cardHeight],
  );

  const drawXp = useMemo(() => {
    const cowLevel = cow.level;
    let xpText;
    if (cowLevel == 10 || !cowXpPerLevel[cowLevel]) xpText = 'Maxed';
    else {
      xpText =
        cow.xp.toLocaleString('en-US') +
        ` / ${cowXpPerLevel[cowLevel].toLocaleString('en-US')}`;
    }

    return (
      <>
        <pixiGraphics draw={drawXpBar} />
        <pixiText
          x={infoX + barWidth / 2}
          y={y + xpBarY + 7}
          text={`${xpText}`}
          anchor={0.5}
          style={{ fontSize: 16, fill: 'white', fontFamily: 'pixelFont' }}
        />
      </>
    );
  }, [x, y, cow.level, cow.xp, cardWidth, cardHeight]);

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
                infoX + i * (textures.noHeart.width * heartScale + heartSpacing)
              }
              y={y + heartY}
            />
          ))}

        {textures.heart &&
          Array.from({ length: cow.hearts }).map((_, i) => (
            <pixiSprite
              key={i}
              texture={textures.heart}
              scale={heartScale}
              x={infoX + i * (textures.heart.width * heartScale + heartSpacing)}
              y={y + heartY}
            />
          ))}
      </>
    );
  }, [
    x,
    y,
    textures.noHeart,
    textures.heart,
    cow.hearts,
    cardWidth,
    cardHeight,
  ]);

  const drawValue = useMemo(() => {
    if (!textures.mooney) return null;
    return (
      <>
        <pixiSprite
          texture={textures.mooney}
          x={infoX}
          y={y + 35}
          scale={0.8}
        />
        <pixiText
          x={infoX + 32}
          y={y + 34}
          text={value.toLocaleString('en-US')}
          style={{ fontSize: 24, fontFamily: 'pixelFont' }}
        />
      </>
    );
  }, [x, y, textures.mooney, value, cardWidth, cardHeight]);

  if (!animations) return null;

  return (
    <>
      <pixiGraphics draw={drawBox} />
      <pixiContainer ref={containerRef} x={cowX} y={y + animY} scale={cowScale}>
        {Object.entries(animations).map(([layerName, animMap]) => (
          <pixiAnimatedSprite
            key={layerName}
            textures={animMap['idle']}
            anchor={0.5}
            filters={[layerFilters[layerName]]}
          />
        ))}
      </pixiContainer>
      <pixiText
        x={infoX}
        y={y + 20}
        text={`${cow.name} (Lvl. ${cow.level})`}
        anchor={{ x: 0, y: 0.5 }}
        scale={{ x: textScale, y: textScale }}
        style={{ fontSize: cowNameFontSize, fontFamily: 'pixelFont' }}
      />
      {drawHearts}
      {drawXp}
      {drawValue}
      <CardButton
        buttonX={buttonX}
        buttonY={buttonY}
        buttonSize={buttonSize}
        image={textures.dollar}
        onClick={() => handleButton('SellCow')}
      />
      <CardButton
        buttonX={buttonX + buttonSize + 10}
        buttonY={buttonY}
        buttonSize={buttonSize}
        image={textures.pen}
        onClick={() => handleButton('RenameCow')}
      />
    </>
  );
};
