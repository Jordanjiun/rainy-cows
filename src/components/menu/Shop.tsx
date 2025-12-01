import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { Fragment, useCallback, useMemo, useState, useEffect } from 'react';
import { useCow, useMenu } from '../../context/hooks';
import { shopItemData } from '../../data/gameData';
import { ShopItem } from './ShopItem';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Graphics, Sprite, Text });

const boxHeight = 400;
const boxWidth = 300;
const buttonSize = 50;
const crossSize = 20;
const crossThickness = 4;
const offset = 20;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const boxColor = '#ebd9c0ff';

export const Shop = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { selectedCow, setSelectedCow } = useCow();
  const { selectedMenu, setSelectedMenu } = useMenu();

  const [isHovered, setIsHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);
  const [shopImage, setShopImage] = useState<Texture | null>(null);

  const iconColor = isHovered ? 'yellow' : 'white';

  useEffect(() => {
    let mounted = true;
    async function loadShopImage() {
      const loaded = await Assets.load<Texture>('store');
      loaded.source.scaleMode = 'linear';
      if (mounted) setShopImage(loaded);
    }
    loadShopImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick() {
    if (selectedCow) {
      setSelectedCow(null);
    }
    if (selectedMenu != 'shop') {
      setSelectedMenu('shop');
    } else {
      setSelectedMenu(null);
    }
  }

  function closeMenu() {
    setCloseHovered(false);
    setSelectedMenu(null);
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

  const drawCloseButton = useMemo(() => {
    return (g: Graphics) => {
      g.clear();
      g.rect(0, 0, crossSize, crossSize);
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

  if (!shopImage) return null;

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
          texture={shopImage}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>

      {selectedMenu == 'shop' && (
        <>
          <pixiGraphics
            interactive={true}
            onPointerDown={(e: FederatedPointerEvent) => e.stopPropagation()}
            onPointerUp={(e: FederatedPointerEvent) => e.stopPropagation()}
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
              y={30}
              text={'Shop'}
              anchor={0.5}
              style={{ fontWeight: 'bold' }}
            />

            {shopItemData.map((item, i) => {
              const y = 55 + i * 25;
              return (
                <Fragment key={item.label}>
                  <ShopItem
                    x={offset}
                    y={y}
                    maxWidth={boxWidth}
                    label={item.label}
                    description={item.description}
                    imageString={item.image}
                    upgradeName={item.upgradeName}
                    prices={item.prices}
                  />
                </Fragment>
              );
            })}
          </pixiContainer>
        </>
      )}
    </>
  );
};
