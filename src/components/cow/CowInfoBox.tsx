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
import { useAudio, useMenu } from '../../context/hooks';
import { cowXpPerLevel } from '../../data/cowData';
import { useGameStore } from '../../game/store';
import { measureText } from '../../game/utils';
import { Button } from '../menu/Button';
import type { Cow, CowStat } from '../../game/cowModel';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 24;
const boxWidth = 210;
const boxHeight = 170;
const crossSize = 15;
const crossThickness = 4;
const offset = 10;
const titleWidth = 140;
const heartMaxNum = 10;
const heartScale = 0.07;
const heartSpacing = 1.6;
const heartY = 75;
const xpBarY = 55;
const infoY = 52;
const buttonWidth = 90;
const buttonHeight = 30;
const maxNameLength = 12;

const assetNames = ['heart', 'noHeart', 'mooney', 'pen'];
const boxColor = '#ebd9c0ff';
const allowedCharRegex = /^[a-zA-Z0-9 ]$/;

const infoRows: { label: string; value: CowStat }[] = [
  { label: 'Eat Chance', value: 'eatChance' },
  { label: 'Bonus Mooney', value: 'extraMooney' },
  { label: 'Value Multiplier', value: 'valueMultiplier' },
];

interface CowInfoBoxProps {
  appWidth: number;
  appHeight: number;
  cow: Cow;
  onClose: () => void;
}

