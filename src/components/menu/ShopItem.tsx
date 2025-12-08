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
import { useEffect, useMemo, useState } from 'react';
import { useAudio } from '../../context/hooks';
import { gameUpgrades } from '../../data/gameData';
import { useGameStore, upgrades } from '../../game/store';
import { Button } from './Button';
import type { Upgrades } from '../../game/store';

extend({ Container, Graphics, Sprite, Text });

const boxSize = 50;
const buttonWidth = 60;
const buttonHeight = 33;
const maxFontSize = 22;
const rightOffset = 40;

const upgradeKeys = Object.keys(upgrades) as Array<keyof typeof upgrades>;

type NumberMap = { [key: number]: number | undefined };

interface ShopItemProps {
  y: number;
  maxWidth: number;
  label: string;
  description: string;
  levelText: string;
  imageString: string;
  upgradeName: string;
  prices: NumberMap;
}

function isUpgradeKey(key: any): key is keyof Upgrades {
  return upgradeKeys.includes(key);
}

export const ShopItem = ({
  y,
  maxWidth,
  label,
  description,
  levelText,
  imageString,
  upgradeName,
  prices,
}: ShopItemProps) => {
  const { mooney, upgrades, addUpgrade, removeMooney } = useGameStore();
  const { audioMap } = useAudio();

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [price, setPrice] = useState<number | null>(null);
  const [isMaxed, setIsMaxed] = useState(false);
  const [isMooneyEnough, setIsMooneyEnough] = useState(false);

  const assetNames = ['mooney', imageString];

  function getUpgradeLevel(upgradeName: string): number {
    if (isUpgradeKey(upgradeName)) {
      return upgrades[upgradeName];
    }
    return 0;
  }

  const level = getUpgradeLevel(upgradeName);
  const upgradeFormatters = {
    farmLevel: () => `${levelText} ${level * 2}`,
    harvestCooldownLevel: () =>
      `${levelText} ${
        gameUpgrades.harvestCooldownMinutes -
        (level - 1) * gameUpgrades.harvestCooldownDecreasePerUpgrade
      } mins`,
    harvestDurationLevel: () =>
      `${levelText} ${
        gameUpgrades.harvestDurationSeconds +
        (level - 1) * gameUpgrades.harvetDurationIncreasePerUpgrade
      } secs`,
    harvestMultiplierLevel: () =>
      `${levelText} x${
        gameUpgrades.harvestMultiplier +
        (level - 1) * gameUpgrades.harvestMultiplierIncreasePerUpgrade
      }`,
  } as const;

  let finalLevelText: string;
  if (upgradeName in upgradeFormatters) {
    finalLevelText =
      upgradeFormatters[upgradeName as keyof typeof upgradeFormatters]();
  } else {
    finalLevelText = `${levelText} ${level}`;
  }

  const priceFontSize = useMemo(() => {
    let size = maxFontSize;
    setIsMaxed(false);

    while (size > 8) {
      const newPrice = prices[level + 1] ?? null;
      if (!newPrice) {
        setIsMaxed(true);
        return size;
      }
      setPrice(newPrice);

      const style = new TextStyle({ fontSize: size, fontFamily: 'pixelFont' });
      const temp = new Text({ text: newPrice, style });
      if (temp.width <= maxWidth - buttonWidth - 110) break;
      size -= 1;
    }
    return size;
  }, [mooney, upgrades, level, prices]);

  useEffect(() => {
    if (!isMaxed && price && mooney < price) setIsMooneyEnough(false);
    else setIsMooneyEnough(true);
  }, [mooney]);

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

  const drawBox = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.roundRect(0, 33, boxSize, boxSize, 10);
      g.stroke({ width: 3, color: 'black' });
    };
  }, [boxSize]);

  const drawBar = useMemo(() => {
    return (g: Graphics) => {
      const totalLevels = Object.keys(prices).length;
      const currentLevel = getUpgradeLevel(upgradeName);
      const barWidth = maxWidth - rightOffset;
      const barHeight = 8;
      const segmentWidth = barWidth / totalLevels;

      g.clear();
      for (let i = 0; i < totalLevels; i++) {
        g.rect(i * segmentWidth, boxSize + 80, segmentWidth - 3, barHeight);
        g.fill({ color: i < currentLevel ? 'green' : 'black' });
      }
    };
  }, [prices, upgrades, maxWidth]);

  function handleClick() {
    if (price) {
      audioMap.coin.play();
      removeMooney(price);
    }
    if (isUpgradeKey(upgradeName)) addUpgrade(upgradeName);
  }

  if (!textures.mooney || !textures[imageString]) return null;

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBox} />
      <pixiSprite
        texture={textures[imageString]}
        anchor={0.5}
        x={boxSize / 2}
        y={boxSize / 2 + 33}
        tint={'black'}
      />

      <pixiText
        text={label}
        style={{ fontSize: 22, fontFamily: 'pixelFont' }}
      />
      <pixiText
        x={60}
        y={28}
        text={description}
        style={{
          fontSize: 16,
          fontFamily: 'pixelFont',
          align: 'left',
          wordWrap: true,
          wordWrapWidth: maxWidth - boxSize - 60,
        }}
      />
      <pixiText
        x={60}
        y={66}
        text={`(${finalLevelText})`}
        style={{
          fontSize: 16,
          fontFamily: 'pixelFont',
          align: 'left',
          wordWrap: true,
          wordWrapWidth: maxWidth - boxSize - 60,
        }}
      />

      <pixiSprite texture={textures.mooney} y={boxSize + 41} />
      {!isMaxed && price ? (
        <pixiText
          x={38}
          y={boxSize + 57}
          anchor={{ x: 0, y: 0.5 }}
          text={price.toLocaleString('en-us')}
          style={{ fontSize: priceFontSize, fontFamily: 'pixelFont' }}
        />
      ) : (
        <pixiText
          x={38}
          y={boxSize + 57}
          anchor={{ x: 0, y: 0.5 }}
          text={'Maxed'}
          style={{ fontSize: priceFontSize, fontFamily: 'pixelFont' }}
        />
      )}

      {isMaxed || !isMooneyEnough ? (
        <pixiContainer
          x={maxWidth - buttonWidth - rightOffset}
          y={boxSize + 40}
        >
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
              g.fill({ color: 'grey' });
              g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
              g.stroke({ width: 3, color: 'black' });
            }}
          />
          <pixiText
            x={buttonWidth / 2}
            y={buttonHeight / 2 - 1}
            text={'Buy'}
            anchor={0.5}
            style={{ fontSize: 22, fontFamily: 'pixelFont' }}
          />
        </pixiContainer>
      ) : (
        <Button
          x={maxWidth - buttonWidth - rightOffset}
          y={boxSize + 40}
          buttonWidth={buttonWidth}
          buttonHeight={buttonHeight}
          buttonText={'Buy'}
          buttonColor={'white'}
          ignorePointer={true}
          onClick={handleClick}
        />
      )}

      <pixiGraphics draw={drawBar} />
    </pixiContainer>
  );
};
