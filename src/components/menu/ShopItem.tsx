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
import { useGameStore, upgrades } from '../../game/store';
import { Button } from './Button';
import type { Upgrades } from '../../game/store';

extend({ Container, Graphics, Sprite, Text });

const boxSize = 50;
const buttonWidth = 60;
const buttonHeight = 33;
const maxFontSize = 22;

const upgradeKeys = Object.keys(upgrades) as Array<keyof typeof upgrades>;

type NumberMap = { [key: number]: number };

interface ShopItemProps {
  x: number;
  y: number;
  maxWidth: number;
  label: string;
  description: string;
  imageString: string;
  upgradeName: string;
  prices: NumberMap;
}

function isUpgradeKey(key: any): key is keyof Upgrades {
  return upgradeKeys.includes(key);
}

export const ShopItem = ({
  x,
  y,
  maxWidth,
  label,
  description,
  imageString,
  upgradeName,
  prices,
}: ShopItemProps) => {
  const { mooney, upgrades, addUpgrade, removeMooney } = useGameStore();

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

  const priceFontSize = useMemo(() => {
    let size = maxFontSize;
    setIsMaxed(false);

    while (size > 8) {
      const newPrice = prices[getUpgradeLevel(upgradeName)] ?? null;
      if (!newPrice) {
        setIsMaxed(true);
        return size;
      }
      setPrice(newPrice);

      const style = new TextStyle({ fontSize: size });
      const temp = new Text({ text: newPrice, style });
      if (temp.width <= maxWidth - buttonWidth - 110) break;
      size -= 1;
    }
    return size;
  }, [mooney, upgrades, prices]);

  useEffect(() => {
    if (!isMaxed && price && mooney < price) {
      setIsMooneyEnough(false);
    } else {
      setIsMooneyEnough(true);
    }
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
      g.roundRect(0, 0, boxSize, boxSize, 10);
      g.stroke({ width: 2, color: 'black' });
    };
  }, [boxSize]);

  const drawBar = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.rect(0, boxSize + 48, maxWidth - 40, 8);
      g.fill({ color: 'black' });
    };
  }, [maxWidth]);

  function handleClick() {
    if (price) {
      removeMooney(price);
    }
    if (isUpgradeKey(upgradeName)) {
      addUpgrade(upgradeName);
    }
  }

  if (!textures.mooney || !textures[imageString]) return null;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawBox} />
      <pixiSprite
        texture={textures[imageString]}
        anchor={0.5}
        x={boxSize / 2}
        y={boxSize / 2}
        tint={'black'}
      />

      <pixiText x={65} y={-3} text={label} style={{ fontSize: 18 }} />
      <pixiText
        x={65}
        y={20}
        text={description}
        style={{
          fontSize: 14,
          align: 'left',
          wordWrap: true,
          wordWrapWidth: maxWidth - boxSize - 60,
        }}
      />

      <pixiSprite texture={textures.mooney} y={boxSize + 8} />
      {!isMaxed && price ? (
        <pixiText
          x={40}
          y={boxSize + 24}
          anchor={{ x: 0, y: 0.5 }}
          text={price.toLocaleString('en-us')}
          style={{ fontSize: priceFontSize }}
        />
      ) : (
        <pixiText
          x={40}
          y={boxSize + 24}
          anchor={{ x: 0, y: 0.5 }}
          text={'Maxed'}
          style={{ fontSize: priceFontSize }}
        />
      )}

      {isMaxed || !isMooneyEnough ? (
        <pixiContainer x={maxWidth - buttonWidth - 40} y={boxSize + 7}>
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
              g.fill({ color: 'grey' });
              g.roundRect(0, 0, buttonWidth, buttonHeight, 10);
              g.stroke({ width: 2, color: 'black' });
            }}
          />
          <pixiText
            x={buttonWidth / 2}
            y={buttonHeight / 2 - 1}
            text={'Buy'}
            anchor={0.5}
            style={{ fontSize: 22 }}
          />
        </pixiContainer>
      ) : (
        <Button
          x={maxWidth - buttonWidth - 40}
          y={boxSize + 7}
          buttonWidth={buttonWidth}
          buttonHeight={buttonHeight}
          buttonText={'Buy'}
          buttonColor={'white'}
          onClick={handleClick}
        />
      )}

      <pixiGraphics draw={drawBar} />
    </pixiContainer>
  );
};