export const CowInfoBox = ({
  appWidth,
  appHeight,
  cow,
  onClose,
}: CowInfoBoxProps) => {
  const { audioMap } = useAudio();
  const { updateCowName } = useGameStore();
  const { setSelectedMenu } = useMenu();

  const [isHovered, setIsHovered] = useState(false);
  const [isInfo, setIsInfo] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [scale, setScale] = useState(1);
  const [renameScale, setRenameScale] = useState(1);
  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [tempName, setTempName] = useState('');
  const [editNameTint, setEditNameTint] = useState('black');

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const textRef = useRef<any>(null);
  const renameTextRef = useRef<any>(null);

  const base = cowXpPerLevel[cow.level - 1] ?? 0;
  let value: number;
  if (cow.level == 10) value = Math.round(base * cow.stats.valueMultiplier);
  else value = Math.round((base + cow.xp) * cow.stats.valueMultiplier);

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
    if (!isRenaming) return;
    setCursorVisible(true);
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, [isRenaming]);

  useEffect(() => {
    setIsRenaming(false);
  }, [cow.id, cow.name]);

  useEffect(() => {
    if (!isRenaming) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = maxNameLength;
    input.value = tempName;
    input.style.position = 'absolute';
    input.style.left = `${appWidth - 187}px`;
    input.style.top = `80px`;
    input.style.width = `${titleWidth}px`;
    input.style.height = '20px';
    input.style.opacity = '0.1';
    input.style.zIndex = '1000';
    input.style.fontSize = `${baseFontSize}px`;
    input.style.fontFamily = 'pixelFont';
    input.style.color = 'black';
    input.style.border = 'none';
    input.style.background = '#000';
    input.style.outline = 'none';
    input.style.caretColor = 'transparent';
    input.style.pointerEvents = 'auto';

    document.body.appendChild(input);
    input.focus({ preventScroll: true });

    const onInput = () => {
      const filtered = [...input.value]
        .filter((ch) => allowedCharRegex.test(ch))
        .join('');
      input.value = filtered;
      setTempName(filtered);
    };
    input.addEventListener('input', onInput);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        updateCowName(cow.id, tempName.trim() || cow.name);
        setIsRenaming(false);
      }
      if (e.key === 'Escape') {
        setTempName(cow.name);
        setIsRenaming(false);
      }
      if (e.key === 'Backspace') {
        setTempName((prev) => prev.slice(0, -1));
      }
      if (e.key.length === 1 && allowedCharRegex.test(e.key)) {
        setTempName((prev) =>
          prev.length < maxNameLength ? prev + e.key : prev,
        );
      }
    };
    window.addEventListener('keydown', handleKey);
    hiddenInputRef.current = input;

    return () => {
      input.removeEventListener('input', onInput);
      window.removeEventListener('keydown', handleKey);
      document.body.removeChild(input);
    };
  }, [isRenaming, tempName, cow.id, appWidth]);

  const drawBox = useCallback(
    (g: Graphics) => {
      g.clear();
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.fill({ color: boxColor });
      g.roundRect(0, 0, boxWidth, boxHeight, 10);
      g.stroke({ width: 3, color: 'black' });
    },
    [appHeight],
  );

  const drawXpBar = useCallback(
    (g: Graphics) => {
      const barWidth = boxWidth - 2 * offset;
      let percentage;
      if (cowXpPerLevel[cow.level])
        percentage = cow.xp / cowXpPerLevel[cow.level];
      else percentage = 1;
      g.clear();
      g.rect(offset, xpBarY, barWidth, 15);
      g.fill({ color: 'black' });
      g.rect(offset, xpBarY, barWidth * percentage, 15);
      g.fill({ color: 'green' });
    },
    [cow.level, cow.xp],
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
            g.rect(-3, -3, crossSize + 6, crossSize + 6);
            g.fill({ alpha: 0 });
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
    textRef.current.style = new TextStyle({
      fontSize: baseFontSize,
      fontFamily: 'pixelFont',
    });
    const bounds = textRef.current.getLocalBounds();
    const textWidth = bounds.width;
    const newScale = textWidth > titleWidth ? titleWidth / textWidth : 1;
    setScale(newScale);
  }, [cow.name, titleWidth]);

  useEffect(() => {
    const textWidth = measureText(tempName || ' ', {
      fontSize: baseFontSize,
      fontFamily: 'pixelFont',
    });
    const maxWidth = titleWidth - 2;
    let newScale = textWidth > maxWidth ? maxWidth / textWidth : 1;
    if (!Number.isFinite(newScale) || newScale <= 0) {
      newScale = 1;
    }
    setRenameScale(newScale);
  }, [tempName, cursorVisible, titleWidth]);

  const drawName = useMemo(
    () => (
      <pixiText
        ref={textRef}
        x={boxWidth / 2}
        y={17}
        text={`${cow.name}`}
        anchor={0.5}
        scale={{ x: scale, y: scale }}
        style={{ fontSize: baseFontSize, fontFamily: 'pixelFont' }}
      />
    ),
    [cow.name, scale],
  );

  const drawLevel = useMemo(
    () => (
      <pixiText
        x={boxWidth / 2}
        y={40}
        text={`(Lvl. ${cow.level})`}
        anchor={0.5}
        style={{ fontSize: 20, fontFamily: 'pixelFont' }}
      />
    ),
    [cow.level],
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
          x={boxWidth / 2}
          y={xpBarY + 7}
          text={`${xpText}`}
          anchor={0.5}
          style={{ fontSize: 14, fill: 'white', fontFamily: 'pixelFont' }}
        />
      </>
    );
  }, [cow.level, cow.xp]);

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
          Array.from({ length: cow.hearts }).map((_, i) => (
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
  }, [textures.noHeart, textures.heart, cow.hearts]);

  const drawValue = useMemo(() => {
    if (!textures.mooney) return null;
    const iconWidth = textures.mooney.width * 0.8;
    const textWidth = measureText(value.toLocaleString('en-US'), {
      fontSize: 18,
    });
    const totalWidthDynamic = iconWidth + textWidth;
    const startX = (boxWidth - totalWidthDynamic) / 2;
    return (
      <pixiContainer x={-6}>
        <pixiSprite
          texture={textures.mooney}
          x={startX - 3}
          y={97}
          scale={0.8}
        />
        <pixiText
          x={startX + iconWidth + 2}
          y={99}
          text={value.toLocaleString('en-US')}
          style={{ fontSize: 20, fontFamily: 'pixelFont' }}
        />
      </pixiContainer>
    );
  }, [textures.mooney, value, boxWidth]);

  const drawInfo = useMemo(() => {
    const lines = [
      `Rarity: ${cow.stats.rarity.charAt(0).toUpperCase() + cow.stats.rarity.slice(1)}`,
      ...infoRows.map((row) => `${row.label}: ${cow.stats[row.value]}`),
    ];
    const maxWidth = Math.max(
      ...lines.map((line) =>
        measureText(line, { fontSize: 16, fontFamily: 'pixelFont' }),
      ),
    );
    return (
      <pixiContainer x={(boxWidth - maxWidth) / 2}>
        <pixiText
          y={infoY}
          text={`Rarity: ${cow.stats.rarity.charAt(0).toUpperCase() + cow.stats.rarity.slice(1)}`}
          style={{ fontSize: 16, fontFamily: 'pixelFont' }}
        />
        {infoRows.map((row, i) => {
          const y = infoY + (i + 1) * 16;
          return (
            <pixiContainer key={row.label}>
              <pixiText
                y={y}
                text={`${row.label}: ${cow.stats[row.value]}`}
                style={{ fontSize: 16, fontFamily: 'pixelFont' }}
              />
            </pixiContainer>
          );
        })}
      </pixiContainer>
    );
  }, [cow.stats]);

  if (!textures.pen) return null;

  return (
    <pixiContainer x={appWidth - boxWidth - offset} y={offset}>
      <pixiGraphics draw={drawBox} />
      {drawCloseButton}
      {!isRenaming && drawName}
      {drawLevel}

      {!isInfo ? (
        <>
          {drawXp}
          {drawHearts}
          {drawValue}
          {isRenaming && (
            <pixiContainer
              x={(boxWidth - titleWidth) / 2}
              y={0}
              interactive={true}
            >
              <pixiContainer x={titleWidth / 2} y={17}>
                <pixiText
                  ref={renameTextRef}
                  text={tempName}
                  anchor={{ x: 0.5, y: 0.5 }}
                  scale={{ x: renameScale, y: renameScale }}
                  style={{
                    fontSize: baseFontSize,
                    fontFamily: 'pixelFont',
                  }}
                />
                {cursorVisible && (
                  <pixiGraphics
                    draw={(g) => {
                      g.clear();
                      const h = baseFontSize - 4;
                      g.setStrokeStyle({ width: 2, color: 'black' });
                      g.moveTo(
                        renameTextRef.current?.width / 2 + 1 || 0,
                        -h / 2,
                      );
                      g.lineTo(
                        renameTextRef.current?.width / 2 + 1 || 0,
                        h / 2,
                      );
                      g.stroke();
                    }}
                  />
                )}
              </pixiContainer>
            </pixiContainer>
          )}

          <pixiSprite
            texture={textures.pen}
            x={boxWidth - 30}
            y={7}
            tint={editNameTint}
            scale={0.6}
            interactive={true}
            cursor="pointer"
            onPointerOver={() => setEditNameTint('green')}
            onPointerOut={() => setEditNameTint('black')}
            onPointerTap={() => {
              audioMap.type.play();
              setTempName('');
              setIsRenaming(!isRenaming);
            }}
          />

          <Button
            x={boxWidth - buttonWidth - offset}
            y={boxHeight - (buttonHeight + offset)}
            buttonWidth={buttonWidth}
            buttonHeight={buttonHeight}
            buttonText={'Info'}
            buttonColor={'white'}
            ignorePointer={true}
            onClick={() => {
              audioMap.type.play();
              if (isRenaming) setIsRenaming(false);
              setIsInfo(true);
            }}
          />
          <Button
            x={offset}
            y={boxHeight - (buttonHeight + offset)}
            buttonWidth={buttonWidth}
            buttonHeight={buttonHeight}
            buttonText={'Sell'}
            buttonColor={'#E28C80'}
            onClick={() => {
              audioMap.type.play();
              setSelectedMenu('sellCow');
            }}
          />
        </>
      ) : (
        <>
          {drawInfo}
          <Button
            x={(boxWidth - buttonWidth) / 2}
            y={boxHeight - (buttonHeight + offset)}
            buttonWidth={buttonWidth}
            buttonHeight={buttonHeight}
            buttonText={'Back'}
            buttonColor={'white'}
            ignorePointer={true}
            onClick={() => {
              audioMap.type.play();
              setIsInfo(false);
            }}
          />
        </>
      )}
    </pixiContainer>
  );
};
