import { extend } from '@pixi/react';
import { AnimatedSprite, Assets, Container, Graphics } from 'pixi.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cowXpPerLevel, cowConfig } from '../../data/cowData';
import {
  useAudio,
  useCow,
  useMenu,
  useScene,
  useToast,
} from '../../context/hooks';
import {
  animationsDef,
  useCowAnimations,
  useCowFilter,
} from '../../game/cowBuilder';
import { useGameStore } from '../../game/store';
import { measureText } from '../../game/utils';
import { CardButton } from './CardButton';
import type { Cow } from '../../game/cowModel';
import type { Texture } from 'pixi.js';

extend({ AnimatedSprite, Container, Graphics });

const barWidth = 190;
const cowScale = 2.5;
const cowNameFontSize = 24;
const heartMaxNum = 10;
const heartScale = 0.07;
const heartSpacing = 1.6;
const heartY = 65;
const xpBarY = 85;
const assetNames = [
  'arrowDown',
  'arrowUp',
  'dollar',
  'game',
  'mooney',
  'heart',
  'noHeart',
  'pen',
];

type ButtonKey = 'SellCow' | 'RenameCow' | 'BarnCow' | 'PlayCow';

interface CowCardProps {
  x: number;
  y: number;
  cardWidth: number;
  cardHeight: number;
  cow: Cow;
  onPet: (id: string, hearts: number, x: number, y: number) => void;
}

export const CowCard = ({
  x,
  y,
  cardWidth,
  cardHeight,
  cow,
  onPet,
}: CowCardProps) => {
  const { audioMap } = useAudio();
  const { setSelectedCow } = useCow();
  const { setSelectedMenu } = useMenu();
  const { switchScene } = useScene();
  const { showToast } = useToast();
  const { cows, upgrades, petCow, updateCowBarned, updateCowLastGame } =
    useGameStore();

  const animations = useCowAnimations(cow.sprite.layers);
  const layerFilters = useCowFilter(cow.sprite);

  const [currentAnim, setCurrentAnim] = useState('idle');
  const [textures, setTextures] = useState<Record<string, Texture>>({});

  const layerRefs = useRef<Record<string, AnimatedSprite | null>>({});
  const containerRef = useRef<Container>(null);

  const rectSize = cowConfig.frameSize * cowScale;
  const gap = (cardWidth - barWidth - rectSize) / 3;
  const cowName = `${cow.name} (Lvl. ${cow.level})`;
  const textWidth = measureText(cowName || ' ', {
    fontSize: cowNameFontSize,
    fontFamily: 'pixelFont',
  });
  const textScale = textWidth > barWidth ? barWidth / textWidth : 1;
  const arrowTexture = cow.barned ? textures.arrowUp : textures.arrowDown;

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

  let animY, cowX;
  let buttonX = 0;
  let buttonY = 0;
  let buttonSize = 0;
  let infoX = 0;

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

  useEffect(() => {
    if (!animations) return;
    Object.entries(animations).forEach(([layerName, animMap]) => {
      const sprite = layerRefs.current[layerName];
      playAnim(sprite, animMap[currentAnim]);
      if (sprite) {
        sprite.filters = [layerFilters[layerName]];
      }
    });
  }, [currentAnim, animations]);

  const playAnim = (
    sprite: AnimatedSprite | null,
    textures: Texture[] | undefined,
  ) => {
    if (!sprite || !textures) return;
    sprite.textures = textures;
    sprite.animationSpeed = cowConfig.animSpeed;
    sprite.play();
  };

  const handlePet = () => {
    if (currentAnim == 'pet') return;
    var soundId = audioMap.moo.play();
    audioMap.moo.rate(cow.pitch ?? 1, soundId);
    onPet(cow.id, petCow(cow.id), cowX, y + animY);

    setTimeout(() => {
      setCurrentAnim('idle');
    }, animationsDef['pet'].length * cowConfig.msPerFrame);
    setCurrentAnim('pet');
  };

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
      case 'BarnCow':
        if (!cow.barned) {
          setSelectedCow(cow);
          setSelectedMenu('storeCow');
        } else {
          if (cows.filter((cow) => !cow.barned).length < upgrades.farmLevel * 2)
            updateCowBarned(cow.id, false);
          else {
            audioMap.wrong.play();
            showToast(
              'Farm is full. Store a cow before making this one active.',
              '#E28C80',
            );
          }
        }
        return;
      case 'PlayCow':
        updateCowLastGame(cow.id);
        setSelectedCow(cow);
        switchScene('HopScene');
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

  const buttons: { image: Texture; action: ButtonKey }[] = [
    { image: textures.dollar, action: 'SellCow' },
    { image: textures.pen, action: 'RenameCow' },
    { image: arrowTexture, action: 'BarnCow' },
  ];

  const now = new Date();
  const lastPetDate = new Date(cow.lastGame);
  const isNewDay =
    now.getFullYear() !== lastPetDate.getFullYear() ||
    now.getMonth() !== lastPetDate.getMonth() ||
    now.getDate() !== lastPetDate.getDate();

  if (isNewDay) {
    buttons.push({ image: textures.game, action: 'PlayCow' });
  }

  return (
    <>
      <pixiGraphics draw={drawBox} />
      <pixiContainer ref={containerRef} x={cowX} y={y + animY} scale={cowScale}>
        {Object.entries(animations).map(([layerName, animMap]) => (
          <pixiAnimatedSprite
            key={layerName}
            ref={(el) => void (layerRefs.current[layerName] = el)}
            textures={animMap[currentAnim]}
            anchor={0.5}
            filters={[layerFilters[layerName]]}
            eventMode="static"
            onPointerTap={handlePet}
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
      {buttons.map((btn, index) => (
        <CardButton
          key={btn.action}
          buttonX={buttonX + index * (buttonSize + 10)}
          buttonY={buttonY}
          buttonSize={buttonSize}
          image={btn.image}
          onClick={() => handleButton(btn.action)}
        />
      ))}
    </>
  );
};
