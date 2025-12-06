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
import { useGameStore } from '../../game/store';
import { Cow } from '../../game/cowModel';
import { Button } from './Button';

extend({ Container, Graphics, Sprite, Text });

const boxSize = 50;
const buttonWidth = 60;
const buttonHeight = 33;
const maxFontSize = 22;

const assetNames = ['mooney', 'cowIcon'];

type NumberMap = { [key: number]: number | undefined };

interface BuyCowProps {
  y: number;
  maxWidth: number;
  prices: NumberMap;
}

export const BuyCow = ({ y, maxWidth, prices }: BuyCowProps) => {
  const { cows, mooney, upgrades, addCow, removeMooney } = useGameStore();

  const [textures, setTextures] = useState<Record<string, Texture>>({});
  const [price, setPrice] = useState<number | null>(null);
  const [isMaxed, setIsMaxed] = useState(false);
  const [isMooneyEnough, setIsMooneyEnough] = useState(false);

  const priceFontSize = useMemo(() => {
    let size = maxFontSize;
    setIsMaxed(false);

    while (size > 8) {
      const newPrice = prices[cows.length + 1] ?? null;
      if (!newPrice || cows.length >= upgrades.farmLevel * 2) {
        setIsMaxed(true);
        return size;
      }
      setPrice(newPrice);

      const style = new TextStyle({ fontSize: size });
      const temp = new Text({ text: newPrice, style });
      if (temp.width <= maxWidth - buttonWidth - 165) break;
      size -= 1;
    }
    return size;
  }, [mooney, upgrades.farmLevel, prices]);

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
      g.roundRect(0, 0, boxSize, boxSize, 10);
      g.stroke({ width: 2, color: 'black' });
    };
  }, [boxSize]);

  function handleClick() {
    if (price) {
      removeMooney(price);
      addCow(new Cow(cows));
    }
  }

  if (!textures.mooney || !textures.cowIcon) return null;

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBox} />
      <pixiSprite
        texture={textures.cowIcon}
        anchor={0.5}
        x={boxSize / 2}
        y={boxSize / 2}
        tint={'black'}
      />

      <pixiText x={65} y={-3} text={'Buy Cow'} style={{ fontSize: 18 }} />
      <pixiSprite texture={textures.mooney} x={65} y={20} />

      {!isMaxed && price ? (
        <pixiText
          x={102}
          y={35}
          anchor={{ x: 0, y: 0.5 }}
          text={price.toLocaleString('en-us')}
          style={{ fontSize: priceFontSize }}
        />
      ) : (
        <pixiText
          x={102}
          y={35}
          anchor={{ x: 0, y: 0.5 }}
          text={'Maxed'}
          style={{ fontSize: priceFontSize }}
        />
      )}

      {isMaxed || !isMooneyEnough ? (
        <pixiContainer
          x={maxWidth - buttonWidth - 45}
          y={(boxSize - buttonHeight) / 2}
        >
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
          x={maxWidth - buttonWidth - 45}
          y={(boxSize - buttonHeight) / 2}
          buttonWidth={buttonWidth}
          buttonHeight={buttonHeight}
          buttonText={'Buy'}
          buttonColor={'white'}
          onClick={handleClick}
        />
      )}
    </pixiContainer>
  );
};
