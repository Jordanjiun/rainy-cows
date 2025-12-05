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
import { useMenu } from '../../context/hooks';
import { cowXpPerLevel } from '../../data/cowData';
import { useGameStore } from '../../game/store';
import { Button } from '../menu/Button';
import type { Cow } from '../../models/cowModel';

extend({ Container, Graphics, Sprite, Text });

const baseFontSize = 20;
const boxWidth = 210;
const boxHeight = 150;
const crossSize = 15;
const crossThickness = 4;
const heartMaxNum = 10;
const heartScale = 0.07;
const heartSpacing = 1.6;
const heartY = 55;
const offset = 10;
const titleWidth = 160;
const titleY = 18;
const xpBarY = 35;
const buttonWidth = 90;
const buttonHeight = 35;
const maxNameLength = 10;

const assetNames = ['heart', 'noHeart'];
const boxColor = '#ebd9c0ff';
const allowedCharRegex = /^[a-zA-Z0-9 ]$/;

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
  const { updateCowName } = useGameStore();
  const { setSelectedMenu } = useMenu();

  const [isHovered, setIsHovered] = useState(false);
  const [scale, setScale] = useState(1);
  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
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

  useEffect(() => {
    if (!isRenaming) return;
    const interval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(interval);
  }, [isRenaming]);

  useEffect(() => {
    if (!isRenaming) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        updateCowName(cow.id, tempName.trim() || cow.name);
        setIsRenaming(false);
        return;
      }
      if (e.key === 'Escape') {
        setTempName(cow.name);
        setIsRenaming(false);
        return;
      }
      if (e.key === 'Backspace') {
        setTempName((prev) => prev.slice(0, -1));
        return;
      }

      if (e.key.length === 1 && allowedCharRegex.test(e.key)) {
        setTempName((prev) =>
          prev.length < maxNameLength ? prev + e.key : prev,
        );
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRenaming, tempName]);

  useEffect(() => {
    if (!isRenaming) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = maxNameLength;
    input.value = tempName;
    input.style.position = 'absolute';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    input.style.zIndex = '-1';
    input.style.left = '-1000px';

    document.body.appendChild(input);
    hiddenInputRef.current = input;
    input.focus();

    const onInput = () => {
      const filtered = [...input.value]
        .filter((ch) => allowedCharRegex.test(ch))
        .join('');
      input.value = filtered;
      setTempName(filtered);
    };
    input.addEventListener('input', onInput);

    return () => {
      input.removeEventListener('input', onInput);
      document.body.removeChild(input);
    };
  }, [isRenaming]);

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
      var percentage;
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
  }, [cow.name, titleWidth]);

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
    [cow.name, cow.level, scale],
  );

  const drawXp = useMemo(() => {
    const cowLevel = cow.level;
    var xpText;
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
          style={{ fontSize: 14, fill: 'white' }}
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

  const drawDetails = useMemo(() => {
    const base = cowXpPerLevel[cow.level - 1] ?? 0;
    var value;
    if (cow.level == 10) value = base;
    else value = base + cow.xp;
    return (
      <>
        <pixiText
          x={boxWidth / 2}
          y={75}
          anchor={{ x: 0.5, y: 0 }}
          text={`Value: ${value.toLocaleString('en-US')}`}
          style={{ fontSize: 16 }}
        />
      </>
    );
  }, [cow.level, cow.xp]);

  return (
    <pixiContainer x={appWidth - boxWidth - offset} y={offset}>
      <pixiGraphics draw={drawBox} />
      {drawCloseButton}
      {drawNameAndLevel}
      {drawXp}
      {drawHearts}
      {drawDetails}

      {isRenaming && (
        <pixiContainer
          x={offset}
          y={boxHeight - (buttonHeight + offset) - 49}
          interactive={true}
        >
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(0, 0, boxWidth - offset * 2, 40, 8);
              g.fill({ color: 'white' });
              g.stroke({ width: 2, color: 'black' });
            }}
          />
          <pixiText
            text={`${tempName}${cursorVisible ? '|' : ''}`}
            x={10}
            y={20}
            anchor={{ x: 0, y: 0.5 }}
            style={{ fill: 'black', fontSize: 20 }}
          />
        </pixiContainer>
      )}

      <Button
        x={offset}
        y={boxHeight - (buttonHeight + offset)}
        buttonWidth={buttonWidth}
        buttonHeight={buttonHeight}
        buttonText={'Rename'}
        buttonColor={'white'}
        fontsize={20}
        onClick={() => {
          setTempName('');
          setIsRenaming(true);
        }}
      />
      <Button
        x={boxWidth - buttonWidth - offset}
        y={boxHeight - (buttonHeight + offset)}
        buttonWidth={buttonWidth}
        buttonHeight={buttonHeight}
        buttonText={'Sell'}
        buttonColor={'#E28C80'}
        fontsize={20}
        onClick={() => setSelectedMenu('sellCow')}
      />
    </pixiContainer>
  );
};
