import { extend } from '@pixi/react';
import { Assets, Graphics, Sprite, Texture } from 'pixi.js';
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useCow } from '../../context/hooks';
import { useFileInput } from '../../context/hooks';
import { useGameStore, exportGameSave, importGameSave } from '../../game/store';
import { Button } from './Button';
import { FinalWarning } from './FinalWarning';
import type { FederatedPointerEvent } from 'pixi.js';
import { Credits } from './Credits';

extend({ Graphics, Sprite });

const boxHeight = 300;
const boxWidth = 200;
const buttonWidth = 170;
const buttonHeight = 40;
const buttonSize = 50;
const crossSize = 20;
const crossThickness = 4;
const offset = 20;

const footerHeight = Number(import.meta.env.VITE_FOOTER_HEIGHT_PX);

const boxColor = '#ebd9c0ff';

export const MainMenu = ({
  appWidth,
  appHeight,
}: {
  appWidth: number;
  appHeight: number;
}) => {
  const { isHarvest } = useGameStore();
  const { selectedCow, setSelectedCow } = useCow();
  const { openFilePicker, onFileSelected } = useFileInput();

  const [isHovered, setIsHovered] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [menuImage, setMenuImage] = useState<Texture | null>(null);

  const iconColor = isHovered ? 'yellow' : 'white';

  onFileSelected((file) => importGameSave(file));

  useEffect(() => {
    let mounted = true;
    async function loadMenuImage() {
      const loaded = await Assets.load<Texture>('menu');
      loaded.source.scaleMode = 'linear';
      if (mounted) setMenuImage(loaded);
    }
    loadMenuImage();
    return () => {
      mounted = false;
    };
  }, []);

  function handleClick() {
    if (selectedCow) {
      setSelectedCow(null);
    }
    setIsHovered(false);
    setMenuOpened(!menuOpened);
  }

  function handleDeleteButton() {
    setMenuOpened(false);
    setIsWarning(true);
  }

  function closeMenu() {
    setCloseHovered(false);
    setMenuOpened(false);
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

  useEffect(() => {
    if (isHarvest) {
      if (menuOpened) {
        setMenuOpened(false);
      }
    }
  }, [isHarvest]);

  if (!menuImage) return null;

  return (
    <>
      <pixiContainer
        x={appWidth - buttonSize - 10}
        y={appHeight - buttonSize - 10}
        interactive={true}
        cursor="pointer"
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerTap={handleClick}
      >
        <pixiGraphics draw={drawButtonBase} />
        <pixiSprite
          texture={menuImage}
          anchor={0.5}
          x={buttonSize / 2}
          y={buttonSize / 2}
          tint={iconColor}
        />
      </pixiContainer>

      {menuOpened && (
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
              text={'Menu'}
              anchor={0.5}
              style={{ fontWeight: 'bold' }}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + offset)}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Delete Save'}
              buttonColor={'#E28C80'}
              onClick={handleDeleteButton}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + offset) * 2}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Export Save'}
              buttonColor={'white'}
              onClick={exportGameSave}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + offset) * 3}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Import Save'}
              buttonColor={'white'}
              onClick={openFilePicker}
            />

            <Button
              x={(boxWidth - buttonWidth) / 2}
              y={boxHeight - (buttonHeight + offset) * 4}
              buttonWidth={buttonWidth}
              buttonHeight={buttonHeight}
              buttonText={'Credits'}
              buttonColor={'white'}
              onClick={() => setIsCredit(true)}
            />
          </pixiContainer>
        </>
      )}

      {isWarning && (
        <FinalWarning
          appWidth={appWidth}
          appHeight={appHeight}
          onClick={() => setIsWarning(false)}
        />
      )}

      {isCredit && (
        <Credits
          appWidth={appWidth}
          appHeight={appHeight}
          onClick={() => setIsCredit(false)}
        />
      )}
    </>
  );
};
